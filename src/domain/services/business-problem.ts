export const BUSINESS_PROBLEM_CATEGORIES = [
  "reputation",
  "relationships",
  "listing-operations",
  "transaction-operations",
  "brand-consistency",
  "operational-systems",
] as const;

export type BusinessProblemCategory = (typeof BUSINESS_PROBLEM_CATEGORIES)[number];

export interface BusinessProblem {
  readonly category: BusinessProblemCategory;
  readonly description: string;
}
