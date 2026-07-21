/**
 * EPIC 5C — Life Balance Engine.
 */

import type { SemanticCalendarItem } from "../types/semanticCalendarItem";
import type { DailyLoadBreakdown } from "../types/semanticTypes";
import type {
  LifeBalanceAssessment,
  LifeBalancePeriod,
  LifeBalanceSignal,
} from "../types/semanticTypes";

export type LifeBalanceInput = {
  readonly items: readonly SemanticCalendarItem[];
  readonly dailyLoad: DailyLoadBreakdown;
  readonly freeMinutesAvailable: number;
  readonly period: LifeBalancePeriod;
  readonly childrenCount?: number;
};

function detectSignals(input: LifeBalanceInput): LifeBalanceSignal[] {
  const signals: LifeBalanceSignal[] = [];
  const { dailyLoad, items, freeMinutesAvailable } = input;

  const sportMinutes = items
    .filter((item) => item.category === "sport" && item.status !== "cancelled")
    .reduce((sum, item) => sum + item.estimatedDuration, 0);

  const personalMinutes = dailyLoad.personalMinutes + dailyLoad.freeMinutes;
  const workRatio =
    dailyLoad.totalBusyMinutes > 0
      ? dailyLoad.workMinutes / dailyLoad.totalBusyMinutes
      : 0;
  const familyRatio =
    dailyLoad.totalBusyMinutes > 0
      ? dailyLoad.familyMinutes / dailyLoad.totalBusyMinutes
      : 0;

  if (dailyLoad.mentalLoad >= 70 || dailyLoad.totalBusyMinutes >= 600) {
    signals.push("overload");
  }
  if (sportMinutes === 0 && input.period !== "monthly") {
    signals.push("no_sport");
  }
  if (personalMinutes < 30 && freeMinutesAvailable < 60) {
    signals.push("no_personal_time");
  }
  if (workRatio > 0.65) {
    signals.push("work_overinvestment");
  }
  if (input.childrenCount && input.childrenCount > 0 && familyRatio < 0.1 && dailyLoad.totalBusyMinutes > 300) {
    signals.push("family_imbalance");
  }
  if (
    items.some((item) => item.category === "repos" || /sommeil/i.test(item.title)) === false &&
    dailyLoad.totalBusyMinutes > 720
  ) {
    signals.push("sleep_deficit");
  }
  if (signals.length === 0) {
    signals.push("balanced");
  }

  return signals;
}

function scoreBalance(signals: readonly LifeBalanceSignal[]): number {
  let score = 85;
  for (const signal of signals) {
    switch (signal) {
      case "overload":
        score -= 25;
        break;
      case "sleep_deficit":
        score -= 20;
        break;
      case "no_sport":
        score -= 10;
        break;
      case "no_personal_time":
        score -= 15;
        break;
      case "work_overinvestment":
        score -= 18;
        break;
      case "family_imbalance":
        score -= 12;
        break;
      default:
        break;
    }
  }
  return Math.max(0, Math.min(100, score));
}

export function assessLifeBalance(input: LifeBalanceInput): LifeBalanceAssessment {
  const signals = detectSignals(input);
  const score = scoreBalance(signals);
  const periodLabel =
    input.period === "daily" ? "quotidien" : input.period === "weekly" ? "hebdomadaire" : "mensuel";

  return {
    period: input.period,
    score,
    signals,
    confidence: input.items.length > 0 ? 0.75 : 0.4,
    explanation: `Équilibre ${periodLabel} : ${score}/100 — ${signals.join(", ")}.`,
  };
}
