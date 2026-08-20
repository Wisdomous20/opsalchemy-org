export const CONSULTATION_DURATION_MINUTES = 60;
export const CONSULTATION_TIME_ZONE = "Etc/GMT-8";
export const CONSULTATION_TIME_ZONE_LABEL = "UTC+8";
export const CONSULTATION_START_HOUR = 8;
export const CONSULTATION_END_HOUR = 17;

const UTC_PLUS_8_MS = 8 * 60 * 60 * 1_000;
const CONSULTATION_DURATION_MS = CONSULTATION_DURATION_MINUTES * 60 * 1_000;

export interface ConsultationSlot {
  readonly startTime: string;
  readonly endTime: string;
  /** Authoritative local-time label for assistants and user interfaces. */
  readonly displayTime: string;
}

function formatHour(hour: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const twelveHour = hour % 12 || 12;
  return `${twelveHour}:00 ${period}`;
}

export function consultationEndTime(startTime: string): string | null {
  const start = new Date(startTime);
  if (!Number.isFinite(start.getTime())) return null;
  return new Date(start.getTime() + CONSULTATION_DURATION_MS).toISOString();
}

export function isAllowedConsultationStart(startTime: string): boolean {
  const start = new Date(startTime);
  if (!Number.isFinite(start.getTime())) return false;
  const local = new Date(start.getTime() + UTC_PLUS_8_MS);
  return (
    local.getUTCMinutes() === 0 &&
    local.getUTCSeconds() === 0 &&
    local.getUTCMilliseconds() === 0 &&
    local.getUTCHours() >= CONSULTATION_START_HOUR &&
    local.getUTCHours() < CONSULTATION_END_HOUR
  );
}

export function consultationSlotsForDate(date: string): readonly ConsultationSlot[] {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return [];
  const day = new Date(`${date}T00:00:00+08:00`);
  if (!Number.isFinite(day.getTime())) return [];
  const normalizedDate = new Date(day.getTime() + UTC_PLUS_8_MS)
    .toISOString()
    .slice(0, 10);
  if (normalizedDate !== date) return [];

  return Array.from(
    { length: CONSULTATION_END_HOUR - CONSULTATION_START_HOUR },
    (_, index) => {
      const hour = CONSULTATION_START_HOUR + index;
      const start = new Date(`${date}T${String(hour).padStart(2, "0")}:00:00+08:00`);
      return {
        startTime: start.toISOString(),
        endTime: new Date(start.getTime() + CONSULTATION_DURATION_MS).toISOString(),
        displayTime: `${formatHour(hour)}-${formatHour(hour + 1)} ${CONSULTATION_TIME_ZONE_LABEL}`,
      };
    },
  );
}
