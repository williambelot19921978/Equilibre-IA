/**
 * EPIC2-B — Attach goal context to Daily Brief recommendations (informative only).
 */

import type { DailyBriefRecommendation } from "../dailyBrief/buildDailyBriefRecommendations";
import type { TaskRecord } from "../../types";
import type { GoalNextAction, UserGoal } from "../../types/goal";
import {
  resolveGoalAssociationForStudyTasks,
  resolveGoalAssociationForTask,
} from "./resolveGoalAssociation";

export function enrichRecommendationsWithGoalContext(
  recommendations: DailyBriefRecommendation[],
  goals: readonly UserGoal[],
  tasks: readonly TaskRecord[],
  nextAction: GoalNextAction | null,
): DailyBriefRecommendation[] {
  if (goals.length === 0) return recommendations;

  const studyAssociation = resolveGoalAssociationForStudyTasks(goals, tasks);

  return recommendations.map((recommendation) => {
    if (recommendation.associatedGoalName) {
      return recommendation;
    }

    if (
      recommendation.kind === "study" &&
      nextAction?.status === "ready" &&
      nextAction.taskId
    ) {
      const directAssociation = resolveGoalAssociationForTask(
        nextAction.taskId,
        goals,
      );

      if (directAssociation) {
        return {
          ...recommendation,
          associatedGoalName: directAssociation.goalName,
          associatedStepTitle: directAssociation.stepTitle,
        };
      }
    }

    if (recommendation.kind === "study" && studyAssociation) {
      return {
        ...recommendation,
        associatedGoalName: studyAssociation.goalName,
        associatedStepTitle: studyAssociation.stepTitle,
      };
    }

    return recommendation;
  });
}
