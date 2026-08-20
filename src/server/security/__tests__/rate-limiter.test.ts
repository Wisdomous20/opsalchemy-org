import { beforeEach, describe, expect, it } from "vitest";
import {
  consumeAssistantRateLimit,
  consumeSchedulingRateLimit,
  resetAssistantRateLimitsForTests,
} from "../rate-limiter";

describe("assistant rate limiter", () => {
  beforeEach(resetAssistantRateLimitsForTests);

  it("allows ten requests within a minute and denies the eleventh", () => {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      expect(consumeAssistantRateLimit("visitor", 1_000).allowed).toBe(true);
    }

    const denied = consumeAssistantRateLimit("visitor", 1_000);
    expect(denied.allowed).toBe(false);
    expect(denied.retryAfterSeconds).toBe(60);
  });

  it("isolates different visitors", () => {
    for (let attempt = 0; attempt < 10; attempt += 1)
      consumeAssistantRateLimit("visitor-a", 1_000);
    expect(consumeAssistantRateLimit("visitor-b", 1_000).allowed).toBe(true);
  });

  it("resets the window after one minute", () => {
    for (let attempt = 0; attempt < 10; attempt += 1)
      consumeAssistantRateLimit("visitor", 1_000);
    expect(consumeAssistantRateLimit("visitor", 61_000).allowed).toBe(true);
  });

  it("bounds distinct calendar writes without charging idempotent retries", () => {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      expect(
        consumeSchedulingRateLimit("visitor", `booking-${attempt}`, 1_000).allowed,
      ).toBe(true);
    }

    expect(consumeSchedulingRateLimit("visitor", "booking-0", 1_000).allowed).toBe(
      true,
    );
    const denied = consumeSchedulingRateLimit("visitor", "booking-10", 1_000);
    expect(denied.allowed).toBe(false);
    expect(denied.retryAfterSeconds).toBe(3_600);
  });
});
