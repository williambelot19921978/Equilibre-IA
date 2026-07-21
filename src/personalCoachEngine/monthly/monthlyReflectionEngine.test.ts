import { describe, expect, it } from "vitest";

import { buildMonthlyReflection, isMonthlyReflectionWindow } from "../monthly/monthlyReflectionEngine";
import { baseCoachInput } from "../testing/fixtures";

describe("MonthlyReflectionEngine", () => {
  it("fenêtre mensuelle début ou fin de mois", () => {
    expect(isMonthlyReflectionWindow("2026-07-01")).toBe(true);
    expect(isMonthlyReflectionWindow("2026-07-28")).toBe(true);
    expect(isMonthlyReflectionWindow("2026-07-15")).toBe(false);
  });

  it("affiche évolution et axes d'amélioration doux", () => {
    const reflection = buildMonthlyReflection(baseCoachInput({ date: "2026-07-28" }), true);
    expect(reflection).not.toBeNull();
    expect(reflection!.message).toMatch(/évolution|habitudes|progrès|Axe doux/i);
  });
});
