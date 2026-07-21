import { describe, expect, it } from "vitest";

import { detectOpportunities } from "../opportunity/opportunityEngine";
import { energeticCoachInput, baseCoachInput } from "../testing/fixtures";

describe("OpportunityEngine", () => {
  it("détecte créneau libre et énergie élevée", () => {
    const opportunities = detectOpportunities(energeticCoachInput());
    expect(opportunities.some((item) => item.title.includes("Énergie"))).toBe(true);
    expect(opportunities.some((item) => item.message.includes("bon moment"))).toBe(true);
  });

  it("ne planifie jamais automatiquement", () => {
    for (const item of detectOpportunities(energeticCoachInput())) {
      expect(item.message.toLowerCase()).not.toContain("planifié");
      expect(item.suggestion?.toLowerCase() ?? "").not.toContain("automatique");
    }
  });

  it("propose objectif proche avec temps disponible", () => {
    const opportunities = detectOpportunities(baseCoachInput({ freeMinutes: 60 }));
    expect(opportunities.some((item) => item.domain === "personal_goals")).toBe(true);
  });
});
