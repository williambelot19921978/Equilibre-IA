/**
 * EPIC 6D — Personal Coach test fixtures.
 */

import type { PersonalCoachInput } from "../types/personalCoachTypes";

export const TEST_USER = "personal-coach-test";
export const TEST_DATE = "2026-07-20";
export const WEEKEND_DATE = "2026-07-19";

export function baseCoachInput(overrides: Partial<PersonalCoachInput> = {}): PersonalCoachInput {
  return {
    userId: TEST_USER,
    date: TEST_DATE,
    now: `${TEST_DATE}T10:00:00.000Z`,
    firstName: "William",
    dailyEnergy: 6,
    dailyStress: 4,
    mentalLoad: 45,
    balanceScore: 60,
    freeMinutes: 90,
    taskTodoCount: 3,
    activeGoals: [{ id: "goal-1", name: "Révision examen" }],
    validatedHabits: ["Marche matinale"],
    ...overrides,
  };
}

export function tiredCoachInput(): PersonalCoachInput {
  return baseCoachInput({
    dailyEnergy: 2,
    dailyStress: 8,
    dailyMood: "very_tired",
    mentalLoad: 80,
    trendEnergy7d: 3.5,
  });
}

export function energeticCoachInput(): PersonalCoachInput {
  return baseCoachInput({
    dailyEnergy: 9,
    freeMinutes: 120,
    mentalLoad: 30,
  });
}
