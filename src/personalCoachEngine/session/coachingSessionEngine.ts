/**
 * EPIC 6D — Coaching Session Engine (30s–2min, never imposed).
 */

import type {
  CoachAdvice,
  CoachingSession,
  CoachingSessionKind,
  PersonalCoachInput,
} from "../types/personalCoachTypes";
import { recordSessionOffered, wasAnySessionOfferedToday } from "../store/coachStore";

export function buildCoachingSession(input: {
  readonly coachInput: PersonalCoachInput;
  readonly kind: CoachingSessionKind;
  readonly messages: readonly CoachAdvice[];
  readonly title: string;
}): CoachingSession | null {
  const { coachInput, kind, messages, title } = input;
  if (messages.length === 0) return null;
  if (wasAnySessionOfferedToday(coachInput.userId, coachInput.date)) return null;

  const estimatedSeconds = Math.min(120, messages.reduce((sum, msg) => sum + msg.estimatedSeconds, 0));

  recordSessionOffered(coachInput.userId, kind, coachInput.date);

  return {
    id: `session-${kind}-${coachInput.date}`,
    kind,
    title,
    messages: messages.slice(0, 5),
    estimatedSeconds,
    optional: true,
    createdAt: coachInput.now ?? new Date().toISOString(),
  };
}

export function proposeDailySession(
  coachInput: PersonalCoachInput,
  today: readonly CoachAdvice[],
  recovery: readonly CoachAdvice[],
): CoachingSession | null {
  const messages = [...today.slice(0, 2), ...recovery.slice(0, 1)];
  return buildCoachingSession({
    coachInput,
    kind: "daily",
    messages,
    title: "Session du jour",
  });
}

export function proposeWeeklySession(
  coachInput: PersonalCoachInput,
  weeklyReview: CoachAdvice | null,
): CoachingSession | null {
  if (!weeklyReview) return null;
  return buildCoachingSession({
    coachInput,
    kind: "weekly",
    messages: [weeklyReview],
    title: "Revue hebdomadaire",
  });
}

export function proposeAdHocSession(
  coachInput: PersonalCoachInput,
  opportunities: readonly CoachAdvice[],
): CoachingSession | null {
  if (opportunities.length === 0) return null;
  return buildCoachingSession({
    coachInput,
    kind: "ad_hoc",
    messages: opportunities.slice(0, 2),
    title: "Opportunité du moment",
  });
}
