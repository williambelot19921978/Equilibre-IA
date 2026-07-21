import { describe, expect, it } from "vitest";

import { averageConfidence, confidenceLabel, isHighConfidence } from "../confidence/knowledgeConfidenceEngine";
import { mergeKnowledgeFromSources } from "../merge/knowledgeMergeEngine";
import { baseKnowledgeInput } from "../testing/fixtures";

describe("Knowledge confidence", () => {
  it("affiche le score en pourcentage", () => {
    expect(confidenceLabel(0.92)).toBe("92 %");
  });

  it("identifie la haute confiance", () => {
    const items = mergeKnowledgeFromSources(baseKnowledgeInput());
    const high = items.filter(isHighConfidence);
    expect(high.length).toBeGreaterThan(0);
  });

  it("calcule la moyenne", () => {
    const items = mergeKnowledgeFromSources(baseKnowledgeInput());
    expect(averageConfidence(items)).toBeGreaterThan(0.8);
  });
});
