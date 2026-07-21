import { describe, expect, it } from "vitest";

import {
  buildStatePhrasingHints,
  proactiveReductionFactor,
  semanticFatigueInsight,
} from "../phrasing/statePhrasing";
import { sampleState } from "../testing/fixtures";

describe("StatePhrasing", () => {
  it("adapte le ton quand énergie faible", () => {
    const hints = buildStatePhrasingHints(sampleState({ energy: 2, mood: "very_tired" }));
    expect(hints[0]).toContain("plus légère");
  });

  it("adapte le ton quand énergie élevée", () => {
    const hints = buildStatePhrasingHints(sampleState({ energy: 9, mood: "excellent" }));
    expect(hints[0]).toContain("pleine forme");
  });

  it("réduit les recommandations proactives en cas de fatigue", () => {
    expect(proactiveReductionFactor(sampleState({ energy: 2, mood: "very_tired" }))).toBe(0.4);
    expect(proactiveReductionFactor(sampleState({ energy: 8, mood: "good" }))).toBe(1);
  });

  it("produit un insight sémantique planning + fatigue", () => {
    const insight = semanticFatigueInsight(sampleState({ energy: 3, mood: "tired" }), 75);
    expect(insight).toContain("fatigue");
  });
});
