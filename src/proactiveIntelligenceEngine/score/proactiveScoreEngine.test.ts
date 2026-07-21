import { describe, expect, it } from "vitest";

import { computeProactiveScore, dismissHistoryPenalty } from "./proactiveScoreEngine";

describe("ProactiveScore / Priorité", () => {
  it("score élevé quand urgence et disponibilité hautes", () => {
    const score = computeProactiveScore({
      urgency: 0.9,
      importance: 0.8,
      confidence: 0.85,
      userImpact: 0.7,
      opportuneMoment: 0.8,
      mentalLoad: 0.3,
      dismissHistory: 0,
      availability: 0.9,
    });

    expect(score.finalScore).toBeGreaterThan(0.6);
    expect(score.shouldDisplay).toBe(true);
    expect(score.formula).toContain("urgency");
  });

  it("score bas quand charge mentale et refus élevés", () => {
    const score = computeProactiveScore({
      urgency: 0.4,
      importance: 0.5,
      confidence: 0.6,
      userImpact: 0.5,
      opportuneMoment: 0.4,
      mentalLoad: 0.9,
      dismissHistory: 0.4,
      availability: 0.3,
    });

    expect(score.finalScore).toBeLessThan(0.5);
    expect(score.shouldDisplay).toBe(false);
  });

  it("dismissHistoryPenalty augmente avec les refus", () => {
    const low = dismissHistoryPenalty({ dismissCount: 1, totalShown: 10 });
    const high = dismissHistoryPenalty({ dismissCount: 8, totalShown: 10, kindDismissRate: 0.9 });
    expect(high).toBeGreaterThan(low);
  });
});
