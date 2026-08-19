import { describe, expect, it } from "vitest";
import { realtimeSessionRequestSchema } from "@/server/validation/realtime-session-request";

describe("realtimeSessionRequestSchema", () => {
  it("accepts a valid conversation identifier", () => {
    expect(
      realtimeSessionRequestSchema.safeParse({
        conversationId: "5a37b573-b3f9-4768-8b3a-e240abbcc933",
      }).success,
    ).toBe(true);
  });

  it("rejects missing and non-UUID identifiers", () => {
    expect(realtimeSessionRequestSchema.safeParse({}).success).toBe(false);
    expect(
      realtimeSessionRequestSchema.safeParse({ conversationId: "visitor" }).success,
    ).toBe(false);
  });
});
