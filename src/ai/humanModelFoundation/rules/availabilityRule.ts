/**
 * AvailabilityRule — Disponibilité estimée (inverse de charge + fatigue).
 * Dépend des sorties implicites recalculées localement pour éviter couplage fort.
 */

import type { AvailabilityLevel, EnergyLevel, MentalLoadLevel } from "../types/humanModel";
import type { HumanModelRule, HumanModelRuleInput } from "../types/ruleTypes";
import { ruleOutput } from "../types/ruleTypes";
import { fatigueRule } from "./fatigueRule";
import { mentalLoadRule } from "./mentalLoadRule";

function toAvailability(
  energy: EnergyLevel | null,
  load: MentalLoadLevel | null,
  blockCount: number,
  taskTodoCount: number,
  freeMinutesToday: number,
  conflictCount: number,
): AvailabilityLevel {
  let score = 2;

  if (energy === "Très fatigué" || energy === "Fatigué") score -= 2;
  else if (energy === "Très reposé" || energy === "Reposé") score += 1;

  if (load === "Charge forte") score -= 2;
  else if (load === "Charge légère") score += 1;

  if (blockCount >= 8) score -= 1;
  if (taskTodoCount >= 10) score -= 1;
  if (freeMinutesToday >= 120) score += 1;
  else if (freeMinutesToday > 0 && freeMinutesToday < 30) score -= 1;
  if (conflictCount > 0) score -= 1;

  if (score <= 0) return "Faible";
  if (score === 1) return "Moyenne";
  return "Bonne";
}

export const availabilityRule: HumanModelRule<AvailabilityLevel> = {
  id: "availability",
  label: "Disponibilité",
  evaluate(input: HumanModelRuleInput) {
    const energyResult = fatigueRule.evaluate(input);
    const loadResult = mentalLoadRule.evaluate(input);
    const reasons = [
      ...energyResult.reasons.map((reason) => `Énergie : ${reason}`),
      ...loadResult.reasons.map((reason) => `Charge : ${reason}`),
    ];

    const value = toAvailability(
      energyResult.value,
      loadResult.value,
      input.semanticEnabled ? input.timelineEventCount : input.blockCount,
      input.taskTodoCount,
      input.freeMinutesToday,
      input.conflictCount,
    );

    let adjustedValue = value;
    if (input.semanticEnabled && input.semanticBalanceScore < 45) {
      adjustedValue =
        value === "Bonne" ? "Moyenne" : value === "Moyenne" ? "Faible" : "Faible";
    }

    const signals = (energyResult.value ? 1 : 0) + (loadResult.value ? 1 : 0);
    const confidence =
      signals === 0
        ? 0.35
        : Math.min(0.85, (energyResult.confidence + loadResult.confidence) / 2);

    const missingData =
      signals === 0
        ? ["Disponibilité estimée avec faible confiance — données limitées."]
        : [];

    return ruleOutput(
      adjustedValue,
      confidence,
      `Disponibilité estimée : ${adjustedValue}.`,
      reasons,
      missingData,
    );
  },
};
