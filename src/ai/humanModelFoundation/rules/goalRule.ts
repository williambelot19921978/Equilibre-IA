/**
 * GoalRule — Objectif dominant (premier actif ou plus avancé).
 */

import type { DominantGoalSnapshot } from "../types/humanModel";
import type { HumanModelRule, HumanModelRuleInput } from "../types/ruleTypes";
import { ruleOutput } from "../types/ruleTypes";

export const goalRule: HumanModelRule<DominantGoalSnapshot | null> = {
  id: "dominantGoal",
  label: "Objectif dominant",
  evaluate(input: HumanModelRuleInput) {
    if (!input.goalsEnabled) {
      return ruleOutput(
        null,
        0,
        "Fonctionnalité objectifs désactivée.",
        [],
        ["Feature flag objectifs inactif."],
      );
    }

    if (input.goals.length === 0) {
      return ruleOutput(
        null,
        0,
        "Aucun objectif actif enregistré.",
        [],
        ["Aucun objectif actif."],
      );
    }

    const sorted = [...input.goals].sort(
      (left, right) => right.progressPercent - left.progressPercent,
    );
    const top = sorted[0]!;

    return ruleOutput(
      {
        id: top.id,
        name: top.name,
        progressPercent: top.progressPercent,
      },
      0.75,
      `Objectif dominant : « ${top.name} » (${top.progressPercent} % de progression estimée).`,
      [
        `${input.activeGoalCount} objectif(s) actif(s).`,
        `Priorité retenue : « ${top.name} ».`,
      ],
    );
  },
};
