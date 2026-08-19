import type { BusinessProblem } from "../services/business-problem";

export const PROSPECT_TYPES = [
  "individual-agent",
  "real-estate-team",
  "brokerage",
  "operations-professional",
  "administrative-professional",
  "other",
] as const;

export type ProspectType = (typeof PROSPECT_TYPES)[number];

export interface ProspectProfile {
  readonly type: ProspectType;
  readonly problems: readonly BusinessProblem[];
  readonly hasAdministrativeSupport: boolean | null;
  readonly wantsExecution: boolean | null;
  readonly wantsProcessImprovement: boolean | null;
  readonly approximateAnnualTransactionVolume: number | null;
  readonly currentCrm: string | null;
  readonly desiredOutcome: string | null;
}
