/**
 * StressRule — Estime le stress à partir du check-in et de la charge perçue.
 */

import type { StressLevel } from "../types/humanModel";
import type { HumanModelRule, HumanModelRuleInput } from "../types/ruleTypes";
import { ruleOutput } from "../types/ruleTypes";

function scoreToStress(score: number): StressLevel {
  if (score <= 0) return "Stress faible";
  if (score === 1) return "Stress moyen";
  return "Stress élevé";
}

export const stressRule: HumanModelRule<StressLevel | null> = {
  id: "stress",
  label: "Stress",
  evaluate(input: HumanModelRuleInput) {
    if (input.dailyStateEnabled && input.dailyStateToday) {
      const state = input.dailyStateToday;
      const value =
        state.stress <= 3 ? "Stress faible" : state.stress <= 6 ? "Stress moyen" : "Stress élevé";
      return ruleOutput<StressLevel | null>(
        value,
        Math.min(0.98, 0.9 + state.confidence * 0.05),
        `Stress déclaré au check-in : ${value}.`,
        [`Check-in du jour — stress ${state.stress}/10.`],
      );
    }

    const reasons: string[] = [];
    let score = 0;
    let signals = 0;

    const checkin = input.dailyCheckin;
    if (checkin) {
      if (checkin.mood === "stressed") {
        score += 2;
        signals += 1;
        reasons.push("Humeur du check-in : stressé(e).");
      } else if (checkin.mood === "exhausted" || checkin.mood === "sick") {
        score += 1;
        signals += 1;
        reasons.push(`Humeur du check-in : ${checkin.mood}.`);
      }

      const raw = checkin.stress_level?.toLowerCase() ?? "";
      if (raw.includes("high") || raw.includes("élev") || raw.includes("fort")) {
        score += 2;
        signals += 1;
        reasons.push(`Stress déclaré : ${checkin.stress_level}.`);
      } else if (raw.includes("medium") || raw.includes("moyen")) {
        score += 1;
        signals += 1;
        reasons.push(`Stress déclaré : ${checkin.stress_level}.`);
      } else if (raw.includes("low") || raw.includes("faible")) {
        score -= 1;
        signals += 1;
        reasons.push(`Stress déclaré faible : ${checkin.stress_level}.`);
      }
    }

    if (input.taskTodoCount >= 8 && input.blockCount >= 6) {
      score += 1;
      signals += 1;
      reasons.push("Combinaison planning dense + nombreuses tâches ouvertes.");
    }

    if (signals === 0) {
      return ruleOutput<StressLevel | null>(
        null,
        0,
        "Impossible d'estimer le stress sans check-in récent.",
        [],
        ["Aucun check-in du jour avec indicateur de stress."],
      );
    }

    const value = scoreToStress(Math.max(0, Math.round(score)));
    const confidence = Math.min(0.9, 0.3 + signals * 0.2);

    return ruleOutput<StressLevel | null>(value, confidence, `Stress estimé : ${value}.`, reasons);
  },
};
