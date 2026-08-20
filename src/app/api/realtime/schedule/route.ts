import { createHash, randomUUID } from "node:crypto";
import { getScheduleConsultation } from "@/server/composition/scheduling";
import {
  consumeSchedulingRateLimit,
  getRateLimitIdentifier,
} from "@/server/security/rate-limiter";
import { scheduleConsultationRequestSchema } from "@/server/validation/schedule-consultation-request";

export const runtime = "nodejs";

const MAX_REQUEST_BYTES = 8_000;

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
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_REQUEST_BYTES) {
    return jsonResponse({ error: "request_too_large", requestId }, 413);
  }
  if (
    !request.headers.get("content-type")?.toLowerCase().startsWith("application/json")
  ) {
    return jsonResponse({ error: "unsupported_media_type", requestId }, 415);
  }

  const rateLimit = consumeSchedulingRateLimit(getRateLimitIdentifier(request));
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
  const parsed = scheduleConsultationRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return jsonResponse({ error: "invalid_request", requestId }, 400);
  }

  const scheduler = getScheduleConsultation();
  if (!scheduler) {
    return jsonResponse({ error: "scheduling_unavailable", requestId }, 503);
  }

  try {
    const { conversationId, callId, ...details } = parsed.data;
    const bookingKey = createHash("sha256")
      .update(`${conversationId}:${callId}`)
      .digest("hex");
    const result = await scheduler.execute({ ...details, bookingKey });
    console.info(
      JSON.stringify({
        event: "assistant.consultation_schedule",
        requestId,
        conversationId,
        status: result.status,
      }),
    );
    return jsonResponse({ ...result, requestId }, 200, {
      "X-RateLimit-Remaining": String(rateLimit.remaining),
    });
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "assistant.consultation_schedule",
        requestId,
        status: "failure",
        errorType: error instanceof Error ? error.name : "UnknownError",
      }),
    );
    return jsonResponse({ error: "scheduling_unavailable", requestId }, 503);
  }
}
