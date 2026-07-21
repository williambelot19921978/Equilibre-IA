/**
 * EPIC 5C — Daily Brief semantic hints.
 */

import type { SemanticInsight, SemanticBriefHint } from "../types/semanticTypes";
import type { SemanticCalendarItem } from "../types/semanticCalendarItem";
import { buildExplainability } from "../explain/explainability";

export type SemanticBriefInput = {
  readonly insights: readonly SemanticInsight[];
  readonly items: readonly SemanticCalendarItem[];
  readonly freeMinutes: number;
  readonly mentalLoad: number;
};

export function buildSemanticBriefHints(input: SemanticBriefInput): SemanticBriefHint[] {
  const hints: SemanticBriefHint[] = [];

  for (const insight of input.insights.slice(0, 3)) {
    hints.push({
      id: `brief-${insight.id}`,
      message: insight.message,
      priority: insight.category === "equilibre" ? 1 : 2,
      explainability: insight.explainability,
    });
  }

  const sportGoal = input.items.find(
    (item) => item.category === "sport" && item.goalLinks.length > 0,
  );
  if (sportGoal) {
    hints.push({
      id: "brief-goal-sport",
      message: `Tu peux avancer ton objectif ${sportGoal.goalLinks[0]?.goalName ?? "Sport"}.`,
      priority: 2,
      explainability: buildExplainability({
        why: "Événement sport lié à un objectif actif.",
        dataUsed: [sportGoal.title, sportGoal.goalLinks[0]?.goalName ?? ""],
        calculation: "goalImpactEngine → goalLinks.length > 0",
        confidenceLevel: 0.75,
      }),
    });
  }

  if (input.mentalLoad >= 65) {
    hints.push({
      id: "brief-energy-warning",
      message: "Attention à ton énergie — journée exigeante.",
      priority: 1,
      explainability: buildExplainability({
        why: "Charge mentale sémantique élevée.",
        dataUsed: [`charge mentale ${input.mentalLoad}`],
        calculation: "mentalLoadFromSemantic >= 65",
        confidenceLevel: 0.8,
      }),
    });
  }

  return hints.sort((left, right) => left.priority - right.priority);
}
