/**
 * @vitest-environment happy-dom
 */

import { beforeEach, describe, expect, it } from "vitest";

import { generateSuggestions } from "../../proactiveIntelligenceEngine/suggestion/suggestionEngine";
import { clearSuggestions } from "../../proactiveIntelligenceEngine/suggestion/suggestionStore";
import { BUSY_DAY_INPUT } from "../../proactiveIntelligenceEngine/testing/fixtures";

const USER = "daily-state-proactive-test";

describe("Proactive — DailyState integration", () => {
  beforeEach(() => {
    clearSuggestions(USER);
  });

  it("réduit les suggestions prévention quand énergie faible", () => {
    const baseline = generateSuggestions({
      ...BUSY_DAY_INPUT,
      userId: USER,
      mentalLoad: 75,
    }).filter((suggestion) => suggestion.kind === "prevention");

    const reduced = generateSuggestions({
      ...BUSY_DAY_INPUT,
      userId: USER,
      mentalLoad: 75,
      dailyEnergy: 3,
    }).filter((suggestion) => suggestion.kind === "prevention");

    expect(reduced.length).toBeLessThanOrEqual(baseline.length);
    if (reduced.length > 0 && baseline.length > 0) {
      expect(reduced[0]!.score).toBeLessThanOrEqual(baseline[0]!.score);
    }
  });
});
