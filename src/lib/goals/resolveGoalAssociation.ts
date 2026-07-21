/**
 * EPIC2-B — Resolve goal/step association for a linked task.
 */

import type { TaskRecord } from "../../types";
import type { GoalAssociation, UserGoal } from "../../types/goal";

export function resolveGoalAssociationForTask(
  taskId: string,
  goals: readonly UserGoal[],
): GoalAssociation | null {
  for (const goal of goals) {
    for (const step of goal.steps) {
      if (step.taskIds.includes(taskId)) {
        return {
          goalId: goal.id,
          goalName: goal.name,
          stepTitle: step.title,
        };
      }
    }
  }

  return null;
}

export function resolveGoalAssociationForStudyTasks(
  goals: readonly UserGoal[],
  tasks: readonly TaskRecord[],
): GoalAssociation | null {
  const tasksById = new Map(tasks.map((task) => [task.id, task]));

  for (const goal of goals) {
    for (const step of goal.steps) {
      for (const taskId of step.taskIds) {
        const task = tasksById.get(taskId);
        if (
          task &&
          task.status !== "done" &&
          task.status !== "cancelled" &&
          (task.category === "studies" || goal.category === "studies")
        ) {
          return {
            goalId: goal.id,
            goalName: goal.name,
            stepTitle: step.title,
          };
        }
      }
    }
  }

  return null;
}
