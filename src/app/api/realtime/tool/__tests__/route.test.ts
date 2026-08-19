import { beforeEach, describe, expect, it, vi } from "vitest";
import { AssistantUnavailableError } from "@/application/use-cases/answer-business-question";
import { getAnswerBusinessQuestion } from "@/server/composition/assistant";
import { resetAssistantRateLimitsForTests } from "@/server/security/rate-limiter";
import { POST } from "../route";

vi.mock("@/server/composition/assistant", () => ({
  getAnswerBusinessQuestion: vi.fn(),
}));

const validBody = {
  conversationId: "5a37b573-b3f9-4768-8b3a-e240abbcc933",
  callId: "call_123",
  query: "What does Operations Mentorship help with?",
  history: [],
};
const execute = vi.fn();

function request(body: unknown): Request {
  return new Request("http://localhost/api/realtime/tool", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": "192.0.2.11",
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("POST /api/realtime/tool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetAssistantRateLimitsForTests();
    vi.mocked(getAnswerBusinessQuestion).mockReturnValue({ execute } as never);
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("uses the grounded application policy with the browser voice channel", async () => {
    execute.mockResolvedValue({
      answer: "Operations Mentorship supports repeatable workflows.",
      citations: [{ sourceId: "file_1", title: "Public knowledge", excerpt: "SOPs" }],
    });

    const response = await POST(request(validBody));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.citations).toHaveLength(1);
    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: "browser-voice",
        message: validBody.query,
      }),
    );
  });

  it("rejects invalid tool arguments before the use case", async () => {
    const response = await POST(request({ ...validBody, query: "" }));
    expect(response.status).toBe(400);
    expect(execute).not.toHaveBeenCalled();
  });

  it("does not expose upstream failure details", async () => {
    execute.mockRejectedValue(new AssistantUnavailableError());

    const response = await POST(request(validBody));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error).toBe("assistant_unavailable");
    expect(JSON.stringify(body)).not.toContain("sk-");
    expect(JSON.stringify(body)).not.toContain("upstream");
  });
});
