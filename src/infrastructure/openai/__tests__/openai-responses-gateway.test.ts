import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createResponse } = vi.hoisted(() => ({
  createResponse: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("openai", () => ({
  default: class OpenAI {
    readonly responses = { create: createResponse };
  },
}));

import { OpenAIResponsesGateway } from "../openai-responses-gateway";

describe("OpenAIResponsesGateway", () => {
  beforeEach(() => {
    createResponse.mockReset();
  });

  it("continues from availability through scheduling to a final chat answer", async () => {
    const startTime = "2026-08-24T08:00:00+08:00";
    const findConsultationSlots = vi.fn().mockResolvedValue({
      date: "2026-08-24",
      timeZone: "UTC+8",
      slots: [
        {
          startTime,
          endTime: "2026-08-24T09:00:00+08:00",
          displayTime: "8:00 AM to 9:00 AM",
        },
      ],
    });
    const scheduleConsultation = vi.fn().mockResolvedValue({
      status: "booked",
      meeting: {
        id: "meeting-1",
        htmlLink: "https://calendar.google.com/event/meeting-1",
        meetLink: "https://meet.google.com/example",
        startTime: "2026-08-24T00:00:00.000Z",
        endTime: "2026-08-24T01:00:00.000Z",
      },
    });

    createResponse
      .mockResolvedValueOnce({
        output: [
          {
            type: "function_call",
            name: "find_consultation_slots",
            call_id: "availability-call",
            arguments: '{"date":"2026-08-24"}',
          },
        ],
        output_text: "",
        usage: { input_tokens: 10, output_tokens: 5 },
      })
      .mockResolvedValueOnce({
        output: [
          {
            type: "function_call",
            name: "schedule_consultation",
            call_id: "schedule-call",
            arguments: JSON.stringify({
              attendeeEmail: "visitor@example.com",
              attendeeName: "Visitor Name",
              attendeePhone: "+1 202 555 0147",
              contactConsent: true,
              startTime,
              confirmed: true,
            }),
          },
        ],
        output_text: "",
        usage: { input_tokens: 20, output_tokens: 5 },
      })
      .mockResolvedValueOnce({
        output: [],
        output_text: "Your consultation is booked.",
        usage: { input_tokens: 30, output_tokens: 10 },
      });

    const gateway = new OpenAIResponsesGateway({
      apiKey: "test-key",
      model: "test-model",
      vectorStoreId: "vector-store",
      findConsultationSlots,
      scheduleConsultation,
    });

    const result = await gateway.respond({
      conversationId: "11111111-1111-4111-8111-111111111111",
      channel: "text",
      userMessage: "Yes, book it.",
      history: [],
      serviceCandidates: [],
    });

    expect(findConsultationSlots).toHaveBeenCalledWith("2026-08-24");
    expect(scheduleConsultation).toHaveBeenCalledWith({
      attendeeEmail: "visitor@example.com",
      attendeeName: "Visitor Name",
      attendeePhone: "+1 202 555 0147",
      channel: "text",
      contactConsent: true,
      serviceInterests: [],
      startTime,
      confirmed: true,
      bookingKey: createHash("sha256")
        .update("11111111-1111-4111-8111-111111111111:2026-08-24T00:00:00.000Z")
        .digest("hex"),
    });
    expect(createResponse).toHaveBeenCalledTimes(3);
    expect(result.answer).toBe("Your consultation is booked.");
    expect(result.usage).toEqual({ inputTokens: 60, outputTokens: 20 });
  });

  it("does not schedule a time that was not verified in the current tool flow", async () => {
    const scheduleConsultation = vi.fn();
    createResponse
      .mockResolvedValueOnce({
        output: [
          {
            type: "function_call",
            name: "schedule_consultation",
            call_id: "unverified-schedule-call",
            arguments: JSON.stringify({
              attendeeEmail: "visitor@example.com",
              attendeeName: "Visitor Name",
              attendeePhone: "+1 202 555 0147",
              contactConsent: true,
              startTime: "2026-08-24T08:00:00+08:00",
              confirmed: true,
            }),
          },
        ],
        output_text: "",
        usage: null,
      })
      .mockResolvedValueOnce({
        output: [],
        output_text: "I need to refresh availability before booking that time.",
        usage: null,
      });

    const gateway = new OpenAIResponsesGateway({
      apiKey: "test-key",
      model: "test-model",
      vectorStoreId: "vector-store",
      findConsultationSlots: vi.fn(),
      scheduleConsultation,
    });

    const result = await gateway.respond({
      conversationId: "11111111-1111-4111-8111-111111111111",
      channel: "text",
      userMessage: "Yes, book it.",
      history: [],
      serviceCandidates: [],
    });

    expect(scheduleConsultation).not.toHaveBeenCalled();
    expect(createResponse.mock.calls[1]?.[0].input).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "function_call_output",
          call_id: "unverified-schedule-call",
          output: JSON.stringify({ status: "availability_check_required" }),
        }),
      ]),
    );
    expect(result.answer).toContain("refresh availability");
  });
});
