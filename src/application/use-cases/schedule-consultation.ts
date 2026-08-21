import {
  CalendarConflictError,
  type CalendarMeeting,
  type CalendarSchedulingGateway,
} from "@/application/ports/calendar-scheduling-gateway";
import {
  CONSULTATION_TIME_ZONE,
  consultationEndTime,
  isAllowedConsultationStart,
} from "@/domain/scheduling/consultation-policy";
import type { ConversationChannel } from "@/domain/conversations/conversation";
import type { ServiceId } from "@/domain/services/service-offering";
import type { CaptureLead } from "./capture-lead";

const MAXIMUM_ADVANCE_MS = 180 * 24 * 60 * 60 * 1_000;

export interface ScheduleConsultationInput {
  readonly bookingKey: string;
  readonly attendeeEmail: string;
  readonly attendeeName: string;
  readonly attendeePhone: string;
  readonly channel: ConversationChannel;
  readonly contactConsent: boolean;
  readonly serviceInterests: readonly ServiceId[];
  readonly startTime: string;
  readonly confirmed: boolean;
}

export type ScheduleConsultationResult =
  | { readonly status: "booked"; readonly meeting: CalendarMeeting }
  | { readonly status: "conflict" }
  | { readonly status: "confirmation_required" }
  | { readonly status: "consent_required" }
  | { readonly status: "invalid_time" };

export class ScheduleConsultation {
  constructor(
    private readonly gateway: CalendarSchedulingGateway,
    private readonly captureLead: CaptureLead,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(input: ScheduleConsultationInput): Promise<ScheduleConsultationResult> {
    if (!input.confirmed) return { status: "confirmation_required" };
    if (!input.contactConsent) return { status: "consent_required" };

    const start = new Date(input.startTime);
    const endTime = consultationEndTime(input.startTime);
    const earliestStart = this.now().getTime();

    if (
      !Number.isFinite(start.getTime()) ||
      !endTime ||
      !isAllowedConsultationStart(input.startTime) ||
      start.getTime() <= earliestStart ||
      start.getTime() > earliestStart + MAXIMUM_ADVANCE_MS
    ) {
      return { status: "invalid_time" };
    }

    const capture = await this.captureLead.execute({
      name: input.attendeeName,
      email: input.attendeeEmail,
      phone: input.attendeePhone,
      channel: input.channel,
      serviceInterests: input.serviceInterests,
      consentConfirmed: input.contactConsent,
    });
    if (capture.status !== "captured") return { status: "consent_required" };

    const existing = await this.gateway.findByBookingKey(input.bookingKey);
    if (existing) return { status: "booked", meeting: existing };

    const startTime = start.toISOString();
    if (!(await this.gateway.isAvailable(startTime, endTime))) {
      return { status: "conflict" };
    }

    try {
      return {
        status: "booked",
        meeting: await this.gateway.createMeeting({
          bookingKey: input.bookingKey,
          attendeeEmail: input.attendeeEmail,
          attendeeName: input.attendeeName,
          startTime,
          endTime,
          timeZone: CONSULTATION_TIME_ZONE,
        }),
      };
    } catch (error) {
      if (error instanceof CalendarConflictError) return { status: "conflict" };
      throw error;
    }
  }
}
