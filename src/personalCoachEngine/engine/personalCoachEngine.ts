/**
 * EPIC 6D — Personal Coach Engine orchestrator.
 * Read-only consumer — never modifies upstream engines.
 */

import type {
  CoachAdvice,
  PersonalCoachInput,
  PersonalCoachSnapshot,
} from "../types/personalCoachTypes";
import { buildDomainInsights } from "../domains/coachingDomainEngine";
import { detectOpportunities } from "../opportunity/opportunityEngine";
import { detectRecoveryNeeds } from "../recovery/recoveryEngine";
import { detectSuccesses } from "../success/successEngine";
import { buildMonthlyReflection, isMonthlyReflectionWindow } from "../monthly/monthlyReflectionEngine";
import { buildWeeklyReview, isWeeklyReviewWindow } from "../weekly/weeklyReviewEngine";
import {
  proposeAdHocSession,
  proposeDailySession,
  proposeWeeklySession,
} from "../session/coachingSessionEngine";
import { buildCoachPhrasingHints } from "../phrasing/coachPhrasing";
import { getDismissedAdviceIds, getLifePriority } from "../store/coachStore";

export type PersonalCoachEngineDeps = Record<string, never>;

function filterDismissed(userId: string, items: readonly CoachAdvice[]): CoachAdvice[] {
  const dismissed = new Set(getDismissedAdviceIds(userId));
  return items.filter((item) => !dismissed.has(item.id));
}

function flattenDomainAdvice(
  domains: ReturnType<typeof buildDomainInsights>,
  kind: "tips" | "encouragements" | "opportunities",
): CoachAdvice[] {
  return domains.flatMap((domain) => domain[kind]);
}

export class PersonalCoachEngine {
  analyze(input: PersonalCoachInput): PersonalCoachSnapshot {
    const now = input.now ?? new Date().toISOString();
    const lifePriority = input.lifePriority ?? getLifePriority(input.userId);
    const domainInsights = buildDomainInsights({ ...input, lifePriority }, lifePriority);

    const domainToday = [
      ...flattenDomainAdvice(domainInsights, "tips"),
      ...flattenDomainAdvice(domainInsights, "encouragements"),
    ];

    const opportunities = filterDismissed(input.userId, [
      ...detectOpportunities(input),
      ...flattenDomainAdvice(domainInsights, "opportunities"),
    ]);

    const recovery = filterDismissed(input.userId, detectRecoveryNeeds(input));
    const successes = filterDismissed(input.userId, detectSuccesses(input));

    const weeklyReview = buildWeeklyReview(
      input,
      isWeeklyReviewWindow(input.date, now),
    );
    const monthlyReflection = buildMonthlyReflection(
      input,
      isMonthlyReflectionWindow(input.date),
    );

    const todayInsights = filterDismissed(input.userId, domainToday).slice(0, 5);

    const proposedSession =
      proposeWeeklySession(input, weeklyReview) ??
      proposeDailySession(input, todayInsights, recovery) ??
      proposeAdHocSession(input, opportunities);

    const phrasingHints = buildCoachPhrasingHints({
      coachInput: input,
      recovery,
      successes,
    });

    return {
      enabled: true,
      date: input.date,
      lifePriority,
      todayInsights,
      opportunities,
      recovery,
      successes,
      weeklyReview,
      monthlyReflection,
      domainInsights,
      proposedSession,
      phrasingHints,
      generatedAt: now,
    };
  }
}

export const defaultPersonalCoachEngine = new PersonalCoachEngine();

export function createEmptyPersonalCoachSnapshot(date: string): PersonalCoachSnapshot {
  return {
    enabled: false,
    date,
    lifePriority: "balance",
    todayInsights: [],
    opportunities: [],
    recovery: [],
    successes: [],
    weeklyReview: null,
    monthlyReflection: null,
    domainInsights: [],
    proposedSession: null,
    phrasingHints: [],
    generatedAt: new Date().toISOString(),
  };
}
