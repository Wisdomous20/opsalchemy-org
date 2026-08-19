import { randomUUID } from "node:crypto";
import { RealtimeUnavailableError } from "@/application/use-cases/create-realtime-session";
import { getCreateRealtimeSession } from "@/server/composition/realtime";
import {
  consumeAssistantRateLimit,
  getRateLimitIdentifier,
} from "@/server/security/rate-limiter";
import { realtimeSessionRequestSchema } from "@/server/validation/realtime-session-request";

export const runtime = "nodejs";

const MAX_REQUEST_BYTES = 1_000;

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

  const parsed = realtimeSessionRequestSchema.safeParse(rawBody);
  if (!parsed.success)
    return jsonResponse({ error: "invalid_request", requestId }, 400);

  try {
    const session = await getCreateRealtimeSession().execute(
      parsed.data.conversationId,
    );
    console.info(
      JSON.stringify({
        event: "realtime.session.created",
        requestId,
        conversationId: parsed.data.conversationId,
        expiresAt: session.expiresAt.toISOString(),
        latencyMs: Math.round(performance.now() - startedAt),
      }),
    );

    return jsonResponse(
      {
        clientSecret: session.clientSecret,
        expiresAt: session.expiresAt.toISOString(),
        requestId,
      },
      201,
      { "X-RateLimit-Remaining": String(rateLimit.remaining) },
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "realtime.session.failed",
        requestId,
        conversationId: parsed.data.conversationId,
        latencyMs: Math.round(performance.now() - startedAt),
        errorType: error instanceof Error ? error.name : "UnknownError",
      }),
    );
    return jsonResponse(
      {
        error:
          error instanceof RealtimeUnavailableError
            ? "voice_unavailable"
            : "internal_error",
        requestId,
      },
      error instanceof RealtimeUnavailableError ? 503 : 500,
    );
  }
}
