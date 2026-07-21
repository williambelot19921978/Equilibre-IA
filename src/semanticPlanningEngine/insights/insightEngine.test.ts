import { describe, expect, it } from "vitest";

import { generateSemanticInsights } from "../insights/insightEngine";
import { SemanticPlanningEngine } from "../engine/semanticPlanningEngine";
import { assessLifeBalance } from "../balance/lifeBalanceEngine";
import { computeDailyLoad } from "../load/dailyLoadEngine";
import { ITEM_DENTIST, ITEM_SPRINT } from "../testing/fixtures";

describe("EPIC5C insightEngine", () => {
  const engine = new SemanticPlanningEngine({
    planningEngine: { buildSnapshot: async () => ({}) } as never,
  });

  it("insights explicables avec why et calculation", () => {
    const items = engine.enrichItems([ITEM_DENTIST, ITEM_DENTIST, ITEM_SPRINT]);
    const dailyLoad = computeDailyLoad(items);
    const balance = assessLifeBalance({
      items,
      dailyLoad,
      freeMinutesAvailable: 150,
      period: "daily",
    });
    const insights = generateSemanticInsights({
      items,
      dailyLoad,
      balance,
      freeMinutes: 150,
      date: "2026-07-20",
    });

    expect(insights.length).toBeGreaterThan(0);
    for (const insight of insights) {
      expect(insight.explainability.why.length).toBeGreaterThan(0);
      expect(insight.explainability.calculation.length).toBeGreaterThan(0);
      expect(insight.confidence).toBeGreaterThan(0);
    }
  });
});
