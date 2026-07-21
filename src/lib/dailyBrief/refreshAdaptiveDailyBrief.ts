/**
 * EPIC1-C — Adaptive Daily Brief refresh orchestrator.
 * Reuses existing buildDailyBrief output — no new motors or events.
 */

import type { DailyBrief } from "./buildDailyBrief";
import { areDailyBriefRecommendationsEquivalent } from "./dailyBriefRecommendationSignature";
import { formatUnderControlSynthesis } from "./formatDailyBriefUpdateHint";

export type AdaptiveDailyBriefState = {
  readonly brief: DailyBrief;
  readonly lastUpdatedAt: string | null;
  readonly showUpdatedHint: boolean;
};

function applyAdaptiveSynthesis(brief: DailyBrief): DailyBrief {
  if (brief.recommendations.length > 0) {
    return brief;
  }

  return {
    ...brief,
    synthesis: formatUnderControlSynthesis(),
  };
}

export function refreshAdaptiveDailyBrief(input: {
  previous: AdaptiveDailyBriefState | null;
  candidate: DailyBrief;
  timelineChanged: boolean;
  now?: Date;
}): AdaptiveDailyBriefState {
  const candidate = applyAdaptiveSynthesis(input.candidate);

  if (!input.previous) {
    return {
      brief: candidate,
      lastUpdatedAt: null,
      showUpdatedHint: false,
    };
  }

  if (!input.timelineChanged) {
    return input.previous;
  }

  const recommendationsStillValid = areDailyBriefRecommendationsEquivalent(
    input.previous.brief.recommendations,
    candidate.recommendations,
  );

  if (recommendationsStillValid) {
    return input.previous;
  }

  const now = input.now ?? new Date();

  return {
    brief: candidate,
    lastUpdatedAt: now.toISOString(),
    showUpdatedHint: true,
  };
}
