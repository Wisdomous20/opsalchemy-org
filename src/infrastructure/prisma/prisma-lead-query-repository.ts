import "server-only";

import type {
  LeadQueryRepository,
  LeadReadModel,
} from "@/application/ports/lead-query-repository";
import { SERVICE_IDS, type ServiceId } from "@/domain/services/service-offering";
import type { AppPrismaClient } from "./prisma-client";

const serviceIds = new Set<string>(SERVICE_IDS);

function toServiceId(value: string): ServiceId {
  if (!serviceIds.has(value)) {
    throw new Error("Lead data contains an unknown service interest");
  }

  return value as ServiceId;
}

export class PrismaLeadQueryRepository implements LeadQueryRepository {
  constructor(private readonly prisma: AppPrismaClient) {}

  async findRecent(limit: number): Promise<readonly LeadReadModel[]> {
    const leads = await this.prisma.lead.findMany({
      take: limit,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: {
        serviceInterests: {
          select: { serviceId: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return leads.map((lead) => ({
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      serviceInterests: lead.serviceInterests.map(({ serviceId }) =>
        toServiceId(serviceId),
      ),
      conversationSummary: lead.conversationSummary,
      crmSyncAllowed: lead.crmSyncAllowed,
      consentRecordedAt: lead.consentRecordedAt,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
    }));
  }
}
