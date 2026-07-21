/**
 * P1 — Study slot recommendation actions (business layer, not UI).
 */

import type { DayTimelineEntry } from "../planning/displayedDayTimeline";
import { acceptFreeTimeSuggestion } from "../../services/suggestionAcceptanceService";
import {
  observePilotProposalAccepted,
  observePilotProposalDismissed,
  observePilotProposalPresented,
  rememberPilotProposalSession,
  getPilotProposalSession,
} from "../../ai/outcome/outcomeObservationBridge";
import type { StudySlotRecommendation } from "./buildStudySlotRecommendation";
import {
  deferStudyRecommendation,
  dismissStudyRecommendation,
} from "./studySlotRecommendationStorage";

export type StudyRecommendationSession = {
  readonly proposalId: string;
  readonly traceId?: string;
  readonly correlationId?: string;
};

export function presentStudyRecommendation(
  recommendation: StudySlotRecommendation,
  userId: string,
  householdId: string,
): StudyRecommendationSession {
  const session = observePilotProposalPresented({
    userId,
    householdId,
    proposalId: recommendation.suggestion.id,
  });
  rememberPilotProposalSession(session);
  return session;
}

export async function acceptStudyRecommendation({
  userId,
  date,
  householdId,
  recommendation,
}: {
  userId: string;
  date: string;
  householdId: string;
  recommendation: StudySlotRecommendation;
}): Promise<{ explanation: string; timeline: DayTimelineEntry[] }> {
  const session = getPilotProposalSession(recommendation.suggestion.id);

  const result = await acceptFreeTimeSuggestion({
    userId,
    date,
    entry: recommendation.entry,
    suggestion: recommendation.suggestion,
    content: {
      ...recommendation.suggestion.optionalContent,
      chosenDurationMinutes: recommendation.durationMinutes,
    },
  });

  if (session) {
    observePilotProposalAccepted(session);
  } else {
    observePilotProposalAccepted({
      userId,
      householdId,
      proposalId: recommendation.suggestion.id,
    });
  }

  return result;
}

export function deferStudyRecommendationAction(
  userId: string,
  date: string,
  entryId: string,
): void {
  deferStudyRecommendation(userId, date, entryId);
}

export function dismissStudyRecommendationAction(
  recommendation: StudySlotRecommendation,
  userId: string,
  householdId: string,
  date: string,
): void {
  const session = getPilotProposalSession(recommendation.suggestion.id);
  if (session) {
    observePilotProposalDismissed(session);
  } else {
    observePilotProposalDismissed({
      userId,
      householdId,
      proposalId: recommendation.suggestion.id,
    });
  }

  dismissStudyRecommendation(userId, date, recommendation.entry.id);
}

export type { StudySlotRecommendation };
