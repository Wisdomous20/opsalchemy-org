export interface CalendarMeetingRequest {
  readonly bookingKey: string;
  readonly attendeeEmail: string;
  readonly attendeeName: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly timeZone: string;
}

export interface CalendarMeeting {
  readonly eventId: string;
  readonly htmlLink: string;
  readonly meetLink: string;
  readonly startTime: string;
  readonly endTime: string;
}

export interface CalendarSchedulingGateway {
  findByBookingKey(bookingKey: string): Promise<CalendarMeeting | null>;
  isAvailable(startTime: string, endTime: string): Promise<boolean>;
  createMeeting(request: CalendarMeetingRequest): Promise<CalendarMeeting>;
}

export class CalendarConflictError extends Error {
  constructor() {
    super("The requested calendar slot is no longer available.");
    this.name = "CalendarConflictError";
  }
}
