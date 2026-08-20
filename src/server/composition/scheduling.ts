import "server-only";

import { ScheduleConsultation } from "@/application/use-cases/schedule-consultation";
import { GoogleCalendarSchedulingGateway } from "@/infrastructure/google/google-calendar-scheduling-gateway";
import type { ServerEnv } from "@/server/config/env-schema";
import { getServerEnv } from "@/server/config/env";

let useCase: ScheduleConsultation | null | undefined;

export function createScheduleConsultation(
  environment: ServerEnv,
): ScheduleConsultation | null {
  if (
    !environment.GOOGLE_OAUTH_CLIENT_ID ||
    !environment.GOOGLE_OAUTH_CLIENT_SECRET ||
    !environment.GOOGLE_OAUTH_REFRESH_TOKEN ||
    !environment.GOOGLE_CALENDAR_ID
  ) {
    return null;
  }

  return new ScheduleConsultation(
    new GoogleCalendarSchedulingGateway({
      clientId: environment.GOOGLE_OAUTH_CLIENT_ID,
      clientSecret: environment.GOOGLE_OAUTH_CLIENT_SECRET,
      refreshToken: environment.GOOGLE_OAUTH_REFRESH_TOKEN,
      calendarId: environment.GOOGLE_CALENDAR_ID,
      eventTitle: environment.GOOGLE_CALENDAR_EVENT_TITLE ?? "OPSAlchemy Consultation",
    }),
  );
}

export function getScheduleConsultation(): ScheduleConsultation | null {
  if (useCase !== undefined) return useCase;
  useCase = createScheduleConsultation(getServerEnv());
  return useCase;
}
