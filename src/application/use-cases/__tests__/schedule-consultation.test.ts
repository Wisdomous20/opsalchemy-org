import { describe, expect, it, vi } from "vitest";
import {
  CalendarConflictError,
  type CalendarSchedulingGateway,
} from "@/application/ports/calendar-scheduling-gateway";
import { ScheduleConsultation } from "../schedule-consultation";

const meeting = {
  eventId: "event-1",
  htmlLink: "https://calendar.google.com/event/1",
  meetLink: "https://meet.google.com/abc-defg-hij",
  startTime: "2026-09-01T10:00:00+08:00",
  endTime: "2026-09-01T10:30:00+08:00",
};

const validInput = {
  bookingKey: "booking-key",
  attendeeEmail: "visitor@example.com",
  attendeeName: "Visitor Name",
  startTime: meeting.startTime,
  endTime: meeting.endTime,
  timeZone: "Asia/Shanghai",
  confirmed: true,
};

function createGateway(): CalendarSchedulingGateway {
  return {
    findByBookingKey: vi.fn().mockResolvedValue(null),
    isAvailable: vi.fn().mockResolvedValue(true),
    createMeeting: vi.fn().mockResolvedValue(meeting),
  };
}

describe("ScheduleConsultation", () => {
  it("requires explicit confirmation before reading or writing the calendar", async () => {
    const gateway = createGateway();
    const useCase = new ScheduleConsultation(
      gateway,
      () => new Date("2026-08-20T00:00:00Z"),
    );

    await expect(useCase.execute({ ...validInput, confirmed: false })).resolves.toEqual(
      { status: "confirmation_required" },
    );
    expect(gateway.findByBookingKey).not.toHaveBeenCalled();
    expect(gateway.createMeeting).not.toHaveBeenCalled();
  });

  it("returns an existing booking without creating a duplicate", async () => {
    const gateway = createGateway();
    vi.mocked(gateway.findByBookingKey).mockResolvedValue(meeting);
    const useCase = new ScheduleConsultation(
      gateway,
      () => new Date("2026-08-20T00:00:00Z"),
    );

    await expect(useCase.execute(validInput)).resolves.toEqual({
      status: "booked",
      meeting,
    });
    expect(gateway.isAvailable).not.toHaveBeenCalled();
    expect(gateway.createMeeting).not.toHaveBeenCalled();
  });

  it("does not create an event when the slot is busy", async () => {
    const gateway = createGateway();
    vi.mocked(gateway.isAvailable).mockResolvedValue(false);
    const useCase = new ScheduleConsultation(
      gateway,
      () => new Date("2026-08-20T00:00:00Z"),
    );

    await expect(useCase.execute(validInput)).resolves.toEqual({
      status: "conflict",
    });
    expect(gateway.createMeeting).not.toHaveBeenCalled();
  });

  it("creates a meeting when the confirmed slot is available", async () => {
    const gateway = createGateway();
    const useCase = new ScheduleConsultation(
      gateway,
      () => new Date("2026-08-20T00:00:00Z"),
    );

    await expect(useCase.execute(validInput)).resolves.toEqual({
      status: "booked",
      meeting,
    });
    expect(gateway.createMeeting).toHaveBeenCalledWith(validInput);
  });

  it("translates an insert-time race into a slot conflict", async () => {
    const gateway = createGateway();
    vi.mocked(gateway.createMeeting).mockRejectedValue(new CalendarConflictError());
    const useCase = new ScheduleConsultation(
      gateway,
      () => new Date("2026-08-20T00:00:00Z"),
    );

    await expect(useCase.execute(validInput)).resolves.toEqual({
      status: "conflict",
    });
  });

  it.each([
    { startTime: "2026-08-19T10:00:00+08:00", endTime: "2026-08-19T10:30:00+08:00" },
    { startTime: "2026-09-01T10:00:00+08:00", endTime: "2026-09-01T10:05:00+08:00" },
    { startTime: "2026-09-01T10:00:00+08:00", endTime: "2026-09-01T13:00:00+08:00" },
  ])("rejects unsafe time ranges before calendar access", async (times) => {
    const gateway = createGateway();
    const useCase = new ScheduleConsultation(
      gateway,
      () => new Date("2026-08-20T00:00:00Z"),
    );

    await expect(useCase.execute({ ...validInput, ...times })).resolves.toEqual({
      status: "invalid_time",
    });
    expect(gateway.findByBookingKey).not.toHaveBeenCalled();
  });
});
