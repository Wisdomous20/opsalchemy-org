import {
  CalendarConflictError,
  type CalendarMeeting,
  type CalendarSchedulingGateway,
} from "@/application/ports/calendar-scheduling-gateway";

const MINIMUM_DURATION_MS = 15 * 60 * 1_000;
const MAXIMUM_DURATION_MS = 120 * 60 * 1_000;
const MAXIMUM_ADVANCE_MS = 180 * 24 * 60 * 60 * 1_000;

export interface ScheduleConsultationInput {
  readonly bookingKey: string;
  readonly attendeeEmail: string;
  readonly attendeeName: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly timeZone: string;
  readonly confirmed: boolean;
}

export type ScheduleConsultationResult =
  | { readonly status: "booked"; readonly meeting: CalendarMeeting }
  | { readonly status: "conflict" }
  | { readonly status: "confirmation_required" }
  | { readonly status: "invalid_time" };

export class ScheduleConsultation {
  constructor(
    private readonly gateway: CalendarSchedulingGateway,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(input: ScheduleConsultationInput): Promise<ScheduleConsultationResult> {
    if (!input.confirmed) return { status: "confirmation_required" };

    const start = new Date(input.startTime);
    const end = new Date(input.endTime);
    const duration = end.getTime() - start.getTime();
    const earliestStart = this.now().getTime();

    if (
      !Number.isFinite(start.getTime()) ||
      !Number.isFinite(end.getTime()) ||
      start.getTime() <= earliestStart ||
      start.getTime() > earliestStart + MAXIMUM_ADVANCE_MS ||
      duration < MINIMUM_DURATION_MS ||
      duration > MAXIMUM_DURATION_MS
    ) {
      return { status: "invalid_time" };
    }

    const existing = await this.gateway.findByBookingKey(input.bookingKey);
    if (existing) return { status: "booked", meeting: existing };

    if (!(await this.gateway.isAvailable(input.startTime, input.endTime))) {
      return { status: "conflict" };
    }

    try {
      return {
        status: "booked",
        meeting: await this.gateway.createMeeting(input),
      };
    } catch (error) {
      if (error instanceof CalendarConflictError) return { status: "conflict" };
      throw error;
    }
  }
}
