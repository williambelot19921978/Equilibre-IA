/**
 * EPIC 6A — Adaptive diagnostics builder.
 */

import type { AdaptiveIntelligenceEngine } from "../engine/adaptiveIntelligenceEngine";
import { defaultAdaptiveIntelligenceEngine } from "../engine/adaptiveIntelligenceEngine";
import type { AdaptiveIntelligenceSnapshot } from "../types/adaptiveTypes";

export type AdaptiveDiagnostics = AdaptiveIntelligenceSnapshot & {
  readonly pendingCount: number;
  readonly validatedCount: number;
  readonly habitCount: number;
  readonly observationCount: number;
};

export async function buildAdaptiveDiagnostics(input: {
  readonly userId: string;
  readonly date: string;
  readonly calendarEvents?: import("../types/adaptiveTypes").AdaptiveIntelligenceInput["calendarEvents"];
  readonly taskEvents?: import("../types/adaptiveTypes").AdaptiveIntelligenceInput["taskEvents"];
  readonly engine?: AdaptiveIntelligenceEngine;
}): Promise<AdaptiveDiagnostics> {
  const engine = input.engine ?? defaultAdaptiveIntelligenceEngine;
  const snapshot = engine.analyze({
    userId: input.userId,
    date: input.date,
    calendarEvents: input.calendarEvents,
    taskEvents: input.taskEvents,
  });

  return {
    ...snapshot,
    pendingCount: snapshot.proposals.filter((prop) => prop.status === "pending").length,
    validatedCount: snapshot.validatedPreferences.length,
    habitCount: snapshot.habits.length,
    observationCount: snapshot.observations.length,
  };
}
