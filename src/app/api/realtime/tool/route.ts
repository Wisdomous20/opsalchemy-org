import { randomUUID } from "node:crypto";
import { AssistantUnavailableError } from "@/application/use-cases/answer-business-question";
import { getAnswerBusinessQuestion } from "@/server/composition/assistant";
import {
  consumeAssistantRateLimit,
  getRateLimitIdentifier,
} from "@/server/security/rate-limiter";
import { realtimeToolRequestSchema } from "@/server/validation/realtime-tool-request";

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

  if (contentLength > MAX_REQUEST_BYTES)
    return jsonResponse({ error: "request_too_large", requestId }, 413);
  if (
    !request.headers.get("content-type")?.toLowerCase().startsWith("application/json")
  )
    return jsonResponse({ error: "unsupported_media_type", requestId }, 415);

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

  const parsed = realtimeToolRequestSchema.safeParse(rawBody);
  if (!parsed.success)
    return jsonResponse({ error: "invalid_request", requestId }, 400);

  try {
    const result = await getAnswerBusinessQuestion().execute({
      conversationId: parsed.data.conversationId,
      message: parsed.data.query,
      history: parsed.data.history,
      channel: "browser-voice",
    });

    console.info(
      JSON.stringify({
        event: "realtime.knowledge_tool.completed",
        requestId,
        conversationId: parsed.data.conversationId,
        callId: parsed.data.callId,
        latencyMs: Math.round(performance.now() - startedAt),
        citationCount: result.citations.length,
      }),
    );

    return jsonResponse(
      { answer: result.answer, citations: result.citations, requestId },
      200,
      { "X-RateLimit-Remaining": String(rateLimit.remaining) },
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "realtime.knowledge_tool.failed",
        requestId,
        conversationId: parsed.data.conversationId,
        callId: parsed.data.callId,
        latencyMs: Math.round(performance.now() - startedAt),
        errorType: error instanceof Error ? error.name : "UnknownError",
      }),
    );

    return jsonResponse(
      {
        error:
          error instanceof AssistantUnavailableError
            ? "assistant_unavailable"
            : "internal_error",
        requestId,
      },
      error instanceof AssistantUnavailableError ? 503 : 500,
    );
  }
}
