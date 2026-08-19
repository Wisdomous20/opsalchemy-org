import { describe, expect, it } from "vitest";
import { MARKETING_SERVICES, SERVICE_IDS_FOR_MARKETING } from "../marketing";

describe("marketing service content", () => {
  it("presents every domain service exactly once", () => {
    const ids = MARKETING_SERVICES.map((service) => service.id);
    expect(ids).toEqual([...SERVICE_IDS_FOR_MARKETING]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("includes useful outcome and audience copy", () => {
    for (const service of MARKETING_SERVICES) {
      expect(service.outcome.length).toBeGreaterThan(20);
      expect(service.idealFor.length).toBeGreaterThan(20);
    }
  });
});
