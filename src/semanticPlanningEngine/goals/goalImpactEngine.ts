/**
 * EPIC 5C — Goal Impact Engine.
 */

import type { CalendarItem } from "../../planningCalendarEngine/types/calendarItem";
import type { ClassificationResult } from "../classification/classificationEngine";
import type { GoalImpactLink } from "../types/semanticTypes";

export type GoalSnapshot = {
  readonly id: string;
  readonly name: string;
};

const GOAL_KEYWORDS: readonly { pattern: RegExp; keywords: readonly string[] }[] = [
  { pattern: /marathon|course|running|sport/i, keywords: ["sport", "course", "marathon", "running"] },
  { pattern: /santé|health|forme/i, keywords: ["santé", "health", "forme", "nutrition"] },
  { pattern: /étude|diplôme|examen/i, keywords: ["étude", "diplôme", "examen", "cours"] },
  { pattern: /famille|family/i, keywords: ["famille", "family", "enfant"] },
];

function matchesGoal(goalName: string, keywords: readonly string[]): boolean {
  const normalized = goalName.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword.toLowerCase()));
}

function scoreLink(
  item: CalendarItem,
  classification: ClassificationResult,
  goal: GoalSnapshot,
): GoalImpactLink | null {
  for (const mapping of GOAL_KEYWORDS) {
    if (!mapping.pattern.test(goal.name)) continue;
    if (!matchesGoal(goal.name, mapping.keywords)) continue;

    const titleMatch = mapping.keywords.some((keyword) =>
      item.title.toLowerCase().includes(keyword.toLowerCase()),
    );
    const categoryMatch =
      (classification.category === "sport" && /sport|marathon/i.test(goal.name)) ||
      (classification.category === "sante" && /santé|health/i.test(goal.name)) ||
      (classification.category === "etudes" && /étude|examen/i.test(goal.name)) ||
      (classification.category === "famille" && /famille/i.test(goal.name));

    if (!titleMatch && !categoryMatch) continue;

    return {
      goalId: goal.id,
      goalName: goal.name,
      impactScore: categoryMatch ? 0.85 : 0.65,
      reason: `« ${item.title} » contribue à l'objectif « ${goal.name} ».`,
    };
  }
  return null;
}

export function computeGoalImpacts(
  item: CalendarItem,
  classification: ClassificationResult,
  goals: readonly GoalSnapshot[],
): GoalImpactLink[] {
  const links: GoalImpactLink[] = [];
  for (const goal of goals) {
    const link = scoreLink(item, classification, goal);
    if (link) links.push(link);
  }
  return links;
}
