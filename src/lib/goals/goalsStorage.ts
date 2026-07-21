/**
 * EPIC2-A — Goals persistence (local MVP, per user).
 */

import type { GoalStep, UserGoal } from "../../types/goal";

const STORAGE_PREFIX = "epic2-goals";

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}:${userId}`;
}

function readGoals(userId: string): UserGoal[] {
  if (typeof localStorage === "undefined") return [];

  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as UserGoal[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeGoals(userId: string, goals: UserGoal[]): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(storageKey(userId), JSON.stringify(goals));
}

export function listGoals(userId: string): UserGoal[] {
  return readGoals(userId).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function getGoal(userId: string, goalId: string): UserGoal | null {
  return readGoals(userId).find((goal) => goal.id === goalId) ?? null;
}

export function saveGoal(userId: string, goal: UserGoal): UserGoal {
  const goals = readGoals(userId);
  const index = goals.findIndex((item) => item.id === goal.id);
  const next = [...goals];

  if (index >= 0) {
    next[index] = goal;
  } else {
    next.push(goal);
  }

  writeGoals(userId, next);
  return goal;
}

export function deleteGoal(userId: string, goalId: string): boolean {
  const goals = readGoals(userId);
  const next = goals.filter((goal) => goal.id !== goalId);
  if (next.length === goals.length) return false;
  writeGoals(userId, next);
  return true;
}

export function clearGoalsForTests(): void {
  if (typeof localStorage === "undefined") return;

  const keys: string[] = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key?.startsWith(`${STORAGE_PREFIX}:`)) keys.push(key);
  }

  for (const key of keys) {
    localStorage.removeItem(key);
  }
}

export function createGoalId(): string {
  return `goal-${crypto.randomUUID()}`;
}

export function createStepId(): string {
  return `step-${crypto.randomUUID()}`;
}

export function normalizeSteps(steps: GoalStep[]): GoalStep[] {
  return [...steps]
    .sort((a, b) => a.order - b.order)
    .map((step, index) => ({ ...step, order: index }));
}
