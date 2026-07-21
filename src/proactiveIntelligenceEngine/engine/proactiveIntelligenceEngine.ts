/**
 * EPIC 6B — Proactive Intelligence Engine orchestrator.
 * Read-only consumer — never modifies upstream engines.
 */

import type {
  ProactiveIntelligenceInput,
  ProactiveIntelligenceSnapshot,
  ProactiveSuggestion,
} from "../types/proactiveTypes";
import { defaultAttentionEngine, type AttentionEngine } from "../attention/attentionEngine";
import { defaultSuggestionEngine, type SuggestionEngine } from "../suggestion/suggestionEngine";
import { defaultDigestBuilder, type DigestBuilder } from "../digest/digestBuilder";
import { defaultLifeTransitionEngine, type LifeTransitionEngine } from "../transition/lifeTransitionEngine";
import {
  NotificationDispatcher,
  defaultNotificationDispatcher,
} from "../notification/notificationDispatcher";
import { getAllSuggestions, upsertSuggestion } from "../suggestion/suggestionStore";
import { getBehaviorMetrics } from "../learning/proactiveBehaviorStore";
import {
  getProactiveTimeline,
  recordDigestCreated,
  recordLifeTransition,
  recordSuggestionLifecycle,
} from "../timeline/proactiveTimeline";
import { buildProactivePhrasingHints } from "../phrasing/proactivePhrasing";
import { kindDismissRate } from "../learning/proactiveLearningEngine";
import { DEFAULT_QUIET_HOURS } from "../quiet/quietHoursPolicy";

export type ProactiveIntelligenceEngineDeps = {
  readonly attentionEngine: AttentionEngine;
  readonly suggestionEngine: SuggestionEngine;
  readonly digestBuilder: DigestBuilder;
  readonly lifeTransitionEngine: LifeTransitionEngine;
  readonly notificationDispatcher: NotificationDispatcher;
};

export class ProactiveIntelligenceEngine {
  private readonly deps: ProactiveIntelligenceEngineDeps;

  constructor(deps: ProactiveIntelligenceEngineDeps) {
    this.deps = deps;
  }

  analyze(input: ProactiveIntelligenceInput): ProactiveIntelligenceSnapshot {
    const now = input.now ?? new Date().toISOString();
    const behaviorMetrics = getBehaviorMetrics(input.userId);

    this.deps.suggestionEngine.generate(input);

    const allSuggestions = getAllSuggestions(input.userId);
    const freshSuggestions = allSuggestions.filter(
      (suggestion) =>
        suggestion.status === "generated" ||
        suggestion.status === "scheduled" ||
        suggestion.status === "displayed",
    );

    const mentalLoad = (input.mentalLoad ?? 50) / 100;
    const availability = Math.min(1, (input.freeMinutes ?? 30) / 120);
    const displayable: ProactiveSuggestion[] = [];

    for (const suggestion of freshSuggestions) {
      if (new Date(suggestion.expiresAt).getTime() < Date.now()) {
        const expired = { ...suggestion, status: "expired" as const, updatedAt: now };
        upsertSuggestion(input.userId, expired);
        recordSuggestionLifecycle(input.userId, expired, "suggestion_expired");
        continue;
      }

      const attention = this.deps.attentionEngine.evaluate({
        suggestion,
        now,
        calendarEvents: input.calendarEvents ?? [],
        mentalLoad,
        availability,
        dismissCount: Math.round(behaviorMetrics.dismissRate * 10),
        totalShown: 10,
        kindDismissRate: kindDismissRate(input.userId, suggestion.kind),
        quietConfig: {
          ...DEFAULT_QUIET_HOURS,
          onVacation: input.onVacation ?? false,
          sleepHours: input.sleepHours ?? DEFAULT_QUIET_HOURS.sleepHours,
        },
      });

      if (attention.cancel) {
        const cancelled = { ...suggestion, status: "cancelled" as const, updatedAt: now };
        upsertSuggestion(input.userId, cancelled);
        recordSuggestionLifecycle(input.userId, cancelled, "suggestion_cancelled");
        continue;
      }

      if (!attention.shouldIntervene) {
        const scheduled = {
          ...suggestion,
          status: "scheduled" as const,
          scheduledFor: attention.delayUntil,
          updatedAt: now,
        };
        upsertSuggestion(input.userId, scheduled);
        if (suggestion.status === "generated") {
          recordSuggestionLifecycle(input.userId, scheduled, "suggestion_scheduled");
        }
        continue;
      }

      const displayed = {
        ...suggestion,
        status: "displayed" as const,
        score: attention.score.finalScore,
        updatedAt: now,
      };
      upsertSuggestion(input.userId, displayed);
      if (suggestion.status !== "displayed") {
        recordSuggestionLifecycle(input.userId, displayed, "suggestion_displayed");
      }

      this.deps.notificationDispatcher.dispatch({
        channel: "in_app",
        message: displayed.title,
        suggestionId: displayed.id,
      });

      displayable.push(displayed);
    }

    const scheduledSuggestions = getAllSuggestions(input.userId).filter(
      (suggestion) => suggestion.status === "scheduled" || suggestion.status === "generated",
    );

    const digest = this.deps.digestBuilder.build({
      suggestions: scheduledSuggestions,
      scheduledFor: input.date,
    });

    const digests = digest ? [digest] : [];
    if (digest) {
      recordDigestCreated(input.userId, digest);
    }

    const lifeTransitions = this.deps.lifeTransitionEngine.detect({
      calendarEvents: input.calendarEvents ?? [],
      onVacation: input.onVacation,
      childrenCount: 0,
    });

    for (const signal of lifeTransitions) {
      recordLifeTransition(input.userId, signal);
    }

    const phrasingHints = buildProactivePhrasingHints({ displayable });

    return {
      enabled: true,
      date: input.date,
      suggestions: getAllSuggestions(input.userId),
      displayableSuggestions: displayable,
      digests,
      timeline: getProactiveTimeline(input.userId),
      behaviorMetrics,
      lifeTransitions,
      phrasingHints,
      generatedAt: now,
    };
  }
}

export const defaultProactiveIntelligenceEngine = new ProactiveIntelligenceEngine({
  attentionEngine: defaultAttentionEngine,
  suggestionEngine: defaultSuggestionEngine,
  digestBuilder: defaultDigestBuilder,
  lifeTransitionEngine: defaultLifeTransitionEngine,
  notificationDispatcher: defaultNotificationDispatcher,
});

export function createEmptyProactiveSnapshot(date: string): ProactiveIntelligenceSnapshot {
  return {
    enabled: false,
    date,
    suggestions: [],
    displayableSuggestions: [],
    digests: [],
    timeline: [],
    behaviorMetrics: {
      interruptionTolerance: 0.6,
      notificationPreference: "balanced",
      acceptanceRate: 0.5,
      dismissRate: 0.2,
      preferredMoments: [],
    },
    lifeTransitions: [],
    phrasingHints: [],
    generatedAt: new Date().toISOString(),
  };
}
