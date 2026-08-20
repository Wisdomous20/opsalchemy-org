import { randomUUID } from "node:crypto";
import { getFindConsultationSlots } from "@/server/composition/scheduling";
import {
  consumeAssistantRateLimit,
  getRateLimitIdentifier,
} from "@/server/security/rate-limiter";
import { findConsultationSlotsRequestSchema } from "@/server/validation/schedule-consultation-request";

export const runtime = "nodejs";

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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "invalid_json", requestId }, 400);
  }
  const parsed = findConsultationSlotsRequestSchema.safeParse(body);
  if (!parsed.success)
    return jsonResponse({ error: "invalid_request", requestId }, 400);

  const finder = getFindConsultationSlots();
  if (!finder) return jsonResponse({ error: "scheduling_unavailable", requestId }, 503);

  try {
    const result = await finder.execute(parsed.data.date);
    return jsonResponse({ status: "ok", ...result, requestId }, 200, {
      "X-RateLimit-Remaining": String(rateLimit.remaining),
    });
  } catch {
    return jsonResponse({ error: "scheduling_unavailable", requestId }, 503);
  }
}
