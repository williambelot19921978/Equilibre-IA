import { describe, expect, it } from "vitest";

import {
  actionConfidenceFromState,
  humanModelPriorityConfidence,
  shouldSoftenActions,
} from "../guards/stateEngineGuards";
import { sampleState } from "../testing/fixtures";

describe("StateEngineGuards", () => {
  it("adoucit les actions quand énergie faible", () => {
    expect(shouldSoftenActions(sampleState({ energy: 3, mood: "tired" }))).toBe(true);
    expect(shouldSoftenActions(sampleState({ energy: 8, mood: "good" }))).toBe(false);
  });

  it("réduit la confiance des actions proposées", () => {
    expect(actionConfidenceFromState(sampleState({ energy: 2, stress: 3 }), 0.9)).toBeLessThanOrEqual(
      0.45,
    );
    expect(actionConfidenceFromState(sampleState({ energy: 8, stress: 3 }), 0.9)).toBe(0.9);
  });

  it("priorise le check-in dans le Human Model", () => {
    expect(humanModelPriorityConfidence(sampleState())).toBeGreaterThan(0.9);
  });
});
