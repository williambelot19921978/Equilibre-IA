/**
 * EPIC2-B — Enriched Daily Brief goal insight (positive tone).
 */

import type { TaskRecord } from "../../types";
import type { UserGoal } from "../../types/goal";
import { computeGoalProgressSummary } from "./computeGoalProgress";
import { pickPrimaryGoal } from "./pickPrimaryGoal";
import { resolveGoalNextAction } from "./resolveGoalNextAction";

const STALE_PROGRESS_DAYS = 5;

export function buildGoalProgressInsight(
  goals: UserGoal[],
  tasks: TaskRecord[],
  now: Date = new Date(),
): string | null {
  const goal = pickPrimaryGoal(goals);
  if (!goal) return null;

  const progress = computeGoalProgressSummary(goal, tasks, now);
  const nextAction = resolveGoalNextAction(goal, tasks);

  if (nextAction.status === "completed" || progress.percent === 100) {
    return `📈 Tu as terminé toutes les tâches liées à « ${goal.name} ».`;
  }

  if (nextAction.status === "empty") {
    return `🎯 Commence par ajouter des étapes à « ${goal.name} » pour avancer sereinement.`;
  }

  if (nextAction.status === "no_tasks") {
    return `🎯 Lie des tâches à « ${nextAction.stepTitle ?? "ton étape"} » pour suivre ta progression sur « ${goal.name} ».`;
  }

  if (
    progress.daysSinceLastProgress !== null &&
    progress.daysSinceLastProgress >= STALE_PROGRESS_DAYS
  ) {
    return `⚠ Ton objectif « ${goal.name} » n'a pas avancé depuis plusieurs jours — une petite action suffit pour relancer.`;
  }

  if (
    progress.completedTasks > 0 &&
    progress.daysSinceLastProgress !== null &&
    progress.daysSinceLastProgress <= 2
  ) {
    return `📈 Tu avances régulièrement vers ton objectif « ${goal.name} ».`;
  }

  if (progress.remainingSteps === 1 && progress.percent < 100) {
    return `🎯 Plus qu'une étape avant le module suivant sur « ${goal.name} ».`;
  }

  if (nextAction.status === "ready" && nextAction.taskTitle) {
    return `🎯 Prochaine action : « ${nextAction.taskTitle} » (${nextAction.estimatedMinutes ?? 30} min).`;
  }

  if (progress.remainingTasks > 0) {
    return `📈 Tu avances vers « ${goal.name} » — ${progress.remainingTasks} tâche${progress.remainingTasks > 1 ? "s" : ""} restante${progress.remainingTasks > 1 ? "s" : ""}.`;
  }

  return null;
}
