/**
 * EPIC1-B — UI-ready Daily Brief presentation (translation outside React).
 */

import { isExplainableAiEnabled } from "../../config/featureFlags";
import type { DailyBrief } from "../dailyBrief/buildDailyBrief";
import type { DailyBriefRecommendation } from "../dailyBrief/buildDailyBriefRecommendations";
import { presentExplainabilityReasons } from "./presentExplainabilityReasons";

export type PresentedDailyBriefRecommendation = DailyBriefRecommendation & {
  readonly whyReasons: readonly string[];
  readonly showWhyButton: boolean;
};

export type PresentedDailyBrief = Omit<DailyBrief, "recommendations"> & {
  readonly recommendations: PresentedDailyBriefRecommendation[];
};

export function presentDailyBriefRecommendation(
  recommendation: DailyBriefRecommendation,
  explainableEnabled: boolean = isExplainableAiEnabled(),
): PresentedDailyBriefRecommendation {
  const whyReasons = explainableEnabled
    ? presentExplainabilityReasons(recommendation.explainabilityReasonCodes)
    : [];

  return {
    ...recommendation,
    whyReasons,
    showWhyButton: explainableEnabled && whyReasons.length > 0,
  };
}

export function presentDailyBrief(
  brief: DailyBrief,
  explainableEnabled: boolean = isExplainableAiEnabled(),
): PresentedDailyBrief {
  return {
    ...brief,
    recommendations: brief.recommendations.map((recommendation) =>
      presentDailyBriefRecommendation(recommendation, explainableEnabled),
    ),
  };
}
