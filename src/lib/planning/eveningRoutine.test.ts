import { describe, expect, it } from "vitest";

import { computeEveningRoutineWindow } from "./eveningRoutine";
import type { ChildRecord } from "../../types";
import type { ChildRoutineRecord } from "../../types/childRoutine";

const children: ChildRecord[] = [
  {
    id: "oliver",
    household_id: "household-1",
    first_name: "Oliver",
    birth_date: null,
  },
  {
    id: "peter",
    household_id: "household-1",
    first_name: "Peter",
    birth_date: null,
  },
];

describe("eveningRoutine", () => {
  it("E — couchers 19:45 et 20:30 avec routine 60 min → 18:45–20:30", () => {
    const childRoutines: ChildRoutineRecord[] = [
      {
        id: "r1",
        child_id: "oliver",
        household_id: "household-1",
        bedtime_weekday: "20:30",
        bedtime_weekend: null,
        evening_routine_minutes: 60,
        wake_time: null,
        school_days: null,
        created_at: "",
        updated_at: "",
      },
      {
        id: "r2",
        child_id: "peter",
        household_id: "household-1",
        bedtime_weekday: "19:45",
        bedtime_weekend: null,
        evening_routine_minutes: 60,
        wake_time: null,
        school_days: null,
        created_at: "",
        updated_at: "",
      },
    ];

    const window = computeEveningRoutineWindow({
      date: "2026-07-13",
      children,
      childRoutines,
      householdSettings: {
        eveningRoutineStart: null,
        eveningRoutineManager: null,
        averageEveningRoutineMinutes: 60,
      },
    });

    expect(window.incomplete).toBe(false);
    expect(window.startTime).toBe("18:45");
    expect(window.endTime).toBe("20:30");
  });

  it("F — deux enfants avec horaires différents", () => {
    const childRoutines: ChildRoutineRecord[] = [
      {
        id: "r1",
        child_id: "oliver",
        household_id: "household-1",
        bedtime_weekday: "21:00",
        bedtime_weekend: null,
        evening_routine_minutes: 30,
        wake_time: null,
        school_days: null,
        created_at: "",
        updated_at: "",
      },
      {
        id: "r2",
        child_id: "peter",
        household_id: "household-1",
        bedtime_weekday: "19:30",
        bedtime_weekend: null,
        evening_routine_minutes: 45,
        wake_time: null,
        school_days: null,
        created_at: "",
        updated_at: "",
      },
    ];

    const window = computeEveningRoutineWindow({
      date: "2026-07-13",
      children,
      childRoutines,
      householdSettings: {
        eveningRoutineStart: null,
        eveningRoutineManager: null,
        averageEveningRoutineMinutes: null,
      },
    });

    expect(window.incomplete).toBe(false);
    expect(window.startTime).toBe("18:52");
    expect(window.endTime).toBe("21:00");
  });

  it("G — données de coucher absentes", () => {
    const window = computeEveningRoutineWindow({
      date: "2026-07-13",
      children,
      childRoutines: [],
      householdSettings: {
        eveningRoutineStart: null,
        eveningRoutineManager: null,
        averageEveningRoutineMinutes: 60,
      },
    });

    expect(window.incomplete).toBe(true);
    expect(window.startTime).toBeNull();
    expect(window.message).toContain("Mon quotidien");
  });
});
