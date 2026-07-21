/**
 * EPIC 6C — Adaptive question engine.
 */

import type { CheckinFlowPlan, CheckinFlowStep, CheckinMode, DailyState } from "../types/dailyStateTypes";
import { getStateHistory } from "../store/dailyStateStore";

const LOW_ENERGY_THRESHOLD = 3;

export function shouldSkipSleepQuestion(history: readonly DailyState[]): boolean {
  const recent = history.filter((state) => state.sleepQuality > 0).slice(0, 14);
  if (recent.length < 7) return false;
  const alwaysFive = recent.every((state) => state.sleepQuality >= 5);
  const avg = recent.reduce((sum, state) => sum + state.sleepQuality, 0) / recent.length;
  return alwaysFive || avg >= 4.8;
}

export function needsAdaptiveSleepQuestion(energy: number): boolean {
  return energy <= LOW_ENERGY_THRESHOLD;
}

export function buildCheckinFlow(input: {
  readonly userId: string;
  readonly mode: CheckinMode;
  readonly energy?: number;
}): CheckinFlowPlan {
  const history = getStateHistory(input.userId);
  const skipSleep = shouldSkipSleepQuestion(history);

  const steps: CheckinFlowStep[] = ["mood", "energy"];

  if (input.mode !== "quick") {
    steps.push("stress");
    if (!skipSleep) {
      steps.push("sleep");
    }
  }

  if (input.mode === "complete") {
    steps.push("specialDay", "notes");
  }

  let adaptiveStep: CheckinFlowStep | undefined;
  if (input.energy !== undefined && needsAdaptiveSleepQuestion(input.energy) && skipSleep) {
    adaptiveStep = "adaptive_sleep";
  }

  const baseSeconds = steps.length * 5 + (adaptiveStep ? 5 : 0);

  return {
    mode: input.mode,
    steps,
    adaptiveStep,
    estimatedSeconds: Math.min(45, baseSeconds),
  };
}

export function recordAdaptiveObservation(message: string): string {
  return `Observation adaptative : ${message}`;
}
