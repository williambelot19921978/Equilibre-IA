/**
 * FamilyPressureRule — Pression familiale selon enfants et membres du foyer.
 */

import type { FamilyPressureLevel } from "../types/humanModel";
import type { HumanModelRule, HumanModelRuleInput } from "../types/ruleTypes";
import { ruleOutput } from "../types/ruleTypes";

export const familyPressureRule: HumanModelRule<FamilyPressureLevel> = {
  id: "familyPressure",
  label: "Pression familiale",
  evaluate(input: HumanModelRuleInput) {
    const reasons: string[] = [];

    if (input.childrenCount === 0 && input.memberCount <= 1) {
      return ruleOutput(
        "Pression faible",
        0.5,
        "Peu de contraintes familiales identifiées.",
        ["Aucun enfant enregistré.", "Foyer minimal ou solo."],
      );
    }

    let score = 0;
    if (input.childrenCount >= 3) {
      score += 2;
      reasons.push(`${input.childrenCount} enfant(s) — coordination élevée.`);
    } else if (input.childrenCount >= 1) {
      score += 1;
      reasons.push(`${input.childrenCount} enfant(s) à prendre en compte.`);
    }

    if (input.memberCount >= 4) {
      score += 1;
      reasons.push(`${input.memberCount} membre(s) dans le foyer.`);
    }

    let value: FamilyPressureLevel;
    if (score <= 0) value = "Pression faible";
    else if (score === 1) value = "Pression modérée";
    else value = "Pression élevée";

    const confidence = Math.min(0.8, 0.5 + reasons.length * 0.1);

    return ruleOutput(value, confidence, `Pression familiale : ${value}.`, reasons);
  },
};
