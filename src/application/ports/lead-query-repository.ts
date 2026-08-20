import type { ServiceId } from "@/domain/services/service-offering";

export interface LeadReadModel {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly phone: string | null;
  readonly serviceInterests: readonly ServiceId[];
  readonly conversationSummary: string;
  readonly crmSyncAllowed: boolean;
  readonly consentRecordedAt: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface LeadQueryRepository {
  findRecent(limit: number): Promise<readonly LeadReadModel[]>;
}
