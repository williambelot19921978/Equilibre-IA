import { describe, expect, it } from "vitest";

import { buildWeeklyReview, isWeeklyReviewWindow } from "../weekly/weeklyReviewEngine";
import { baseCoachInput, WEEKEND_DATE } from "../testing/fixtures";

describe("WeeklyReviewEngine", () => {
  it("fenêtre hebdomadaire le week-end", () => {
    expect(isWeeklyReviewWindow(WEEKEND_DATE)).toBe(true);
    expect(isWeeklyReviewWindow("2026-07-18")).toBe(true);
    expect(isWeeklyReviewWindow("2026-07-15")).toBe(false);
  });

  it("produit un résumé d'environ une minute", () => {
    const review = buildWeeklyReview(baseCoachInput({ date: WEEKEND_DATE }), true);
    expect(review).not.toBeNull();
    expect(review!.estimatedSeconds).toBeLessThanOrEqual(60);
    expect(review!.message.length).toBeGreaterThan(20);
  });

  it("jamais culpabilisant", () => {
    const review = buildWeeklyReview(
      baseCoachInput({ date: WEEKEND_DATE, trendEnergy7d: 3 }),
      true,
    );
    expect(review?.message.toLowerCase()).not.toMatch(/échec|faute/);
  });
});
