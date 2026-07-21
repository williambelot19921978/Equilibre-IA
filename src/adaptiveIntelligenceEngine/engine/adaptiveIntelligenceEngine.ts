/**
 * EPIC 6A — Adaptive Intelligence Engine orchestrator.
 * Read-only consumer of Planning/Semantic/HumanModel/Memory — never writes to them.
 */

import type { SemanticCalendarItem } from "../../semanticPlanningEngine/types/semanticCalendarItem";
import type {
  AdaptiveIntelligenceInput,
  AdaptiveIntelligenceSnapshot,
} from "../types/adaptiveTypes";
import { defaultObservationEngine, type ObservationEngine } from "../observation/observationEngine";
import { getObservations } from "../observation/observationStore";
import { defaultHabitDetector, type HabitDetector } from "../habit/habitDetector";
import {
  defaultPreferenceProposalEngine,
  type PreferenceProposalEngine,
} from "../preference/preferenceProposalEngine";
import { getAllPreferences, getValidatedPreferences } from "../preference/preferenceStore";
import { syncTimelineFromAnalysis, getLearningTimeline } from "../timeline/learningTimeline";
import { buildAdaptivePhrasingHints } from "../phrasing/adaptivePhrasing";
import { defaultAdaptiveNotificationBus, type AdaptiveNotificationBus } from "../events/adaptiveNotificationBus";

export type AdaptiveIntelligenceEngineDeps = {
  readonly observationEngine: ObservationEngine;
  readonly habitDetector: HabitDetector;
  readonly preferenceEngine: PreferenceProposalEngine;
  readonly notificationBus: AdaptiveNotificationBus;
};

export class AdaptiveIntelligenceEngine {
  private readonly deps: AdaptiveIntelligenceEngineDeps;

  constructor(deps: AdaptiveIntelligenceEngineDeps) {
    this.deps = deps;
  }

  buildInputFromSemanticItems(
    userId: string,
    date: string,
    items: readonly SemanticCalendarItem[],
  ): AdaptiveIntelligenceInput {
    return {
      userId,
      date,
      calendarEvents: items.map((item) => ({
        id: item.id,
        title: item.title,
        start: item.start,
        end: item.end,
        category: item.category,
        type: item.type,
      })),
    };
  }

  analyze(input: AdaptiveIntelligenceInput): AdaptiveIntelligenceSnapshot {
    this.deps.observationEngine.record(input.userId, input);

    const allObservations = getObservations(input.userId);
    const habits = this.deps.habitDetector.detect(allObservations);
    const proposals = this.deps.preferenceEngine.propose({
      userId: input.userId,
      habits,
      observations: allObservations,
    });

    const timeline = syncTimelineFromAnalysis({
      userId: input.userId,
      habits,
      proposals,
    });

    const validatedPreferences = getValidatedPreferences(input.userId);
    const pending = proposals.filter((prop) => prop.status === "pending");
    const phrasingHints = buildAdaptivePhrasingHints({
      pendingProposals: pending,
      validatedCount: validatedPreferences.length,
    });

    for (const habit of habits.filter((h) => h.evolution === "emerging")) {
      this.deps.notificationBus.queue(
        "habit_detected",
        `Nouvelle habitude détectée : ${habit.label}`,
      );
    }
    for (const proposal of pending.slice(0, 1)) {
      this.deps.notificationBus.queue(
        "preference_proposed",
        `Préférence proposée : ${proposal.label}`,
      );
    }
    for (const habit of habits.filter((h) => h.evolution === "abandoned")) {
      this.deps.notificationBus.queue(
        "habit_obsolete",
        `Habitude devenue obsolète : ${habit.label}`,
      );
    }

    return {
      enabled: true,
      date: input.date,
      observations: allObservations,
      habits,
      proposals: getAllPreferences(input.userId),
      validatedPreferences,
      timeline,
      phrasingHints,
      generatedAt: new Date().toISOString(),
    };
  }
}

export const defaultAdaptiveIntelligenceEngine = new AdaptiveIntelligenceEngine({
  observationEngine: defaultObservationEngine,
  habitDetector: defaultHabitDetector,
  preferenceEngine: defaultPreferenceProposalEngine,
  notificationBus: defaultAdaptiveNotificationBus,
});

export function createEmptyAdaptiveSnapshot(date: string): AdaptiveIntelligenceSnapshot {
  return {
    enabled: false,
    date,
    observations: [],
    habits: [],
    proposals: [],
    validatedPreferences: [],
    timeline: getLearningTimeline(""),
    phrasingHints: [],
    generatedAt: new Date().toISOString(),
  };
}
