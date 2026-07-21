/**
 * MentalLoadRule — Charge mentale à partir des tâches, blocs planning et enfants.
 */

import type { MentalLoadLevel } from "../types/humanModel";
import type { HumanModelRule, HumanModelRuleInput } from "../types/ruleTypes";
import { ruleOutput } from "../types/ruleTypes";

function scoreToLoad(score: number): MentalLoadLevel {
  if (score <= 2) return "Charge légère";
  if (score <= 5) return "Charge normale";
  return "Charge forte";
}

export const mentalLoadRule: HumanModelRule<MentalLoadLevel> = {
  id: "mentalLoad",
  label: "Charge mentale",
  evaluate(input: HumanModelRuleInput) {
    if (input.semanticEnabled && input.semanticMentalLoad > 0) {
      const value: MentalLoadLevel =
        input.semanticMentalLoad <= 35
          ? "Charge légère"
          : input.semanticMentalLoad <= 65
            ? "Charge normale"
            : "Charge forte";
      return ruleOutput(
        value,
        0.85,
        `Charge mentale (Semantic Engine) : ${value}.`,
        [
          `Score sémantique : ${input.semanticMentalLoad}/100.`,
          ...input.semanticBalanceSignals.slice(0, 2).map((signal) => `Signal : ${signal}.`),
        ],
      );
    }

    const reasons: string[] = [];
    let score = 0;

    if (input.taskTodoCount > 0) {
      const taskScore = Math.min(4, Math.ceil(input.taskTodoCount / 3));
      score += taskScore;
      reasons.push(`${input.taskTodoCount} tâche(s) en attente.`);
    } else {
      reasons.push("Peu ou pas de tâches ouvertes.");
    }

    if (input.blockCount > 0) {
      const blockScore = Math.min(3, Math.ceil(input.blockCount / 3));
      score += blockScore;
      reasons.push(`${input.blockCount} bloc(s) planifié(s) aujourd'hui.`);
    }

    if (input.childrenCount > 0) {
      score += Math.min(2, input.childrenCount);
      reasons.push(`${input.childrenCount} enfant(s) à coordonner.`);
    }

    if (input.taskTodoCount === 0 && input.blockCount === 0) {
      return ruleOutput(
        "Charge légère",
        0.4,
        "Charge mentale légère par défaut — peu de données d'activité.",
        reasons,
        input.hasLoadedPlan ? [] : ["Planning du jour non chargé."],
      );
    }

    const value = scoreToLoad(score);
    const confidence = Math.min(0.88, 0.45 + reasons.length * 0.12);

    return ruleOutput(value, confidence, `Charge mentale : ${value}.`, reasons);
  },
};
