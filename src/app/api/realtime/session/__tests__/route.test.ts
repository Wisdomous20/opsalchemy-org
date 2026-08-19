import { beforeEach, describe, expect, it, vi } from "vitest";
import { RealtimeUnavailableError } from "@/application/use-cases/create-realtime-session";
import { getCreateRealtimeSession } from "@/server/composition/realtime";
import { resetAssistantRateLimitsForTests } from "@/server/security/rate-limiter";
import { POST } from "../route";

vi.mock("@/server/composition/realtime", () => ({
  getCreateRealtimeSession: vi.fn(),
}));

const conversationId = "5a37b573-b3f9-4768-8b3a-e240abbcc933";
const execute = vi.fn();

function request(body: unknown, contentType = "application/json"): Request {
  return new Request("http://localhost/api/realtime/session", {
    method: "POST",
    headers: { "Content-Type": contentType, "x-forwarded-for": "192.0.2.10" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("POST /api/realtime/session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetAssistantRateLimitsForTests();
    vi.mocked(getCreateRealtimeSession).mockReturnValue({ execute } as never);
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("returns only a short-lived client credential", async () => {
    execute.mockResolvedValue({
      clientSecret: "ek_test_ephemeral",
      expiresAt: new Date("2026-08-19T08:00:00Z"),
    });

    const response = await POST(request({ conversationId }));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.clientSecret).toBe("ek_test_ephemeral");
    expect(JSON.stringify(body)).not.toContain("sk-");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it.each([
    [request({ conversationId }, "text/plain"), 415],
    [request("not-json"), 400],
    [request({ conversationId: "forged" }), 400],
  ])("rejects malformed public input", async (incoming, status) => {
    const response = await POST(incoming);
    expect(response.status).toBe(status);
    expect(execute).not.toHaveBeenCalled();
  });

  it("returns a safe error when the credential provider fails", async () => {
    execute.mockRejectedValue(new RealtimeUnavailableError());

    const response = await POST(request({ conversationId }));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error).toBe("voice_unavailable");
    expect(JSON.stringify(body)).not.toContain("upstream");
    expect(JSON.stringify(body)).not.toContain("sk-");
  });
});
