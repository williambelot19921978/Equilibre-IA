import { describe, expect, it } from "vitest";

import { computeHouseholdVision } from "../household/householdEngine";
import { SemanticPlanningEngine } from "../engine/semanticPlanningEngine";
import { PROFILE_COUPLE, PROFILE_FAMILLE } from "../testing/fixtures";

describe("EPIC5C householdEngine", () => {
  const engine = new SemanticPlanningEngine({
    planningEngine: { buildSnapshot: async () => ({}) } as never,
  });

  it("couple — temps ensemble et individuel", () => {
    const items = engine.enrichItems(PROFILE_COUPLE.items);
    const vision = computeHouseholdVision({
      items,
      childrenCount: 0,
      memberCount: 2,
      freeMinutes: 90,
    });
    expect(vision.togetherMinutes).toBeGreaterThan(0);
    expect(vision.individualMinutes).toBeGreaterThanOrEqual(0);
  });

  it("famille — temps parents et enfants", () => {
    const items = engine.enrichItems(PROFILE_FAMILLE.items);
    const vision = computeHouseholdVision({
      items,
      childrenCount: 2,
      memberCount: 4,
      freeMinutes: 60,
    });
    expect(vision.parentMinutes).toBeGreaterThanOrEqual(0);
    expect(vision.confidence).toBeGreaterThan(0.5);
  });
});
