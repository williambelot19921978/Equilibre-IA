/**
 * EPIC1-C — Recommendation equivalence (orchestrator, not UI).
 */

import type { DailyBriefRecommendation } from "./buildDailyBriefRecommendations";

export function buildDailyBriefRecommendationSignature(
  recommendation: DailyBriefRecommendation,
): string {
  return [
    recommendation.kind,
    recommendation.entryId ?? "",
    recommendation.explainabilityReasonCodes.join(","),
    recommendation.decisionApproved ? "1" : "0",
  ].join("|");
}

export function areDailyBriefRecommendationsEquivalent(
  previous: readonly DailyBriefRecommendation[],
  next: readonly DailyBriefRecommendation[],
): boolean {
  if (previous.length !== next.length) return false;

  return previous.every(
    (recommendation, index) =>
      buildDailyBriefRecommendationSignature(recommendation) ===
      buildDailyBriefRecommendationSignature(next[index] ?? recommendation),
  );
}
