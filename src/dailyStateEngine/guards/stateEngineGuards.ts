/**
 * EPIC 6C — Guards for Action / Proactive / Semantic engines.
 */

import type { DailyState } from "../types/dailyStateTypes";

export type DailyStateSignal = Pick<DailyState, "energy" | "stress" | "mood">;

export function shouldSoftenActions(state: DailyStateSignal | null): boolean {
  if (!state) return false;
  return state.energy <= 4 || state.mood === "tired" || state.mood === "very_tired";
}

export function actionConfidenceFromState(state: DailyStateSignal | null, baseConfidence: number): number {
  if (!state) return baseConfidence;
  if (state.energy <= 3) return Math.min(baseConfidence, 0.45);
  if (state.stress >= 8) return Math.min(baseConfidence, 0.55);
  return baseConfidence;
}

export function humanModelPriorityConfidence(state: DailyState | null): number {
  if (!state) return 0;
  return Math.min(0.98, 0.85 + state.confidence * 0.1);
}
