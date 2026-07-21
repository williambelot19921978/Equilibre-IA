/**
 * EPIC 6C — Daily State test fixtures.
 */

import type { DailyState, DailyStateInput } from "../types/dailyStateTypes";

export const TEST_USER = "daily-state-test-user";
export const TEST_DATE = "2026-07-20";

export function sampleStateInput(
  overrides: Partial<DailyStateInput> = {},
): DailyStateInput {
  return {
    userId: TEST_USER,
    date: TEST_DATE,
    mood: "good",
    energy: 7,
    stress: 4,
    sleepQuality: 4,
    specialDay: "normal",
    ...overrides,
  };
}

export function sampleState(overrides: Partial<DailyState> = {}): DailyState {
  return {
    date: TEST_DATE,
    mood: "good",
    energy: 7,
    stress: 4,
    sleepQuality: 4,
    specialDay: "normal",
    confidence: 0.85,
    source: "checkin",
    createdAt: "2026-07-20T08:00:00.000Z",
    updatedAt: "2026-07-20T08:00:00.000Z",
    ...overrides,
  };
}

export function tiredStateInput(): DailyStateInput {
  return sampleStateInput({ mood: "very_tired", energy: 2, stress: 7, sleepQuality: 2 });
}

export function excellentSleepHistory(): DailyState[] {
  return Array.from({ length: 10 }, (_, index) =>
    sampleState({
      date: `2026-07-${String(10 + index).padStart(2, "0")}`,
      sleepQuality: 5,
    }),
  );
}
