/**
 * EPIC2-A — Goals service (local MVP, links to existing tasks).
 */

import type {
  CreateGoalInput,
  GoalStep,
  UpdateGoalInput,
  UserGoal,
} from "../types/goal";
import {
  createGoalId,
  createStepId,
  deleteGoal as deleteStoredGoal,
  getGoal,
  listGoals,
  normalizeSteps,
  saveGoal,
} from "../lib/goals/goalsStorage";
import { trackInsightEvent } from "../auraInsights/eventStore";

function nowIso(): string {
  return new Date().toISOString();
}

export function getUserGoals(userId: string): UserGoal[] {
  return listGoals(userId);
}

export function getUserGoal(userId: string, goalId: string): UserGoal | null {
  return getGoal(userId, goalId);
}

export function createUserGoal(
  userId: string,
  input: CreateGoalInput,
): UserGoal {
  const timestamp = nowIso();
  const goal: UserGoal = {
    id: createGoalId(),
    name: input.name.trim(),
    category: input.category,
    targetDate: input.targetDate ?? null,
    importance: input.importance,
    estimatedMinutes: input.estimatedMinutes ?? null,
    steps: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const saved = saveGoal(userId, goal);
  trackInsightEvent(userId, "goal_created", { domain: "goals" });
  return saved;
}

export function updateUserGoal(
  userId: string,
  goalId: string,
  input: UpdateGoalInput,
): UserGoal | null {
  const existing = getGoal(userId, goalId);
  if (!existing) return null;

  const goal: UserGoal = {
    ...existing,
    name: input.name?.trim() ?? existing.name,
    category: input.category ?? existing.category,
    targetDate:
      input.targetDate === undefined ? existing.targetDate : input.targetDate,
    importance: input.importance ?? existing.importance,
    estimatedMinutes:
      input.estimatedMinutes === undefined
        ? existing.estimatedMinutes
        : input.estimatedMinutes,
    steps: input.steps ? normalizeSteps(input.steps) : existing.steps,
    updatedAt: nowIso(),
  };

  return saveGoal(userId, goal);
}

export function deleteUserGoal(userId: string, goalId: string): boolean {
  return deleteStoredGoal(userId, goalId);
}

export function addGoalStep(
  userId: string,
  goalId: string,
  title: string,
): UserGoal | null {
  const existing = getGoal(userId, goalId);
  if (!existing) return null;

  const step: GoalStep = {
    id: createStepId(),
    title: title.trim(),
    order: existing.steps.length,
    taskIds: [],
  };

  return updateUserGoal(userId, goalId, {
    steps: [...existing.steps, step],
  });
}

export function updateGoalStep(
  userId: string,
  goalId: string,
  stepId: string,
  patch: { title?: string; taskIds?: string[] },
): UserGoal | null {
  const existing = getGoal(userId, goalId);
  if (!existing) return null;

  const steps = existing.steps.map((step) => {
    if (step.id !== stepId) return step;
    return {
      ...step,
      title: patch.title?.trim() ?? step.title,
      taskIds: patch.taskIds ?? step.taskIds,
    };
  });

  return updateUserGoal(userId, goalId, { steps });
}

export function removeGoalStep(
  userId: string,
  goalId: string,
  stepId: string,
): UserGoal | null {
  const existing = getGoal(userId, goalId);
  if (!existing) return null;

  return updateUserGoal(userId, goalId, {
    steps: existing.steps.filter((step) => step.id !== stepId),
  });
}
