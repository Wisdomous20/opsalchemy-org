import { describe, expect, it, vi } from "vitest";
import type { LeadRepository } from "@/application/ports/lead-repository";
import type { Lead } from "@/domain/leads/lead";
import { CaptureLead } from "../capture-lead";

function createRepository(existing: Lead | null = null): LeadRepository {
  return {
    findByEmail: vi.fn().mockResolvedValue(existing),
    save: vi.fn().mockResolvedValue(undefined),
  };
}

const input = {
  name: "  Visitor Name  ",
  email: "  Visitor@Example.com ",
  phone: " +1 202 555 0147 ",
  channel: "text" as const,
  serviceInterests: ["transaction-management" as const],
  consentConfirmed: true,
};

describe("CaptureLead", () => {
  it("does not inspect or save contact details without explicit consent", async () => {
    const repository = createRepository();
    const useCase = new CaptureLead(repository);

    await expect(
      useCase.execute({ ...input, consentConfirmed: false }),
    ).resolves.toEqual({ status: "consent_required" });
    expect(repository.findByEmail).not.toHaveBeenCalled();
    expect(repository.save).not.toHaveBeenCalled();
  });

  it("normalizes and saves all required consultation contact details", async () => {
    const repository = createRepository();
    const capturedAt = new Date("2026-08-21T08:00:00.000Z");
    const useCase = new CaptureLead(
      repository,
      () => capturedAt,
      () => "new-lead-id",
    );

    await expect(useCase.execute(input)).resolves.toEqual({ status: "captured" });
    expect(repository.findByEmail).toHaveBeenCalledWith("visitor@example.com");
    expect(repository.save).toHaveBeenCalledWith({
      id: "new-lead-id",
      name: "Visitor Name",
      email: "visitor@example.com",
      phone: "+1 202 555 0147",
      serviceInterests: ["transaction-management"],
      conversationSummary: "Consultation requested through the text assistant.",
      consent: {
        contactAllowed: true,
        crmSyncAllowed: false,
        recordedAt: capturedAt,
      },
    });
  });

  it("updates an existing email idempotently and preserves prior interests", async () => {
    const existing: Lead = {
      id: "existing-lead-id",
      name: "Old Name",
      email: "visitor@example.com",
      phone: null,
      serviceInterests: ["listing-launch"],
      conversationSummary: "Earlier inquiry.",
      consent: {
        contactAllowed: true,
        crmSyncAllowed: true,
        recordedAt: new Date(0),
      },
    };
    const repository = createRepository(existing);
    const useCase = new CaptureLead(
      repository,
      () => new Date("2026-08-21T08:00:00.000Z"),
      () => "unused-new-id",
    );

    await useCase.execute(input);

    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "existing-lead-id",
        serviceInterests: ["listing-launch", "transaction-management"],
        consent: expect.objectContaining({ crmSyncAllowed: true }),
      }),
    );
  });
});
