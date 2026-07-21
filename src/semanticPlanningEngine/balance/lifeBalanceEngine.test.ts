import { describe, expect, it } from "vitest";

import { assessLifeBalance } from "../balance/lifeBalanceEngine";
import { SemanticPlanningEngine } from "../engine/semanticPlanningEngine";
import { PROFILE_FAMILLE, PROFILE_INDEPENDANT } from "../testing/fixtures";

describe("EPIC5C lifeBalanceEngine", () => {
  const engine = new SemanticPlanningEngine({
    planningEngine: {
      buildSnapshot: async () => ({
        timeline: { items: [], rangeStart: "", rangeEnd: "", timezone: "UTC" },
        conflicts: [],
        freeSlots: [],
        sources: [],
        generatedAt: "",
      }),
    } as never,
  });

  it("famille — détecte signaux d'équilibre", () => {
    const items = engine.enrichItems(PROFILE_FAMILLE.items, PROFILE_FAMILLE.goals);
    const dailyLoad = {
      mentalLoad: 40,
      physicalLoad: 60,
      focusMinutes: 60,
      travelMinutes: 0,
      personalMinutes: 20,
      familyMinutes: 120,
      workMinutes: 180,
      healthMinutes: 60,
      freeMinutes: 30,
      totalBusyMinutes: 440,
    };
    const balance = assessLifeBalance({
      items,
      dailyLoad,
      freeMinutesAvailable: 30,
      period: "daily",
      childrenCount: PROFILE_FAMILLE.childrenCount,
    });
    expect(balance.score).toBeGreaterThan(0);
    expect(balance.signals.length).toBeGreaterThan(0);
  });

  it("indépendant surchargé — signal overload", () => {
    const items = engine.enrichItems(PROFILE_INDEPENDANT.items);
    const dailyLoad = {
      mentalLoad: 80,
      physicalLoad: 60,
      focusMinutes: 300,
      travelMinutes: 120,
      personalMinutes: 0,
      familyMinutes: 0,
      workMinutes: 480,
      healthMinutes: 60,
      freeMinutes: 0,
      totalBusyMinutes: 720,
    };
    const balance = assessLifeBalance({
      items,
      dailyLoad,
      freeMinutesAvailable: 0,
      period: "daily",
    });
    expect(balance.signals).toContain("overload");
  });
});
