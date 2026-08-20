import { describe, expect, it, vi } from "vitest";

import type { LeadQueryRepository } from "@/application/ports/lead-query-repository";
import { ListLeads } from "../list-leads";

describe("ListLeads", () => {
  it("requests a bounded list of recent leads", async () => {
    const repository: LeadQueryRepository = {
      findRecent: vi.fn().mockResolvedValue([]),
    };

    await expect(new ListLeads(repository).execute()).resolves.toEqual([]);
    expect(repository.findRecent).toHaveBeenCalledWith(100);
  });
});
