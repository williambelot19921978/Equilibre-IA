/**
 * EPIC 6B — Proactive Score Engine.
 */

import type { ProactiveScore, ProactiveScoreFactors } from "../types/proactiveTypes";

export function computeProactiveScore(factors: ProactiveScoreFactors): ProactiveScore {
  const {
    urgency,
    importance,
    confidence,
    userImpact,
    opportuneMoment,
    mentalLoad,
    dismissHistory,
    availability,
  } = factors;

  const loadPenalty = mentalLoad > 0.7 ? 0.15 : mentalLoad > 0.5 ? 0.08 : 0;
  const dismissPenalty = dismissHistory * 0.2;
  const availabilityBoost = availability * 0.12;

  const raw =
    urgency * 0.22 +
    importance * 0.18 +
    confidence * 0.2 +
    userImpact * 0.12 +
    opportuneMoment * 0.15 +
    availabilityBoost -
    loadPenalty -
    dismissPenalty;

  const finalScore = Math.min(0.98, Math.max(0, raw));
  const shouldDisplay = finalScore >= 0.45 && dismissHistory < 0.35;

  return {
    ...factors,
    finalScore,
    shouldDisplay,
    formula:
      "score = urgency*0.22 + importance*0.18 + confidence*0.2 + userImpact*0.12 + opportuneMoment*0.15 + availability*0.12 - loadPenalty - dismissPenalty",
  };
}

export function dismissHistoryPenalty(input: {
  readonly dismissCount: number;
  readonly totalShown: number;
  readonly kindDismissRate?: number;
}): number {
  if (input.totalShown === 0) return 0;
  const globalRate = input.dismissCount / input.totalShown;
  const kindRate = input.kindDismissRate ?? globalRate;
  return Math.min(0.5, (globalRate * 0.6 + kindRate * 0.4));
}
