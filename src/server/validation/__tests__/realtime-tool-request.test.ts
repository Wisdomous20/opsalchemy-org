import { describe, expect, it } from "vitest";
import { realtimeToolRequestSchema } from "@/server/validation/realtime-tool-request";

describe("realtimeToolRequestSchema", () => {
  const validRequest = {
    conversationId: "5a37b573-b3f9-4768-8b3a-e240abbcc933",
    callId: "call_123",
    query: "What service helps with documented workflows?",
    history: [],
  };

  it("accepts a bounded knowledge tool request", () => {
    expect(realtimeToolRequestSchema.safeParse(validRequest).success).toBe(true);
  });

  it("rejects empty, oversized, and excessive conversation data", () => {
    expect(
      realtimeToolRequestSchema.safeParse({ ...validRequest, query: "" }).success,
    ).toBe(false);
    expect(
      realtimeToolRequestSchema.safeParse({
        ...validRequest,
        query: "x".repeat(2_001),
      }).success,
    ).toBe(false);
    expect(
      realtimeToolRequestSchema.safeParse({
        ...validRequest,
        history: Array.from({ length: 13 }, () => ({
          role: "user",
          content: "test",
        })),
      }).success,
    ).toBe(false);
  });
});
