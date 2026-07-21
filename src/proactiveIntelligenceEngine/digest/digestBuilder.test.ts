import { describe, expect, it } from "vitest";

import { buildDigest } from "./digestBuilder";
import type { ProactiveSuggestion } from "../types/proactiveTypes";

function mockSuggestion(id: string, title: string): ProactiveSuggestion {
  const now = new Date().toISOString();
  return {
    id,
    kind: "organization",
    title,
    description: "Test",
    reason: "Test",
    impact: "Test",
    urgency: 0.5,
    confidence: 0.7,
    priority: 60,
    status: "scheduled",
    score: 0.6,
    explainability: {
      why: "Test",
      observations: [],
      habits: [],
      whyNow: "Now",
      whyNotLater: "Later",
      confidenceLevel: 0.7,
      formula: "test",
    },
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    createdAt: now,
    updatedAt: now,
  };
}

describe("DigestBuilder", () => {
  it("regroupe plusieurs suggestions", () => {
    const digest = buildDigest({
      suggestions: [
        mockSuggestion("s1", "Suggestion A"),
        mockSuggestion("s2", "Suggestion B"),
        mockSuggestion("s3", "Suggestion C"),
      ],
    });

    expect(digest).not.toBeNull();
    expect(digest!.title).toContain("3 recommandation");
    expect(digest!.suggestionIds).toHaveLength(3);
  });

  it("ne crée pas de digest pour une seule suggestion", () => {
    const digest = buildDigest({
      suggestions: [mockSuggestion("s1", "Seule")],
    });
    expect(digest).toBeNull();
  });
});
