import type { ServiceId } from "../services/service-offering";

export interface LeadConsent {
  readonly crmSyncAllowed: boolean;
  readonly recordedAt: Date;
}

export interface Lead {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly phone: string | null;
  readonly serviceInterests: readonly ServiceId[];
  readonly conversationSummary: string;
  readonly consent: LeadConsent;
}
