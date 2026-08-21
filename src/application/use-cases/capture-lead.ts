import type { LeadRepository } from "@/application/ports/lead-repository";
import type { ConversationChannel } from "@/domain/conversations/conversation";
import type { Lead } from "@/domain/leads/lead";
import type { ServiceId } from "@/domain/services/service-offering";

export interface CaptureLeadInput {
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly channel: ConversationChannel;
  readonly serviceInterests: readonly ServiceId[];
  readonly consentConfirmed: boolean;
}

export type CaptureLeadResult =
  { readonly status: "captured" } | { readonly status: "consent_required" };

export class CaptureLead {
  constructor(
    private readonly repository: LeadRepository,
    private readonly now: () => Date = () => new Date(),
    private readonly createId: () => string = () => crypto.randomUUID(),
  ) {}

  async execute(input: CaptureLeadInput): Promise<CaptureLeadResult> {
    if (!input.consentConfirmed) return { status: "consent_required" };

    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();
    const phone = input.phone.trim();
    if (!name || !email || !phone) throw new Error("Lead contact details are required");

    const existing = await this.repository.findByEmail(email);
    const capturedAt = this.now();
    const lead: Lead = {
      id: existing?.id ?? this.createId(),
      name,
      email,
      phone,
      serviceInterests: [
        ...new Set([...(existing?.serviceInterests ?? []), ...input.serviceInterests]),
      ],
      conversationSummary: `Consultation requested through the ${input.channel} assistant.`,
      consent: {
        contactAllowed: true,
        crmSyncAllowed: existing?.consent.crmSyncAllowed ?? false,
        recordedAt: capturedAt,
      },
    };

    await this.repository.save(lead);
    return { status: "captured" };
  }
}
