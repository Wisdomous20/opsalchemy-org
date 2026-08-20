import type { CalendarSchedulingGateway } from "@/application/ports/calendar-scheduling-gateway";
import {
  CONSULTATION_TIME_ZONE_LABEL,
  consultationSlotsForDate,
  type ConsultationSlot,
} from "@/domain/scheduling/consultation-policy";

const MAXIMUM_ADVANCE_MS = 180 * 24 * 60 * 60 * 1_000;

export interface FindConsultationSlotsResult {
  readonly date: string;
  readonly timeZone: typeof CONSULTATION_TIME_ZONE_LABEL;
  readonly slots: readonly ConsultationSlot[];
}

export class FindConsultationSlots {
  constructor(
    private readonly gateway: CalendarSchedulingGateway,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(date: string): Promise<FindConsultationSlotsResult> {
    const candidates = consultationSlotsForDate(date);
    if (candidates.length === 0) {
      return { date, timeZone: CONSULTATION_TIME_ZONE_LABEL, slots: [] };
    }

    const now = this.now().getTime();
    const latest = now + MAXIMUM_ADVANCE_MS;
    const futureCandidates = candidates.filter((slot) => {
      const start = new Date(slot.startTime).getTime();
      return start > now && start <= latest;
    });
    if (futureCandidates.length === 0) {
      return { date, timeZone: CONSULTATION_TIME_ZONE_LABEL, slots: [] };
    }

    const busy = await this.gateway.getBusyPeriods(
      futureCandidates[0].startTime,
      futureCandidates.at(-1)!.endTime,
    );
    const slots = futureCandidates.filter((slot) => {
      const start = new Date(slot.startTime).getTime();
      const end = new Date(slot.endTime).getTime();
      return !busy.some((period) => {
        const busyStart = new Date(period.startTime).getTime();
        const busyEnd = new Date(period.endTime).getTime();
        return busyStart < end && busyEnd > start;
      });
    });

    return { date, timeZone: CONSULTATION_TIME_ZONE_LABEL, slots };
  }
}
