/**
 * EPIC2-A — Simple goal progress from linked tasks.
 */

import type { TaskRecord } from "../../types";
import type { GoalProgress, GoalProgressSummary, UserGoal } from "../../types/goal";

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_TASK_MINUTES = 30;

function isTaskCompleted(task: TaskRecord): boolean {
  return task.status === "done";
}

function isTaskActive(task: TaskRecord): boolean {
  return task.status !== "done" && task.status !== "cancelled";
}

function resolveLastProgressDate(
  taskIds: readonly string[],
  tasksById: Map<string, TaskRecord>,
): Date | null {
  let latest: Date | null = null;

  for (const taskId of taskIds) {
    const task = tasksById.get(taskId);
    if (!task || !isTaskCompleted(task)) continue;

    const candidate = task.last_completed_at
      ? new Date(task.last_completed_at)
      : task.updated_at
        ? new Date(task.updated_at)
        : null;

    if (candidate && (!latest || candidate.getTime() > latest.getTime())) {
      latest = candidate;
    }
  }

  return latest;
}

function isStepComplete(
  step: UserGoal["steps"][number],
  tasksById: Map<string, TaskRecord>,
): boolean {
  if (step.taskIds.length === 0) return false;

  return step.taskIds.every((taskId) => {
    const task = tasksById.get(taskId);
    return Boolean(task && isTaskCompleted(task));
  });
}

function countRemainingMinutes(
  taskIds: readonly string[],
  tasksById: Map<string, TaskRecord>,
): number {
  let total = 0;

  for (const taskId of taskIds) {
    const task = tasksById.get(taskId);
    if (!task || !isTaskActive(task)) continue;
    total += task.estimated_minutes ?? DEFAULT_TASK_MINUTES;
  }

  return total;
}

export function computeGoalProgress(
  goal: UserGoal,
  tasks: readonly TaskRecord[],
  now: Date = new Date(),
): GoalProgress {
  const tasksById = new Map(tasks.map((task) => [task.id, task]));
  const linkedTaskIds = goal.steps.flatMap((step) => step.taskIds);
  const uniqueTaskIds = [...new Set(linkedTaskIds)];

  let completedTasks = 0;
  for (const taskId of uniqueTaskIds) {
    const task = tasksById.get(taskId);
    if (task && isTaskCompleted(task)) {
      completedTasks += 1;
    }
  }

  const totalTasks = uniqueTaskIds.length;
  const percent =
    totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const lastProgress = resolveLastProgressDate(uniqueTaskIds, tasksById);
  const daysSinceLastProgress =
    lastProgress === null
      ? null
      : Math.floor((now.getTime() - lastProgress.getTime()) / DAY_MS);

  return {
    goalId: goal.id,
    completedTasks,
    totalTasks,
    percent,
    daysSinceLastProgress,
  };
}

export function computeGoalProgressSummary(
  goal: UserGoal,
  tasks: readonly TaskRecord[],
  now: Date = new Date(),
): GoalProgressSummary {
  const base = computeGoalProgress(goal, tasks, now);
  const tasksById = new Map(tasks.map((task) => [task.id, task]));
  const sortedSteps = [...goal.steps].sort((a, b) => a.order - b.order);
  const linkedTaskIds = goal.steps.flatMap((step) => step.taskIds);
  const uniqueTaskIds = [...new Set(linkedTaskIds)];

  const remainingTasks = base.totalTasks - base.completedTasks;
  const remainingSteps = sortedSteps.filter(
    (step) => !isStepComplete(step, tasksById),
  ).length;
  const remainingMinutes = countRemainingMinutes(uniqueTaskIds, tasksById);

  return {
    ...base,
    remainingTasks,
    remainingSteps,
    remainingMinutes,
  };
}

export function computeGoalsProgress(
  goals: UserGoal[],
  tasks: readonly TaskRecord[],
  now?: Date,
): GoalProgress[] {
  return goals.map((goal) => computeGoalProgress(goal, tasks, now));
}
