/**
 * EPIC2-A — Goal copy for Daily Brief (neutral tone, no guilt).
 */

import type { TaskRecord } from "../../types";
import type { UserGoal } from "../../types/goal";
import { computeGoalProgress } from "./computeGoalProgress";
import { pickPrimaryGoal } from "./pickPrimaryGoal";

const STALE_PROGRESS_DAYS = 5;

export function buildGoalBriefInsight(
  goals: UserGoal[],
  tasks: TaskRecord[],
  now: Date = new Date(),
): string | null {
  const goal = pickPrimaryGoal(goals);
  if (!goal) return null;

  const progress = computeGoalProgress(goal, tasks, now);

  if (progress.totalTasks === 0) {
    return `Tu travailles sur « ${goal.name} ». Ajoute des tâches à tes étapes pour suivre ta progression.`;
  }

  if (
    progress.completedTasks > 0 &&
    progress.daysSinceLastProgress !== null &&
    progress.daysSinceLastProgress <= 2
  ) {
    return `Tu avances vers ton objectif « ${goal.name} ».`;
  }

  if (
    progress.completedTasks > 0 &&
    progress.daysSinceLastProgress !== null &&
    progress.daysSinceLastProgress >= STALE_PROGRESS_DAYS
  ) {
    return `Aucune progression n'a été enregistrée depuis ${progress.daysSinceLastProgress} jours sur « ${goal.name} ».`;
  }

  if (progress.completedTasks > 0 && progress.percent < 100) {
    return `Tu avances vers ton objectif « ${goal.name} » (${progress.completedTasks}/${progress.totalTasks} tâches).`;
  }

  if (progress.percent === 100) {
    return `Tu as terminé toutes les tâches liées à « ${goal.name} ».`;
  }

  return null;
}
