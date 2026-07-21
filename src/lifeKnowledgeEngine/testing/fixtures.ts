/**
 * EPIC 6E — Life Knowledge test fixtures.
 */

import type { LifeKnowledgeInput } from "../types/lifeKnowledgeTypes";

export const TEST_USER = "life-knowledge-test";
export const TEST_DATE = "2026-07-20";

export function baseKnowledgeInput(overrides: Partial<LifeKnowledgeInput> = {}): LifeKnowledgeInput {
  return {
    userId: TEST_USER,
    date: TEST_DATE,
    now: `${TEST_DATE}T10:00:00.000Z`,
    profileFacts: [
      { fact_key: "wake_time", fact_value: { value: "07:00" } },
      { fact_key: "preferred_morning", fact_value: { value: "oui" } },
    ],
    livingInsights: [
      {
        id: "insight-run",
        category: "sport",
        label: "Course matinale",
        detail: "Tu cours généralement le matin",
        confidence: 0.92,
        status: "learned",
      },
    ],
    validatedPreferences: [
      {
        id: "pref-1",
        label: "Créneau préféré",
        proposedValue: "Matin",
        confidence: 0.95,
      },
    ],
    activeGoals: [{ id: "goal-1", name: "Préparer examen" }],
    childrenCount: 2,
    ...overrides,
  };
}
