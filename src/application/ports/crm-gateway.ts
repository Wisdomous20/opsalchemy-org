import type { Lead } from "@/domain/leads/lead";

export interface CrmSyncResult {
  readonly externalContactId: string;
  readonly operation: "created" | "updated";
}

export interface CRMGateway {
  syncLead(lead: Lead, idempotencyKey: string): Promise<CrmSyncResult>;
}
