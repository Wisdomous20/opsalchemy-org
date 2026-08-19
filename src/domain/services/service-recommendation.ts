import type { BusinessProblemCategory } from "./business-problem";
import type { ServiceId } from "./service-offering";

export interface ServiceRecommendation {
  readonly serviceId: ServiceId;
  readonly basedOn: readonly BusinessProblemCategory[];
  readonly rationale: string;
  readonly requiresConsultation: true;
}
