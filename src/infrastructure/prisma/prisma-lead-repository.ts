import "server-only";

import type { LeadRepository } from "@/application/ports/lead-repository";
import type { Lead } from "@/domain/leads/lead";
import { SERVICE_IDS, type ServiceId } from "@/domain/services/service-offering";
import type { AppPrismaClient } from "./prisma-client";

const serviceIds = new Set<string>(SERVICE_IDS);

function toServiceId(value: string): ServiceId {
  if (!serviceIds.has(value))
    throw new Error("Lead contains an unknown service interest");
  return value as ServiceId;
}

export class PrismaLeadRepository implements LeadRepository {
  constructor(private readonly prisma: AppPrismaClient) {}

  async findByEmail(email: string): Promise<Lead | null> {
    const lead = await this.prisma.lead.findUnique({
      where: { email },
      include: { serviceInterests: { select: { serviceId: true } } },
    });
    if (!lead) return null;

    return {
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      serviceInterests: lead.serviceInterests.map(({ serviceId }) =>
        toServiceId(serviceId),
      ),
      conversationSummary: lead.conversationSummary,
      consent: {
        contactAllowed: lead.contactAllowed,
        crmSyncAllowed: lead.crmSyncAllowed,
        recordedAt: lead.consentRecordedAt,
      },
    };
  }

  async save(lead: Lead): Promise<void> {
    const serviceInterests = lead.serviceInterests.map((serviceId) => ({
      serviceId,
    }));

    await this.prisma.lead.upsert({
      where: { email: lead.email },
      create: {
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        conversationSummary: lead.conversationSummary,
        contactAllowed: lead.consent.contactAllowed,
        crmSyncAllowed: lead.consent.crmSyncAllowed,
        consentRecordedAt: lead.consent.recordedAt,
        serviceInterests: { create: serviceInterests },
      },
      update: {
        name: lead.name,
        phone: lead.phone,
        conversationSummary: lead.conversationSummary,
        contactAllowed: lead.consent.contactAllowed,
        crmSyncAllowed: lead.consent.crmSyncAllowed,
        consentRecordedAt: lead.consent.recordedAt,
        serviceInterests: {
          deleteMany: {},
          create: serviceInterests,
        },
      },
    });
  }
}
