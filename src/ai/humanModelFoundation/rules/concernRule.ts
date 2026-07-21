/**
 * ConcernRule — Préoccupation dominante (Daily Brief, tâches, gaps).
 */

import type { HumanModelRule, HumanModelRuleInput } from "../types/ruleTypes";
import { ruleOutput } from "../types/ruleTypes";

export const concernRule: HumanModelRule<string | null> = {
  id: "dominantConcern",
  label: "Préoccupation dominante",
  evaluate(input: HumanModelRuleInput) {
    const reasons: string[] = [];

    if (input.dailyBrief?.synthesis) {
      const excerpt = input.dailyBrief.synthesis.slice(0, 120);
      reasons.push(`Daily Brief : ${excerpt}${input.dailyBrief.synthesis.length > 120 ? "…" : ""}`);
      return ruleOutput(
        input.dailyBrief.synthesis.slice(0, 200),
        0.7,
        "Préoccupation dérivée du Daily Brief.",
        reasons,
      );
    }

    if (input.taskTodoCount >= 8) {
      reasons.push(`${input.taskTodoCount} tâches ouvertes.`);
      const top = input.topTaskTitles[0];
      return ruleOutput(
        top ? `Tâches en attente — priorité : « ${top} »` : "Nombreuses tâches en attente",
        0.55,
        "Préoccupation liée à la charge de tâches.",
        reasons,
      );
    }

    if (input.gaps.length > 0) {
      return ruleOutput(
        input.gaps[0] ?? null,
        0.4,
        "Préoccupation déduite d'une lacune de données.",
        [`Lacune : ${input.gaps[0]}`],
      );
    }

    return ruleOutput(
      null,
      0,
      "Aucune préoccupation dominante identifiable.",
      [],
      ["Daily Brief indisponible.", "Peu de signaux de charge."],
    );
  },
};
