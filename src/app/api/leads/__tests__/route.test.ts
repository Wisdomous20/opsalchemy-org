import { beforeEach, describe, expect, it, vi } from "vitest";

import { getListLeads } from "@/server/composition/leads";
import { GET } from "../route";

vi.mock("@/server/composition/leads", () => ({
  getListLeads: vi.fn(),
}));

const execute = vi.fn();

describe("GET /api/leads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getListLeads).mockReturnValue({ execute } as never);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("returns recent leads without allowing the response to be cached", async () => {
    execute.mockResolvedValue([
      {
        id: "5a37b573-b3f9-4768-8b3a-e240abbcc933",
        name: "Demo Lead",
        email: "demo@example.com",
        phone: null,
        serviceInterests: ["operations-mentorship"],
        conversationSummary: "Needs help documenting operations.",
        contactAllowed: true,
        crmSyncAllowed: false,
        consentRecordedAt: new Date("2026-08-20T08:00:00.000Z"),
        createdAt: new Date("2026-08-20T08:01:00.000Z"),
        updatedAt: new Date("2026-08-20T08:02:00.000Z"),
      },
    ]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.leads).toEqual([
      expect.objectContaining({
        email: "demo@example.com",
        serviceInterests: ["operations-mentorship"],
        createdAt: "2026-08-20T08:01:00.000Z",
      }),
    ]);
  });

  it("returns a safe error when the database query fails", async () => {
    execute.mockRejectedValue(new Error("password=database-secret"));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "internal_error" });
    expect(JSON.stringify(body)).not.toContain("database-secret");
  });
});
