import { BALANCE_LEVEL_THRESHOLDS } from "./constants";
import type { BalanceLevel, BalanceScoreResult } from "./types";

export function resolveBalanceLevel(score: number): BalanceLevel {
  if (score >= BALANCE_LEVEL_THRESHOLDS.balancedMin) return "balanced";
  if (score >= BALANCE_LEVEL_THRESHOLDS.busyMin) return "busy";
  return "overloaded";
}

export function explainBalanceLevel(level: BalanceLevel): string {
  switch (level) {
    case "balanced":
      return "Journée équilibrée";
    case "busy":
      return "Journée chargée";
    case "overloaded":
      return "Journée surchargée";
    default:
      return "Analyse en cours";
  }
}

export function explainBalanceScore(result: BalanceScoreResult): string {
  const levelLabel = explainBalanceLevel(result.level);
  const negativeFactors = result.factors.filter((factor) => factor.impact < 0);
  const positiveFactors = result.factors.filter((factor) => factor.impact > 0);

  if (negativeFactors.length === 0 && positiveFactors.length === 0) {
    return `${levelLabel} — score ${result.score}/100.`;
  }

  const mainFactor = negativeFactors[0] ?? positiveFactors[0];
  if (!mainFactor) {
    return `${levelLabel} — score ${result.score}/100.`;
  }

  return `${levelLabel} — ${mainFactor.explanation}`;
}

export function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}
