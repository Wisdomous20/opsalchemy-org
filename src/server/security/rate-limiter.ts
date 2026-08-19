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

export function resetAssistantRateLimitsForTests(): void {
  entries.clear();
}
