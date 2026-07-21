import { describe, expect, it } from "vitest";

import { classifyCalendarItem } from "../classification/classificationEngine";
import { computeGoalImpacts } from "../goals/goalImpactEngine";
import { ITEM_GYM, ITEM_DENTIST } from "../testing/fixtures";

describe("EPIC5C goalImpactEngine", () => {
  it("Course → Objectif Marathon", () => {
    const classification = classifyCalendarItem(ITEM_GYM);
    const links = computeGoalImpacts(ITEM_GYM, classification, [
      { id: "g1", name: "Objectif Marathon" },
    ]);
    expect(links.length).toBeGreaterThan(0);
    expect(links[0]?.goalName).toContain("Marathon");
  });

  it("Consultation → Objectif Santé", () => {
    const classification = classifyCalendarItem(ITEM_DENTIST);
    const links = computeGoalImpacts(ITEM_DENTIST, classification, [
      { id: "g2", name: "Objectif Santé" },
    ]);
    expect(links.length).toBeGreaterThan(0);
  });
});
