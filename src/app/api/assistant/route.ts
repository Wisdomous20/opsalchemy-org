import { randomUUID } from "node:crypto";
import { AssistantUnavailableError } from "@/application/use-cases/answer-business-question";
import { getAnswerBusinessQuestion } from "@/server/composition/assistant";
import {
  consumeAssistantRateLimit,
  getRateLimitIdentifier,
} from "@/server/security/rate-limiter";
import { assistantRequestSchema } from "@/server/validation/assistant-request";

export const runtime = "nodejs";

const MAX_REQUEST_BYTES = 32_000;

function jsonResponse(body: unknown, status: number, headers?: HeadersInit): Response {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...headers,
    },
  });
}

export async function POST(request: Request): Promise<Response> {
  const requestId = randomUUID();
  const startedAt = performance.now();
  const contentLength = Number(request.headers.get("content-length") ?? "0");

  if (contentLength > MAX_REQUEST_BYTES) {
    return jsonResponse({ error: "request_too_large", requestId }, 413);
  }

  if (
    !request.headers.get("content-type")?.toLowerCase().startsWith("application/json")
  ) {
    return jsonResponse({ error: "unsupported_media_type", requestId }, 415);
  }

  const rateLimit = consumeAssistantRateLimit(getRateLimitIdentifier(request));
  if (!rateLimit.allowed) {
    return jsonResponse({ error: "rate_limited", requestId }, 429, {
      "Retry-After": String(rateLimit.retryAfterSeconds),
    });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return jsonResponse({ error: "invalid_json", requestId }, 400);
  }

  const parsed = assistantRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return jsonResponse({ error: "invalid_request", requestId }, 400);
  }

  try {
    const result = await getAnswerBusinessQuestion().execute(parsed.data);
    const latencyMs = Math.round(performance.now() - startedAt);

    console.info(
      JSON.stringify({
        event: "assistant.response",
        requestId,
        conversationId: parsed.data.conversationId,
        status: "success",
        latencyMs,
        citationCount: result.citations.length,
        inputTokens: result.usage?.inputTokens ?? null,
        outputTokens: result.usage?.outputTokens ?? null,
      }),
    );

    return jsonResponse(
      {
        answer: result.answer,
        citations: result.citations,
        requestId,
      },
      200,
      { "X-RateLimit-Remaining": String(rateLimit.remaining) },
    );
  } catch (error) {
    const latencyMs = Math.round(performance.now() - startedAt);
    console.error(
      JSON.stringify({
        event: "assistant.response",
        requestId,
        conversationId: parsed.data.conversationId,
        status: "failure",
        latencyMs,
        errorType: error instanceof Error ? error.name : "UnknownError",
      }),
    );

    if (error instanceof AssistantUnavailableError) {
      return jsonResponse({ error: "assistant_unavailable", requestId }, 503);
    }
    return jsonResponse({ error: "internal_error", requestId }, 500);
  }
}
