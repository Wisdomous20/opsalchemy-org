import { beforeEach, describe, expect, it, vi } from "vitest";
import { getFindConsultationSlots } from "@/server/composition/scheduling";
import { resetAssistantRateLimitsForTests } from "@/server/security/rate-limiter";
import { POST } from "../route";

vi.mock("@/server/composition/scheduling", () => ({
  getFindConsultationSlots: vi.fn(),
}));

const execute = vi.fn();
const validBody = {
  conversationId: "5a37b573-b3f9-4768-8b3a-e240abbcc933",
  callId: "call_availability",
  date: "2026-09-01",
};

function request(body: unknown): Request {
  return new Request("http://localhost/api/realtime/availability", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": "192.0.2.31",
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/realtime/availability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetAssistantRateLimitsForTests();
    vi.mocked(getFindConsultationSlots).mockReturnValue({ execute } as never);
  });

  it("returns only the application-provided available slots", async () => {
    execute.mockResolvedValue({
      date: validBody.date,
      timeZone: "UTC+8",
      slots: [
        {
          startTime: "2026-09-01T00:00:00.000Z",
          endTime: "2026-09-01T01:00:00.000Z",
          displayTime: "8:00 AM-9:00 AM UTC+8",
        },
      ],
    });

    const response = await POST(request(validBody));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.slots).toHaveLength(1);
    expect(execute).toHaveBeenCalledWith(validBody.date);
  });

  it("rejects malformed dates before calendar access", async () => {
    const response = await POST(request({ ...validBody, date: "tomorrow" }));

    expect(response.status).toBe(400);
    expect(execute).not.toHaveBeenCalled();
  });
});
