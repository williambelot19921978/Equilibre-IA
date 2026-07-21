/**
 * EPIC 6C — Daily State Engine orchestrator.
 */

import type {
  DailyState,
  DailyStateInput,
  DailyStateSnapshot,
  StateTrendPeriod,
} from "../types/dailyStateTypes";
import {
  consecutiveSkipDays,
  getCheckinMode,
  getDailyState,
  getStateHistory,
  recordSkip,
  saveDailyState,
  setCheckinMode,
} from "../store/dailyStateStore";
import { trackCheckinCompleted } from "../../auraInsights";
import { trackInsightEvent } from "../../auraInsights/eventStore";
import { buildCheckinFlow } from "../adaptive/adaptiveQuestionEngine";
import { buildDailyStateFromInput } from "../bridge/dailyCheckinBridge";
import { computeTrends, defaultTrendEngine, type TrendEngine } from "../trends/trendEngine";
import { buildStatePhrasingHints } from "../phrasing/statePhrasing";
import type { CheckinMode } from "../types/dailyStateTypes";

export type DailyStateEngineDeps = {
  readonly trendEngine: TrendEngine;
};

export class DailyStateEngine {
  private readonly deps: DailyStateEngineDeps;

  constructor(deps: DailyStateEngineDeps) {
    this.deps = deps;
  }

  getToday(userId: string, date: string): DailyState | null {
    return getDailyState(userId, date);
  }

  submitCheckin(input: DailyStateInput): DailyState {
    const state = buildDailyStateFromInput(input);
    const saved = saveDailyState(input.userId, state);
    const mode = getCheckinMode(input.userId);
    trackCheckinCompleted(input.userId, mode);
    return saved;
  }

  skipCheckin(userId: string, date: string): void {
    recordSkip(userId, date);
    trackInsightEvent(userId, "checkin_skipped", {});
  }

  updateMode(userId: string, mode: CheckinMode): void {
    setCheckinMode(userId, mode);
  }

  getTrends(userId: string, period: StateTrendPeriod, untilDate: string) {
    return this.deps.trendEngine.compute({
      states: getStateHistory(userId),
      period,
      untilDate,
    });
  }

  analyze(userId: string, date: string): DailyStateSnapshot {
    const today = getDailyState(userId, date);
    const mode = getCheckinMode(userId);
    const skipStreak = consecutiveSkipDays(userId, date);
    const shouldRemind = !today && skipStreak >= 3;

    return {
      enabled: true,
      date,
      today,
      hasCheckinToday: Boolean(today),
      skipCount: skipStreak,
      shouldRemind,
      reminderMessage: shouldRemind
        ? "Quelques jours sans check-in — 30 secondes pour partager ton ressenti ?"
        : undefined,
      trends7d: this.getTrends(userId, "7d", date),
      phrasingHints: buildStatePhrasingHints(today),
      flowPlan: buildCheckinFlow({ userId, mode, energy: today?.energy }),
      generatedAt: new Date().toISOString(),
    };
  }
}

export const defaultDailyStateEngine = new DailyStateEngine({
  trendEngine: defaultTrendEngine,
});

export function createEmptyDailyStateSnapshot(date: string): DailyStateSnapshot {
  return {
    enabled: false,
    date,
    today: null,
    hasCheckinToday: false,
    skipCount: 0,
    shouldRemind: false,
    trends7d: computeTrends({ states: [], period: "7d", untilDate: date }),
    phrasingHints: [],
    flowPlan: buildCheckinFlow({ userId: "", mode: "standard" }),
    generatedAt: new Date().toISOString(),
  };
}
