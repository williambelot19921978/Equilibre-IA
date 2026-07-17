import { describe, expect, it } from "vitest";

import { generateDayPlan } from "../../ai/planningEngine";
import type { PlanningContext } from "../../ai/memoryEngine";
import { combineDateAndTime } from "../time/daySchedule";
import type { CalendarItemRecord, TaskRecord } from "../../types";

function makeFamilyContext() {
  return {
    activePeriods: [],
    disableWork: false,
    disableSchoolDeparture: false,
    maxFillRatio: 0.8,
    soloParentWithChildren: false,
    childSick: false,
    onlyMicroTasks: false,
    childrenVacation: false,
    userVacation: false,
    unavailableUserIds: [],
    adaptations: [],
    warnings: [],
  };
}

const baseContext: PlanningContext = {
  householdId: "household-1",
  children: [],
  childrenCount: 0,
  wakeTime: "07:00",
  bedTime: "22:00",
  workStart: "09:00",
  workEnd: "17:00",
  mainPriority: "work",
  onboardingCompleted: true,
  profile: {
    morningDurationMinutes: undefined,
    childrenDepartureTime: undefined,
    eveningRoutine: [],
    workDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    commuteMinutes: 0,
    afterWorkEnergy: "medium",
    studiesActive: false,
    studyWeeklyHours: undefined,
    studyBestPeriod: undefined,
    procrastinationCauses: [],
    preferredFocusMinutes: 25,
    sleepNeededHours: 8,
    sleepProblems: [],
    sportInterests: [],
    sportMinimumMinutes: 15,
    sportMusic: [],
    restPreferences: [],
    faithImportance: "disabled",
    faithContent: [],
  },
  childRoutines: [],
  householdEvening: {
    eveningRoutineStart: null,
    eveningRoutineManager: null,
    averageEveningRoutineMinutes: null,
  },
  familyContext: makeFamilyContext(),
  familyContextPeriods: [],
  targetDate: "2026-07-14",
  currentUserId: "user-1",
};

function makeManualItem(): CalendarItemRecord {
  return {
    id: "manual-1",
    household_id: "household-1",
    user_id: "user-1",
    task_id: null,
    title: "Médecin",
    item_type: "event",
    starts_at: combineDateAndTime("2026-07-14", "14:00"),
    ends_at: combineDateAndTime("2026-07-14", "15:00"),
    locked: true,
    source: "user",
    details: { constraintType: "appointment", status: "accepted" },
    created_at: "2026-07-13T10:00:00.000Z",
    updated_at: "2026-07-13T10:00:00.000Z",
  };
}

function makeTask(overrides: Partial<TaskRecord> = {}): TaskRecord {
  return {
    id: "task-1",
    household_id: "household-1",
    created_by: "user-1",
    assigned_to: null,
    title: "Réviser",
    description: null,
    category: "studies",
    priority: 8,
    status: "todo",
    estimated_minutes: 25,
    due_at: null,
    splittable: true,
    skip_count: 0,
    created_at: "2026-07-13T09:00:00.000Z",
    ...overrides,
  };
}

describe("generateDayPlan with manual calendar items", () => {
  it("generates tasks around a valid manual appointment", () => {
    const result = generateDayPlan({
      date: "2026-07-14",
      context: baseContext,
      tasks: [makeTask()],
      existingItems: [makeManualItem()],
    });

    expect(result.plan.totalFreeMinutes).toBeGreaterThan(0);
    expect(
      result.plan.blocks.some((block) => block.title.includes("Médecin")),
    ).toBe(true);
    expect(
      result.plan.blocks.some((block) => block.blockType === "task"),
    ).toBe(true);
    expect(result.plan.ignoredCalendarItems).toEqual([]);
  });

  it("ignores invalid manual items without crashing", () => {
    const result = generateDayPlan({
      date: "2026-07-14",
      context: baseContext,
      tasks: [makeTask()],
      existingItems: [
        {
          ...makeManualItem(),
          starts_at: combineDateAndTime("2026-07-14", "14:00"),
          ends_at: combineDateAndTime("2026-07-14", "13:00"),
        },
      ],
    });

    expect(result.plan.ignoredCalendarItems?.length).toBe(1);
    expect(result.plan.totalFreeMinutes).toBeGreaterThan(0);
  });
});
