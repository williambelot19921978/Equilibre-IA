/** EPIC 4B certification — shared rule test utilities. */

import { expect } from "vitest";

import type { DailyCheckinRecord } from "../../../types/dailyCheckin";
import type { HumanModelRule, HumanModelRuleInput, RuleOutput } from "../types/ruleTypes";

export function baseRuleInput(
  overrides: Partial<HumanModelRuleInput> = {},
): HumanModelRuleInput {
  return {
    userId: "user-1",
    firstName: "William",
    date: "2026-07-20",
    dailyCheckin: null,
    blockCount: 0,
    hasLoadedPlan: false,
    taskTodoCount: 0,
    taskTotalCount: 0,
    topTaskTitles: [],
    childrenCount: 0,
    memberCount: 1,
    goals: [],
    goalsEnabled: true,
    activeGoalCount: 0,
    dailyBrief: null,
    profile: null,
    knownFactsCount: 0,
    gaps: [],
    sources: [],
    timelineEventCount: 0,
    freeMinutesToday: 0,
    conflictCount: 0,
    semanticEnabled: false,
    semanticMentalLoad: 0,
    semanticBalanceScore: 50,
    semanticBalanceSignals: [],
    adaptiveEnabled: false,
    validatedPreferenceCount: 0,
    validatedPreferenceLabels: [],
    learningConfidence: 0,
    proactiveEnabled: false,
    proactiveBehaviorMetrics: null,
    dailyStateEnabled: false,
    dailyStateToday: null,
    ...overrides,
  };
}

export function makeCheckin(
  mood: DailyCheckinRecord["mood"],
  overrides: Partial<DailyCheckinRecord> = {},
): DailyCheckinRecord {
  return {
    id: "checkin-1",
    user_id: "user-1",
    household_id: "hh-1",
    checkin_date: "2026-07-20",
    energy_level: null,
    fatigue_level: null,
    stress_level: null,
    mood,
    intensity: 3,
    note: null,
    created_at: "2026-07-20T08:00:00.000Z",
    updated_at: "2026-07-20T08:00:00.000Z",
    ...overrides,
  };
}

export function assertValidRuleOutput(result: RuleOutput<unknown>): void {
  expect(result.confidence).toBeGreaterThanOrEqual(0);
  expect(result.confidence).toBeLessThanOrEqual(1);
  expect(Number.isNaN(result.confidence)).toBe(false);
  expect(typeof result.explanation).toBe("string");
  expect(result.explanation.trim().length).toBeGreaterThan(0);
  expect(Array.isArray(result.reasons)).toBe(true);
  expect(Array.isArray(result.missingData)).toBe(true);

  if (result.value !== null && typeof result.value === "number") {
    expect(Number.isNaN(result.value)).toBe(false);
  }
}

export function assertDeterministicRule<T>(
  rule: HumanModelRule<T>,
  input: HumanModelRuleInput,
  runs = 5,
): RuleOutput<T> {
  const first = rule.evaluate(input);
  for (let index = 0; index < runs; index += 1) {
    expect(rule.evaluate(input)).toEqual(first);
  }
  return first;
}
