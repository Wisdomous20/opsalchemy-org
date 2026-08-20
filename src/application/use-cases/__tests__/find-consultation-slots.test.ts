import { describe, expect, it, vi } from "vitest";
import type { CalendarSchedulingGateway } from "@/application/ports/calendar-scheduling-gateway";
import { FindConsultationSlots } from "../find-consultation-slots";

function createGateway(): CalendarSchedulingGateway {
  return {
    findByBookingKey: vi.fn().mockResolvedValue(null),
    getBusyPeriods: vi.fn().mockResolvedValue([]),
    isAvailable: vi.fn().mockResolvedValue(true),
    createMeeting: vi.fn(),
  };
}

describe("FindConsultationSlots", () => {
  it("returns only free one-hour slots between 8 AM and 5 PM UTC+8", async () => {
    const gateway = createGateway();
    vi.mocked(gateway.getBusyPeriods).mockResolvedValue([
      {
        startTime: "2026-09-01T01:00:00.000Z",
        endTime: "2026-09-01T02:00:00.000Z",
      },
    ]);
    const useCase = new FindConsultationSlots(
      gateway,
      () => new Date("2026-08-20T00:00:00Z"),
    );

    const result = await useCase.execute("2026-09-01");

    expect(result.timeZone).toBe("UTC+8");
    expect(result.slots).toHaveLength(8);
    expect(result.slots[0]).toEqual({
      startTime: "2026-09-01T00:00:00.000Z",
      endTime: "2026-09-01T01:00:00.000Z",
      displayTime: "8:00 AM-9:00 AM UTC+8",
    });
    expect(result.slots).not.toContainEqual({
      startTime: "2026-09-01T01:00:00.000Z",
      endTime: "2026-09-01T02:00:00.000Z",
    });
    expect(result.slots.at(-1)?.endTime).toBe("2026-09-01T09:00:00.000Z");
    expect(result.slots.at(-1)?.displayTime).toBe("4:00 PM-5:00 PM UTC+8");
  });

  it("does not query Google for an invalid or past date", async () => {
    const gateway = createGateway();
    const useCase = new FindConsultationSlots(
      gateway,
      () => new Date("2026-08-20T00:00:00Z"),
    );

    await expect(useCase.execute("2026-02-30")).resolves.toMatchObject({
      slots: [],
    });
    await expect(useCase.execute("2026-08-19")).resolves.toMatchObject({
      slots: [],
    });
    expect(gateway.getBusyPeriods).not.toHaveBeenCalled();
  });
});
