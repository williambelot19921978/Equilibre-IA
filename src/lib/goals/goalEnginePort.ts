/**
 * EPIC2-B — Goal contract bridge (no new motor).
 * Maps UserGoal[] → GoalWeights per IGoalEngine.computeWeights shape.
 */

import type { GoalWeights } from "../../ai/contracts/engines/shared-domain";
import type { TaskRecord } from "../../types";
import type { UserGoal } from "../../types/goal";
import { computeGoalProgressSummary } from "./computeGoalProgress";

const IMPORTANCE_WEIGHT = { high: 1, medium: 0.65, low: 0.35 } as const;

export function computeGoalWeightsFromUserGoals(
  goals: readonly UserGoal[],
  tasks: readonly TaskRecord[],
): GoalWeights {
  const weights: Record<string, number> = {};

  for (const goal of goals) {
    const progress = computeGoalProgressSummary(goal, tasks);
    const urgency =
      progress.percent >= 100
        ? 0.1
        : progress.daysSinceLastProgress != null &&
            progress.daysSinceLastProgress >= 5
          ? 1.2
          : 1;
    weights[goal.id] =
      IMPORTANCE_WEIGHT[goal.importance] * urgency * (1 - progress.percent / 100);
  }

  return { weights };
}
