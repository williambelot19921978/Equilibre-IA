/**
 * EPIC 6C — Daily State diagnostics.
 */

import { getStateHistory } from "../store/dailyStateStore";
import { defaultDailyStateEngine, type DailyStateEngine } from "../engine/dailyStateEngine";
import type { DailyStateSnapshot, StateTrends } from "../types/dailyStateTypes";

export type DailyStateDiagnostics = DailyStateSnapshot & {
  readonly trends30d: StateTrends;
  readonly trends12m: StateTrends;
  readonly historyCount: number;
};

export async function buildDailyStateDiagnostics(input: {
  readonly userId: string;
  readonly date: string;
  readonly engine?: DailyStateEngine;
}): Promise<DailyStateDiagnostics> {
  const engine = input.engine ?? defaultDailyStateEngine;
  const snapshot = engine.analyze(input.userId, input.date);

  return {
    ...snapshot,
    trends30d: engine.getTrends(input.userId, "30d", input.date),
    trends12m: engine.getTrends(input.userId, "12m", input.date),
    historyCount: getStateHistory(input.userId).length,
  };
}
