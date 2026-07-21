/**
 * MotivationRule — Motivation à partir du check-in, objectifs et progression.
 */

import type { MotivationLevel } from "../types/humanModel";
import type { HumanModelRule, HumanModelRuleInput } from "../types/ruleTypes";
import { ruleOutput } from "../types/ruleTypes";

export const motivationRule: HumanModelRule<MotivationLevel | null> = {
  id: "motivation",
  label: "Motivation",
  evaluate(input: HumanModelRuleInput) {
    if (input.adaptiveEnabled && input.validatedPreferenceCount > 0) {
      const reasons = [
        `${input.validatedPreferenceCount} préférence(s) validée(s) par l'utilisateur.`,
        ...input.validatedPreferenceLabels.slice(0, 2),
      ];
      const value: MotivationLevel =
        input.learningConfidence >= 0.7 ? "Motivation bonne" : "Motivation moyenne";
      return ruleOutput<MotivationLevel | null>(
        value,
        input.learningConfidence,
        `Motivation informée par préférences validées : ${value}.`,
        reasons,
      );
    }

    const reasons: string[] = [];
    let score = 1;

    const checkin = input.dailyCheckin;
    if (checkin) {
      if (checkin.mood === "great") {
        score += 2;
        reasons.push("Check-in : en pleine forme.");
      } else if (checkin.mood === "good") {
        score += 1;
        reasons.push("Check-in : humeur positive.");
      } else if (checkin.mood === "exhausted" || checkin.mood === "sick") {
        score -= 2;
        reasons.push("Check-in : épuisement ou maladie — motivation réduite.");
      } else if (checkin.mood === "tired" || checkin.mood === "stressed") {
        score -= 1;
        reasons.push("Check-in : fatigue ou stress — motivation modérée.");
      }
    }

    if (input.goalsEnabled && input.activeGoalCount > 0) {
      score += 0.5;
      reasons.push(`${input.activeGoalCount} objectif(s) actif(s) — ancrage motivationnel.`);
      const top = input.goals[0];
      if (top && top.progressPercent >= 50) {
        score += 0.5;
        reasons.push(`Progression visible sur « ${top.name} ».`);
      }
    } else if (input.goalsEnabled) {
      reasons.push("Objectifs activés mais aucun objectif actif.");
    }

    if (reasons.length === 0) {
      return ruleOutput<MotivationLevel | null>(
        null,
        0,
        "Impossible d'estimer la motivation sans check-in ni objectif.",
        [],
        ["Aucun check-in récent.", "Pas d'objectif actif."],
      );
    }

    let value: MotivationLevel;
    if (score <= 0) value = "Motivation faible";
    else if (score === 1) value = "Motivation moyenne";
    else value = "Motivation bonne";

    const confidence = Math.min(0.85, 0.3 + reasons.length * 0.15);

    return ruleOutput<MotivationLevel | null>(value, confidence, `Motivation : ${value}.`, reasons);
  },
};
