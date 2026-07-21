/**
 * EPIC 6B — Proactive diagnostics builder.
 */

import type { ProactiveIntelligenceEngine } from "../engine/proactiveIntelligenceEngine";
import { defaultProactiveIntelligenceEngine } from "../engine/proactiveIntelligenceEngine";
import type { ProactiveIntelligenceInput, ProactiveIntelligenceSnapshot } from "../types/proactiveTypes";

export type ProactiveDiagnostics = ProactiveIntelligenceSnapshot & {
  readonly displayableCount: number;
  readonly scheduledCount: number;
  readonly dismissedCount: number;
  readonly acceptedCount: number;
};

export async function buildProactiveDiagnostics(input: {
  readonly userId: string;
  readonly date: string;
  readonly calendarEvents?: ProactiveIntelligenceInput["calendarEvents"];
  readonly mentalLoad?: number;
  readonly balanceScore?: number;
  readonly freeMinutes?: number;
  readonly conflictCount?: number;
  readonly topHabits?: readonly string[];
  readonly validatedPreferences?: readonly string[];
  readonly activeGoals?: readonly { readonly id: string; readonly name: string }[];
  readonly taskTodoCount?: number;
  readonly onVacation?: boolean;
  readonly engine?: ProactiveIntelligenceEngine;
}): Promise<ProactiveDiagnostics> {
  const engine = input.engine ?? defaultProactiveIntelligenceEngine;
  const snapshot = engine.analyze({
    userId: input.userId,
    date: input.date,
    calendarEvents: input.calendarEvents,
    mentalLoad: input.mentalLoad,
    balanceScore: input.balanceScore,
    freeMinutes: input.freeMinutes,
    conflictCount: input.conflictCount,
    topHabits: input.topHabits,
    validatedPreferences: input.validatedPreferences,
    activeGoals: input.activeGoals,
    taskTodoCount: input.taskTodoCount,
    onVacation: input.onVacation,
  });

  return {
    ...snapshot,
    displayableCount: snapshot.displayableSuggestions.length,
    scheduledCount: snapshot.suggestions.filter((suggestion) => suggestion.status === "scheduled")
      .length,
    dismissedCount: snapshot.suggestions.filter((suggestion) => suggestion.status === "dismissed")
      .length,
    acceptedCount: snapshot.suggestions.filter((suggestion) => suggestion.status === "accepted")
      .length,
  };
}
