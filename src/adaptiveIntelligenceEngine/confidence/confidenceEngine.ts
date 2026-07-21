/**
 * EPIC 6A — Confidence Engine (never arbitrary).
 */

import type { BehaviorObservation, ConfidenceExplanation } from "../types/adaptiveTypes";

export function computeConfidence(input: {
  matchingObservations: readonly BehaviorObservation[];
  totalObservations: number;
  periodDays: number;
  why: string;
  label: string;
}): { confidence: number; explainability: ConfidenceExplanation } {
  const matchCount = input.matchingObservations.length;
  const ratio = input.totalObservations > 0 ? matchCount / input.totalObservations : 0;
  const frequencyBoost = Math.min(0.35, matchCount * 0.03);
  const stabilityBoost = input.periodDays >= 14 ? 0.1 : input.periodDays >= 7 ? 0.05 : 0;
  const avgObservationConfidence =
    matchCount > 0
      ? input.matchingObservations.reduce((sum, obs) => sum + obs.confidence, 0) / matchCount
      : 0.4;

  const confidence = Math.min(
    0.98,
    Math.max(0.1, ratio * 0.45 + frequencyBoost + stabilityBoost + avgObservationConfidence * 0.2),
  );

  return {
    confidence,
    explainability: {
      why: input.why,
      dataUsed: input.matchingObservations.slice(0, 5).map((obs) => obs.label),
      observationCount: matchCount,
      periodDays: input.periodDays,
      confidenceLevel: confidence,
      formula: `confidence = ratio(${matchCount}/${input.totalObservations})*0.45 + frequencyBoost + stabilityBoost + avgObsConf*0.2`,
    },
  };
}

export function periodDaysFromObservations(observations: readonly BehaviorObservation[]): number {
  if (observations.length === 0) return 0;
  const timestamps = observations.map((obs) => new Date(obs.timestamp).getTime());
  const min = Math.min(...timestamps);
  const max = Math.max(...timestamps);
  return Math.max(1, Math.round((max - min) / (24 * 60 * 60 * 1000)));
}
