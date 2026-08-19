import {
  SERVICE_IDS,
  SERVICE_OFFERINGS,
  type ServiceId,
} from "@/domain/services/service-offering";

interface ServicePresentation {
  readonly number: string;
  readonly outcome: string;
  readonly idealFor: string;
}

const SERVICE_PRESENTATION: Record<ServiceId, ServicePresentation> = {
  "reputation-by-design": {
    number: "01",
    outcome: "Turn excellent client experiences into visible, lasting trust.",
    idealFor: "Teams ready to grow referrals and social proof with intention.",
  },
  "relationships-by-design": {
    number: "02",
    outcome: "Stay meaningfully connected without relying on memory alone.",
    idealFor: "Businesses with valuable relationships and inconsistent follow-up.",
  },
  "listing-launch": {
    number: "03",
    outcome: "Bring every listing to market with clarity, consistency, and care.",
    idealFor:
      "Agents who want a composed launch from signed agreement to live listing.",
  },
  "transaction-management": {
    number: "04",
    outcome: "Keep contracts, communication, and deadlines moving toward closing.",
    idealFor: "Agents and teams who need dependable contract-to-close coordination.",
  },
  "brand-assets": {
    number: "05",
    outcome: "Build repeatable collateral that makes every touchpoint feel considered.",
    idealFor: "Brands whose client-facing materials have outgrown one-off creation.",
  },
  "operations-mentorship": {
    number: "06",
    outcome: "Create the operational confidence to lead the next stage of growth.",
    idealFor: "Founders and operations leaders navigating scale, roles, and systems.",
  },
};

export const MARKETING_SERVICES = SERVICE_OFFERINGS.map((service) => ({
  ...service,
  ...SERVICE_PRESENTATION[service.id],
}));

export const COMMON_FRICTION = [
  {
    number: "01",
    title: "Growth feels heavier than it should",
    copy: "More clients and listings are creating more pressure—not more freedom.",
  },
  {
    number: "02",
    title: "The process lives in your head",
    copy: "Your team depends on verbal handoffs, memory, and last-minute rescue work.",
  },
  {
    number: "03",
    title: "Client care changes by the day",
    copy: "Important follow-up and thoughtful details disappear when business gets busy.",
  },
  {
    number: "04",
    title: "Tools exist, but systems do not",
    copy: "Technology has accumulated without a clear operating rhythm behind it.",
  },
] as const;

export const OPERATING_PILLARS = [
  {
    number: "I",
    title: "People",
    copy: "Clarify ownership so everyone knows what excellent work looks like.",
  },
  {
    number: "II",
    title: "Processes",
    copy: "Turn repeatable work into calm, documented pathways your team can trust.",
  },
  {
    number: "III",
    title: "Systems",
    copy: "Shape tools and workflows around the business—not the other way around.",
  },
  {
    number: "IV",
    title: "Experience",
    copy: "Protect the human details that make clients feel remembered and cared for.",
  },
] as const;

export const AUDIENCES = [
  {
    title: "Independent agents",
    copy: "Ready to replace personal bandwidth with a dependable way of working.",
  },
  {
    title: "Growing real estate teams",
    copy: "Building shared standards, clearer roles, and a consistent client journey.",
  },
  {
    title: "Brokers & operations leaders",
    copy: "Creating the infrastructure that helps good people do their best work.",
  },
] as const;

export const TEAM = [
  {
    initials: "RC",
    name: "Rhiannon Cannon",
    role: "Founder & CEO",
    email: "rhiannon@opsalchemy.org",
    bio: "Rhiannon brings nearly a decade of real estate operations experience to the work of building stronger, more sustainable businesses. Her approach pairs strategic clarity with a deep respect for the people who carry the process every day.",
  },
  {
    initials: "WV",
    name: "Wendy Verhage",
    role: "Executive Transaction Manager",
    email: "wendy@opsalchemy.org",
    bio: "With more than 15 years in real estate and small business, Wendy brings seasoned coordination and steady communication to every transaction—helping clients move from contract to close with confidence.",
  },
] as const;

export const FAQS = [
  {
    question: "Who does OPSAlchemy work with?",
    answer:
      "OPSAlchemy serves real estate agents, teams, brokers, and operations professionals who want clearer processes, stronger client experiences, and more sustainable growth.",
  },
  {
    question: "Do I need a large team to benefit?",
    answer:
      "No. Operational design is valuable before, during, and after a team grows. The right starting point depends on where work is currently getting stuck and what you want the business to make possible.",
  },
  {
    question: "Can services be tailored to my business?",
    answer:
      "Yes. The six service areas provide a clear framework, while the practical scope is shaped around your current systems, team, client journey, and priorities.",
  },
  {
    question: "Is OPSAlchemy a software platform?",
    answer:
      "OPSAlchemy is an operations partner, not a software product. Technology may support the work, but the focus stays on the people, processes, and experiences that make the business run well.",
  },
] as const;

export const SERVICE_IDS_FOR_MARKETING = SERVICE_IDS;
