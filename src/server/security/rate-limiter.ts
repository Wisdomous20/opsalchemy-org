import { createHash } from "node:crypto";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitResult {
  readonly allowed: boolean;
  readonly remaining: number;
  readonly retryAfterSeconds: number;
}

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;
const entries = new Map<string, RateLimitEntry>();
const SCHEDULING_WINDOW_MS = 60 * 60_000;
const MAX_SCHEDULING_REQUESTS = 10;
interface SchedulingRateLimitEntry extends RateLimitEntry {
  readonly operationKeys: Set<string>;
}
const schedulingEntries = new Map<string, SchedulingRateLimitEntry>();

function anonymize(identifier: string): string {
  return createHash("sha256").update(identifier).digest("hex").slice(0, 24);
}

export function getRateLimitIdentifier(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const connectingIp = request.headers.get("cf-connecting-ip")?.trim();
  return anonymize(forwardedFor || connectingIp || "anonymous");
}

export function consumeAssistantRateLimit(
  identifier: string,
  now = Date.now(),
): RateLimitResult {
  const existing = entries.get(identifier);

  if (!existing || existing.resetAt <= now) {
    entries.set(identifier, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS - 1, retryAfterSeconds: 0 };
  }

  if (existing.count >= MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1_000)),
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: MAX_REQUESTS - existing.count,
    retryAfterSeconds: 0,
  };
}

export function consumeSchedulingRateLimit(
  identifier: string,
  operationKey: string,
  now = Date.now(),
): RateLimitResult {
  const existing = schedulingEntries.get(identifier);

  if (!existing || existing.resetAt <= now) {
    schedulingEntries.set(identifier, {
      count: 1,
      resetAt: now + SCHEDULING_WINDOW_MS,
      operationKeys: new Set([operationKey]),
    });
    return {
      allowed: true,
      remaining: MAX_SCHEDULING_REQUESTS - 1,
      retryAfterSeconds: 0,
    };
  }

  // Realtime delivery can retry the same function call. It is already
  // idempotent at the Calendar boundary and must not consume another quota unit.
  if (existing.operationKeys.has(operationKey)) {
    return {
      allowed: true,
      remaining: MAX_SCHEDULING_REQUESTS - existing.count,
      retryAfterSeconds: 0,
    };
  }

  if (existing.count >= MAX_SCHEDULING_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1_000)),
    };
  }

  existing.count += 1;
  existing.operationKeys.add(operationKey);
  return {
    allowed: true,
    remaining: MAX_SCHEDULING_REQUESTS - existing.count,
    retryAfterSeconds: 0,
  };
}

export function resetAssistantRateLimitsForTests(): void {
  entries.clear();
  schedulingEntries.clear();
}
