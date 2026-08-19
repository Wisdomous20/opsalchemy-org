import { describe, expect, it } from "vitest";

import { recommendServices } from "../recommend-services";
import { SERVICE_IDS, SERVICE_OFFERINGS } from "../service-offering";

describe("recommendServices", () => {
  it("maps each documented problem category to its primary service", () => {
    expect(
      recommendServices([
        "reputation",
        "relationships",
        "listing-operations",
        "transaction-operations",
        "brand-consistency",
        "operational-systems",
      ]),
    ).toEqual(SERVICE_IDS);
  });

  it("does not return duplicate services", () => {
    expect(recommendServices(["reputation", "reputation"])).toEqual([
      "reputation-by-design",
    ]);
  });

  it("returns no recommendation without a known problem", () => {
    expect(recommendServices([])).toEqual([]);
  });
});

describe("SERVICE_OFFERINGS", () => {
  it("defines the six approved public services exactly once", () => {
    expect(SERVICE_OFFERINGS).toHaveLength(6);
    expect(new Set(SERVICE_OFFERINGS.map(({ id }) => id)).size).toBe(6);
  });
});
