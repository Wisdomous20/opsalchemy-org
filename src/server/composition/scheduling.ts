import "server-only";

import { FindConsultationSlots } from "@/application/use-cases/find-consultation-slots";
import { CaptureLead } from "@/application/use-cases/capture-lead";
import { ScheduleConsultation } from "@/application/use-cases/schedule-consultation";
import { GoogleCalendarSchedulingGateway } from "@/infrastructure/google/google-calendar-scheduling-gateway";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { PrismaLeadRepository } from "@/infrastructure/prisma/prisma-lead-repository";
import { getDatabaseUrl } from "@/server/config/database-env";
import type { ServerEnv } from "@/server/config/env-schema";
import { getServerEnv } from "@/server/config/env";

let useCase: ScheduleConsultation | null | undefined;
let availabilityUseCase: FindConsultationSlots | null | undefined;

function createGateway(environment: ServerEnv) {
  if (
    !environment.GOOGLE_OAUTH_CLIENT_ID ||
    !environment.GOOGLE_OAUTH_CLIENT_SECRET ||
    !environment.GOOGLE_OAUTH_REFRESH_TOKEN ||
    !environment.GOOGLE_CALENDAR_ID
  ) {
    return null;
  }

  return new GoogleCalendarSchedulingGateway({
    clientId: environment.GOOGLE_OAUTH_CLIENT_ID,
    clientSecret: environment.GOOGLE_OAUTH_CLIENT_SECRET,
    refreshToken: environment.GOOGLE_OAUTH_REFRESH_TOKEN,
    calendarId: environment.GOOGLE_CALENDAR_ID,
    eventTitle: environment.GOOGLE_CALENDAR_EVENT_TITLE ?? "OPSAlchemy Consultation",
  });
}

export function createScheduleConsultation(
  environment: ServerEnv,
): ScheduleConsultation | null {
  const gateway = createGateway(environment);
  if (!gateway) return null;

  const leadRepository = new PrismaLeadRepository(createPrismaClient(getDatabaseUrl()));
  return new ScheduleConsultation(
    gateway,
    new CaptureLead(leadRepository),
    () => new Date(),
  );
}

export function createFindConsultationSlots(
  environment: ServerEnv,
): FindConsultationSlots | null {
  const gateway = createGateway(environment);
  return gateway ? new FindConsultationSlots(gateway) : null;
}

export function getFindConsultationSlots(): FindConsultationSlots | null {
  if (availabilityUseCase !== undefined) return availabilityUseCase;
  availabilityUseCase = createFindConsultationSlots(getServerEnv());
  return availabilityUseCase;
}

export function getScheduleConsultation(): ScheduleConsultation | null {
  if (useCase !== undefined) return useCase;
  useCase = createScheduleConsultation(getServerEnv());
  return useCase;
}
