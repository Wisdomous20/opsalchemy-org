export const SERVICE_IDS = [
  "reputation-by-design",
  "relationships-by-design",
  "listing-launch",
  "transaction-management",
  "brand-assets",
  "operations-mentorship",
] as const;

export type ServiceId = (typeof SERVICE_IDS)[number];

export interface ServiceOffering {
  readonly id: ServiceId;
  readonly name: string;
  readonly summary: string;
}

export const SERVICE_OFFERINGS = [
  {
    id: "reputation-by-design",
    name: "Reputation by Design",
    summary:
      "Creates repeatable systems for reviews, testimonials, referrals, and social proof.",
  },
  {
    id: "relationships-by-design",
    name: "Relationships by Design",
    summary:
      "Builds consistent, relationship-focused follow-up for clients, prospects, and referral partners.",
  },
  {
    id: "listing-launch",
    name: "Listing Launch",
    summary:
      "Coordinates the operational and administrative work required to bring a listing to market.",
  },
  {
    id: "transaction-management",
    name: "Transaction Management",
    summary:
      "Coordinates transaction administration, communication, documents, and deadlines through closing.",
  },
  {
    id: "brand-assets",
    name: "Brand Assets",
    summary:
      "Develops consistent client-facing collateral, templates, and repeatable marketing assets.",
  },
  {
    id: "operations-mentorship",
    name: "Operations Mentorship",
    summary:
      "Improves workflows, roles, SOPs, team communication, and systems that support growth.",
  },
] as const satisfies readonly ServiceOffering[];
