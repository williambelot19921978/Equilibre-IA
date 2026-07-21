/**
 * EPIC 5C — Prediction Engine (architecture only — no generative IA).
 */

import type { DailyLoadBreakdown, SemanticPrediction } from "../types/semanticTypes";
import type { LifeBalanceAssessment } from "../types/semanticTypes";

export type PredictionEngineInput = {
  readonly dailyLoad: DailyLoadBreakdown;
  readonly balance: LifeBalanceAssessment;
  readonly conflictCount: number;
  readonly goalProgressPercent: number;
};

export function buildPredictionArchitecture(input: PredictionEngineInput): SemanticPrediction[] {
  const overloadProbability = Math.min(
    0.95,
    input.dailyLoad.mentalLoad / 100 + (input.conflictCount > 0 ? 0.15 : 0),
  );

  const delayProbability = Math.min(
    0.9,
    input.dailyLoad.travelMinutes / 120 + input.conflictCount * 0.1,
  );

  const cancellationProbability = Math.min(0.5, input.conflictCount * 0.12);

  const goalMissProbability = Math.min(
    0.85,
    1 - input.goalProgressPercent / 100 + (input.balance.signals.includes("overload") ? 0.2 : 0),
  );

  return [
    {
      kind: "overload",
      probability: overloadProbability,
      horizon: "daily",
      message: "Architecture — probabilité de surcharge calculée à partir de la charge mentale.",
      architectureOnly: true,
    },
    {
      kind: "delay",
      probability: delayProbability,
      horizon: "daily",
      message: "Architecture — probabilité de retard liée aux déplacements et conflits.",
      architectureOnly: true,
    },
    {
      kind: "cancellation",
      probability: cancellationProbability,
      horizon: "weekly",
      message: "Architecture — probabilité d'annulation basée sur les conflits agenda.",
      architectureOnly: true,
    },
    {
      kind: "goal_miss",
      probability: goalMissProbability,
      horizon: "monthly",
      message: "Architecture — probabilité d'objectif non atteint (progression + charge).",
      architectureOnly: true,
    },
  ];
}
