import { describe, expect, it } from "vitest";

import { classifyCalendarItem } from "../classification/classificationEngine";
import { scoreSemanticEnrichment } from "../scoring/semanticScoringEngine";
import { ITEM_DENTIST, ITEM_GYM } from "../testing/fixtures";

describe("EPIC5C semanticScoringEngine", () => {
  it("RDV médical — importance 5, flexibilité fixe", () => {
    const classification = classifyCalendarItem(ITEM_DENTIST);
    const scores = scoreSemanticEnrichment(ITEM_DENTIST, classification);
    expect(scores.importance).toBe(5);
    expect(scores.flexibility).toBe("fixe");
    expect(scores.healthImpact).toBeGreaterThan(0.8);
  });

  it("Sport — recoveryNeeded et énergie after élevée", () => {
    const classification = classifyCalendarItem(ITEM_GYM);
    const scores = scoreSemanticEnrichment(ITEM_GYM, classification);
    expect(scores.recoveryNeeded).toBe(true);
    expect(scores.energyAfter).toBe("elevee");
    expect(scores.importance).toBeGreaterThanOrEqual(3);
  });

  it("confiance hérite de la classification", () => {
    const classification = classifyCalendarItem(ITEM_GYM);
    const scores = scoreSemanticEnrichment(ITEM_GYM, classification);
    expect(scores.confidence).toBeGreaterThan(0.5);
  });
});
