import type { BusinessProblemCategory } from "./business-problem";
import type { ServiceId } from "./service-offering";

const SERVICES_BY_PROBLEM = {
  reputation: ["reputation-by-design"],
  relationships: ["relationships-by-design"],
  "listing-operations": ["listing-launch"],
  "transaction-operations": ["transaction-management"],
  "brand-consistency": ["brand-assets"],
  "operational-systems": ["operations-mentorship"],
} as const satisfies Record<BusinessProblemCategory, readonly ServiceId[]>;

export function recommendServices(
  problems: readonly BusinessProblemCategory[],
): readonly ServiceId[] {
  return [...new Set(problems.flatMap((problem) => SERVICES_BY_PROBLEM[problem]))];
}
