import { describe, expect, it } from "vitest";

import { computeConfidence, periodDaysFromObservations } from "./confidenceEngine";
import { REGULAR_USER_OBSERVATIONS } from "../testing/fixtures";

describe("ConfidenceEngine", () => {
  it("calcule une confiance non arbitraire avec explainability", () => {
    const matching = REGULAR_USER_OBSERVATIONS.filter((obs) => obs.metadata.kind === "sport");
    const { confidence, explainability } = computeConfidence({
      matchingObservations: matching,
      totalObservations: REGULAR_USER_OBSERVATIONS.length,
      periodDays: periodDaysFromObservations(REGULAR_USER_OBSERVATIONS),
      why: "Répétition sport détectée.",
      label: "Sport",
    });

    expect(confidence).toBeGreaterThan(0.1);
    expect(confidence).toBeLessThanOrEqual(0.98);
    expect(explainability.why).toContain("Répétition");
    expect(explainability.observationCount).toBe(matching.length);
    expect(explainability.periodDays).toBeGreaterThan(0);
    expect(explainability.formula).toContain("confidence");
    expect(explainability.dataUsed.length).toBeGreaterThan(0);
  });

  it("augmente la confiance avec plus d'observations", () => {
    const few = REGULAR_USER_OBSERVATIONS.slice(0, 3);
    const many = REGULAR_USER_OBSERVATIONS.filter((obs) => obs.metadata.kind === "sport");

    const low = computeConfidence({
      matchingObservations: few,
      totalObservations: REGULAR_USER_OBSERVATIONS.length,
      periodDays: 7,
      why: "Peu de données.",
      label: "Sport",
    });

    const high = computeConfidence({
      matchingObservations: many,
      totalObservations: REGULAR_USER_OBSERVATIONS.length,
      periodDays: 14,
      why: "Beaucoup de données.",
      label: "Sport",
    });

    expect(high.confidence).toBeGreaterThanOrEqual(low.confidence);
  });

  it("periodDaysFromObservations calcule la période analysée", () => {
    const period = periodDaysFromObservations(REGULAR_USER_OBSERVATIONS);
    expect(period).toBeGreaterThanOrEqual(1);
  });
});
