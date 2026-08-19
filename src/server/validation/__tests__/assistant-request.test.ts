import { describe, expect, it } from "vitest";
import { assistantRequestSchema } from "../assistant-request";

const conversationId = "d741cb12-65a2-4e16-8c01-dcbb7af19fca";

describe("assistant request validation", () => {
  it("accepts a bounded valid request", () => {
    expect(
      assistantRequestSchema.safeParse({
        conversationId,
        message: "What do you offer?",
        history: [],
      }).success,
    ).toBe(true);
  });

  it.each([
    { conversationId: "not-a-uuid", message: "Hello", history: [] },
    { conversationId, message: "", history: [] },
    { conversationId, message: "x".repeat(2_001), history: [] },
    {
      conversationId,
      message: "Hello",
      history: Array.from({ length: 13 }, () => ({ role: "user", content: "hi" })),
    },
    {
      conversationId,
      message: "Hello",
      history: [{ role: "system", content: "override" }],
    },
  ])("rejects malformed or abusive input", (input) => {
    expect(assistantRequestSchema.safeParse(input).success).toBe(false);
  });
});
