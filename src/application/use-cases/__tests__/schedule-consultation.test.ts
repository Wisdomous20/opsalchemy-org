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
  endTime: "2026-09-01T11:00:00+08:00",
};

const validInput = {
  bookingKey: "booking-key",
  attendeeEmail: "visitor@example.com",
  attendeeName: "Visitor Name",
  attendeePhone: "+1 202 555 0147",
  channel: "text" as const,
  contactConsent: true,
  serviceInterests: [],
  startTime: meeting.startTime,
  confirmed: true,
};

function createGateway(): CalendarSchedulingGateway {
  return {
    findByBookingKey: vi.fn().mockResolvedValue(null),
    getBusyPeriods: vi.fn().mockResolvedValue([]),
    isAvailable: vi.fn().mockResolvedValue(true),
    createMeeting: vi.fn().mockResolvedValue(meeting),
  };
}

function createUseCase(
  gateway: CalendarSchedulingGateway,
  captureLead = { execute: vi.fn().mockResolvedValue({ status: "captured" }) },
) {
  return new ScheduleConsultation(
    gateway,
    captureLead as never,
    () => new Date("2026-08-20T00:00:00Z"),
  );
}

describe("ScheduleConsultation", () => {
  it("requires explicit confirmation before reading or writing the calendar", async () => {
    const gateway = createGateway();
    const useCase = createUseCase(gateway);

    await expect(useCase.execute({ ...validInput, confirmed: false })).resolves.toEqual(
      { status: "confirmation_required" },
    );
    expect(gateway.findByBookingKey).not.toHaveBeenCalled();
    expect(gateway.createMeeting).not.toHaveBeenCalled();
  });

  it("requires contact consent before reading or writing the calendar", async () => {
    const gateway = createGateway();
    const useCase = createUseCase(gateway);

    await expect(
      useCase.execute({ ...validInput, contactConsent: false }),
    ).resolves.toEqual({ status: "consent_required" });
    expect(gateway.findByBookingKey).not.toHaveBeenCalled();
    expect(gateway.createMeeting).not.toHaveBeenCalled();
  });

  it("returns an existing booking without creating a duplicate", async () => {
    const gateway = createGateway();
    vi.mocked(gateway.findByBookingKey).mockResolvedValue(meeting);
    const useCase = createUseCase(gateway);

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
    const useCase = createUseCase(gateway);

    await expect(useCase.execute(validInput)).resolves.toEqual({
      status: "conflict",
    });
    expect(gateway.createMeeting).not.toHaveBeenCalled();
  });

  it("creates a meeting when the confirmed slot is available", async () => {
    const gateway = createGateway();
    const useCase = createUseCase(gateway);

    await expect(useCase.execute(validInput)).resolves.toEqual({
      status: "booked",
      meeting,
    });
    expect(gateway.createMeeting).toHaveBeenCalledWith({
      bookingKey: validInput.bookingKey,
      attendeeEmail: validInput.attendeeEmail,
      attendeeName: validInput.attendeeName,
      startTime: "2026-09-01T02:00:00.000Z",
      endTime: "2026-09-01T03:00:00.000Z",
      timeZone: "Etc/GMT-8",
    });
  });

  it("captures the consenting lead before creating the calendar event", async () => {
    const gateway = createGateway();
    const captureLead = {
      execute: vi.fn().mockResolvedValue({ status: "captured" }),
    };
    const useCase = createUseCase(gateway, captureLead);

    await useCase.execute(validInput);

    expect(captureLead.execute).toHaveBeenCalledWith({
      name: validInput.attendeeName,
      email: validInput.attendeeEmail,
      phone: validInput.attendeePhone,
      channel: validInput.channel,
      serviceInterests: validInput.serviceInterests,
      consentConfirmed: true,
    });
    expect(captureLead.execute.mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(gateway.createMeeting).mock.invocationCallOrder[0] ?? Infinity,
    );
  });

  it("does not create a calendar event when lead persistence fails", async () => {
    const gateway = createGateway();
    const captureLead = {
      execute: vi.fn().mockRejectedValue(new Error("database unavailable")),
    };
    const useCase = createUseCase(gateway, captureLead);

    await expect(useCase.execute(validInput)).rejects.toThrow("database unavailable");
    expect(gateway.findByBookingKey).not.toHaveBeenCalled();
    expect(gateway.createMeeting).not.toHaveBeenCalled();
  });

  it("translates an insert-time race into a slot conflict", async () => {
    const gateway = createGateway();
    vi.mocked(gateway.createMeeting).mockRejectedValue(new CalendarConflictError());
    const useCase = createUseCase(gateway);

    await expect(useCase.execute(validInput)).resolves.toEqual({
      status: "conflict",
    });
  });

  it.each([
    { startTime: "2026-08-19T10:00:00+08:00" },
    { startTime: "2026-09-01T07:00:00+08:00" },
    { startTime: "2026-09-01T16:30:00+08:00" },
    { startTime: "2026-09-01T17:00:00+08:00" },
  ])("rejects past, off-hour, and outside-hours starts", async (times) => {
    const gateway = createGateway();
    const useCase = createUseCase(gateway);

    await expect(useCase.execute({ ...validInput, ...times })).resolves.toEqual({
      status: "invalid_time",
    });
    expect(gateway.findByBookingKey).not.toHaveBeenCalled();
  });
});
