/**
 * EPIC 6C — State phrasing for Conversation Engine.
 */

import type { DailyState } from "../types/dailyStateTypes";

export function buildStatePhrasingHints(state: DailyState | null): string[] {
  if (!state) return [];

  if (state.energy <= 3 || state.mood === "tired" || state.mood === "very_tired") {
    return ["Nous allons essayer de rendre cette journée plus légère."];
  }

  if (state.energy >= 8 || state.mood === "excellent") {
    return ["Tu sembles en pleine forme aujourd'hui."];
  }

  if (state.stress >= 7) {
    return ["Journée stressante déclarée — je resterai concis et bienveillant."];
  }

  return [];
}

export function proactiveReductionFactor(state: DailyState | null): number {
  if (!state) return 1;
  if (state.energy <= 3 || state.mood === "very_tired") return 0.4;
  if (state.energy <= 5 || state.mood === "tired") return 0.65;
  if (state.stress >= 8) return 0.7;
  return 1;
}

export function semanticFatigueInsight(state: DailyState | null, mentalLoad: number): string | null {
  if (!state) return null;
  if (mentalLoad >= 70 && (state.mood === "tired" || state.mood === "very_tired" || state.energy <= 4)) {
    return "Planning chargé combiné à une fatigue élevée déclarée ce matin.";
  }
  return null;
}
