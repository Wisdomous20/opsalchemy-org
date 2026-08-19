import type { BusinessProblemCategory } from "./business-problem";

const SIGNALS: ReadonlyArray<{
  readonly category: BusinessProblemCategory;
  readonly terms: readonly string[];
}> = [
  {
    category: "reputation",
    terms: ["review", "testimonial", "reputation", "referral"],
  },
  {
    category: "relationships",
    terms: ["follow up", "follow-up", "database", "past client", "sphere"],
  },
  { category: "listing-operations", terms: ["listing", "launch", "go live", "mls"] },
  {
    category: "transaction-operations",
    terms: ["transaction", "contract", "closing", "deadline", "documents"],
  },
  {
    category: "brand-consistency",
    terms: ["brand", "template", "collateral", "marketing asset"],
  },
  {
    category: "operational-systems",
    terms: ["operation", "workflow", "process", "sop", "team", "delegate", "system"],
  },
];

export function classifyBusinessProblems(
  message: string,
): readonly BusinessProblemCategory[] {
  const normalized = message.toLocaleLowerCase("en-US");

  return SIGNALS.filter(({ terms }) =>
    terms.some((term) => normalized.includes(term)),
  ).map(({ category }) => category);
}
