import { describe, expect, it } from "vitest";

import { computeTrends } from "../trends/trendEngine";
import { MEDICAL_DISCLAIMER } from "../types/dailyStateTypes";
import { sampleState } from "../testing/fixtures";

describe("TrendEngine", () => {
  it("calcule les moyennes sur 7 jours", () => {
    const states = [
      sampleState({ date: "2026-07-14", energy: 4, stress: 6, sleepQuality: 3 }),
      sampleState({ date: "2026-07-16", energy: 8, stress: 2, sleepQuality: 5 }),
      sampleState({ date: "2026-07-20", energy: 6, stress: 4, sleepQuality: 4 }),
    ];

    const trends = computeTrends({ states, period: "7d", untilDate: "2026-07-20" });
    expect(trends.averageEnergy).toBe(6);
    expect(trends.averageStress).toBe(4);
    expect(trends.averageSleepQuality).toBe(4);
    expect(trends.sampleCount).toBe(3);
    expect(trends.disclaimer).toBe(MEDICAL_DISCLAIMER);
  });

  it("détecte une évolution déclinante", () => {
    const states = [
      sampleState({ date: "2026-07-15", energy: 8, mood: "good" }),
      sampleState({ date: "2026-07-16", energy: 7, mood: "good" }),
      sampleState({ date: "2026-07-19", energy: 3, mood: "tired" }),
      sampleState({ date: "2026-07-20", energy: 2, mood: "very_tired" }),
    ];

    const trends = computeTrends({ states, period: "7d", untilDate: "2026-07-20" });
    expect(trends.evolution).toBe("declining");
    expect(trends.averageFatigue).toBeGreaterThan(4);
  });

  it("supporte les périodes 30 jours et 12 mois", () => {
    const states = Array.from({ length: 20 }, (_, index) =>
      sampleState({
        date: `2026-06-${String(index + 1).padStart(2, "0")}`,
        energy: 5 + (index % 3),
      }),
    );

    const trends30 = computeTrends({ states, period: "30d", untilDate: "2026-06-20" });
    const trends12m = computeTrends({ states, period: "12m", untilDate: "2026-06-20" });
    expect(trends30.sampleCount).toBeGreaterThan(0);
    expect(trends12m.sampleCount).toBeGreaterThan(0);
  });
});
