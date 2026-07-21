/**
 * EPIC2-B — Resolve a single next best action for one goal (deterministic).
 */

import type { TaskRecord } from "../../types";
import type { GoalNextAction, GoalStep, UserGoal } from "../../types/goal";
import { computeGoalWeightsFromUserGoals } from "./goalEnginePort";

const DEFAULT_TASK_MINUTES = 30;

function isTaskActive(task: TaskRecord): boolean {
  return task.status !== "done" && task.status !== "cancelled";
}

function isStepComplete(
  step: GoalStep,
  tasksById: Map<string, TaskRecord>,
): boolean {
  if (step.taskIds.length === 0) return false;

  return step.taskIds.every((taskId) => {
    const task = tasksById.get(taskId);
    return task?.status === "done";
  });
}

function emptyAction(
  goal: UserGoal,
  status: GoalNextAction["status"],
): GoalNextAction {
  return {
    status,
    goalId: goal.id,
    goalName: goal.name,
    stepId: null,
    stepTitle: null,
    taskId: null,
    taskTitle: null,
    estimatedMinutes: null,
  };
}

function readyAction(
  goal: UserGoal,
  step: GoalStep,
  task: TaskRecord,
): GoalNextAction {
  return {
    status: "ready",
    goalId: goal.id,
    goalName: goal.name,
    stepId: step.id,
    stepTitle: step.title,
    taskId: task.id,
    taskTitle: task.title,
    estimatedMinutes: task.estimated_minutes ?? DEFAULT_TASK_MINUTES,
  };
}

export function resolveGoalNextAction(
  goal: UserGoal,
  tasks: TaskRecord[],
): GoalNextAction {
  const sortedSteps = [...goal.steps].sort((a, b) => a.order - b.order);

  if (sortedSteps.length === 0) {
    return emptyAction(goal, "empty");
  }

  const tasksById = new Map(tasks.map((task) => [task.id, task]));
  const linkedTaskIds = sortedSteps.flatMap((step) => step.taskIds);

  if (linkedTaskIds.length === 0) {
    return {
      ...emptyAction(goal, "no_tasks"),
      stepId: sortedSteps[0].id,
      stepTitle: sortedSteps[0].title,
    };
  }

  const allDone = linkedTaskIds.every((taskId) => {
    const task = tasksById.get(taskId);
    return task?.status === "done";
  });

  if (allDone) {
    return emptyAction(goal, "completed");
  }

  for (const step of sortedSteps) {
    if (step.taskIds.length === 0) continue;

    for (const taskId of step.taskIds) {
      const task = tasksById.get(taskId);
      if (!task || !isTaskActive(task)) continue;

      return readyAction(goal, step, task);
    }

    if (!isStepComplete(step, tasksById)) {
      break;
    }
  }

  const firstIncompleteStep = sortedSteps.find(
    (step) => step.taskIds.length === 0 || !isStepComplete(step, tasksById),
  );

  if (firstIncompleteStep && firstIncompleteStep.taskIds.length === 0) {
    return {
      ...emptyAction(goal, "no_tasks"),
      stepId: firstIncompleteStep.id,
      stepTitle: firstIncompleteStep.title,
    };
  }

  return emptyAction(goal, "completed");
}

export function resolvePrimaryGoalNextAction(
  goals: readonly UserGoal[],
  tasks: TaskRecord[],
): GoalNextAction | null {
  if (goals.length === 0) return null;

  const goalWeights = computeGoalWeightsFromUserGoals(goals, tasks);
  const rankedGoals = [...goals].sort((a, b) => {
    const weightDiff =
      (goalWeights.weights[b.id] ?? 0) - (goalWeights.weights[a.id] ?? 0);
    if (weightDiff !== 0) return weightDiff;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  for (const goal of rankedGoals) {
    const action = resolveGoalNextAction(goal, tasks);
    if (action.status === "ready" || action.status === "no_tasks") {
      return action;
    }
    if (action.status === "empty") {
      return action;
    }
  }

  const fallback = rankedGoals[0];
  return fallback ? resolveGoalNextAction(fallback, tasks) : null;
}
