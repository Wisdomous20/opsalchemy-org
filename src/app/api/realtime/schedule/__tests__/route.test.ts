import { beforeEach, describe, expect, it, vi } from "vitest";
import { getScheduleConsultation } from "@/server/composition/scheduling";
import { resetAssistantRateLimitsForTests } from "@/server/security/rate-limiter";
import { POST } from "../route";

vi.mock("@/server/composition/scheduling", () => ({
  getScheduleConsultation: vi.fn(),
}));

const execute = vi.fn();
const validBody = {
  conversationId: "5a37b573-b3f9-4768-8b3a-e240abbcc933",
  callId: "call_123",
  attendeeEmail: "visitor@example.com",
  attendeeName: "Visitor Name",
  startTime: "2026-09-01T10:00:00+08:00",
  endTime: "2026-09-01T10:30:00+08:00",
  timeZone: "Asia/Shanghai",
  confirmed: true,
};

function request(body: unknown): Request {
  return new Request("http://localhost/api/realtime/schedule", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": "192.0.2.21",
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("POST /api/realtime/schedule", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetAssistantRateLimitsForTests();
    vi.mocked(getScheduleConsultation).mockReturnValue({ execute } as never);
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("derives the idempotency key on the server and schedules the meeting", async () => {
    execute.mockResolvedValue({ status: "conflict" });

    const response = await POST(request(validBody));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("conflict");
    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({
        attendeeEmail: validBody.attendeeEmail,
        bookingKey: expect.stringMatching(/^[a-f0-9]{64}$/),
      }),
    );
  });

  it("rejects malformed booking details before the calendar use case", async () => {
    const response = await POST(
      request({ ...validBody, attendeeEmail: "not-an-email" }),
    );

    expect(response.status).toBe(400);
    expect(execute).not.toHaveBeenCalled();
  });

  it("fails safely when scheduling is not configured", async () => {
    vi.mocked(getScheduleConsultation).mockReturnValue(null);

    const response = await POST(request(validBody));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error).toBe("scheduling_unavailable");
  });

  it("does not expose upstream OAuth failures", async () => {
    execute.mockRejectedValue(new Error("refresh_token=secret-value"));

    const response = await POST(request(validBody));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(JSON.stringify(body)).not.toContain("secret-value");
  });
});
