import { describe, expect, it } from "vitest";

import { buildDayConstraints } from "../../ai/planningEngine";
import type { PlanningContext } from "../../ai/memoryEngine";
import type { ResolvedFamilyContext } from "../../types/familyContext";
import type { CalendarItemRecord } from "../../types";
import { combineDateAndTime } from "../time/daySchedule";
import { overlapsLocalDay } from "../time/dayBounds";
import {
  buildDisplayedDayTimeline,
  dedupeTimelineEntries,
  mapConstraintTypeToVisualType,
} from "./displayedDayTimeline";

function makeFamilyContext(
  overrides: Partial<ResolvedFamilyContext> = {},
): ResolvedFamilyContext {
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
    ...overrides,
  };
}

const date = "2026-07-13";

const baseContext: PlanningContext = {
  householdId: "household-1",
  children: [
    {
      id: "child-1",
      household_id: "household-1",
      first_name: "Léa",
      birth_date: null,
    },
  ],
  childrenCount: 1,
  wakeTime: "06:30",
  bedTime: "22:00",
  workStart: "09:00",
  workEnd: "17:00",
  mainPriority: "studies",
  onboardingCompleted: true,
  profile: {
    morningDurationMinutes: 60,
    childrenDepartureTime: "08:00",
    eveningRoutine: ["homework", "meal"],
    workDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    commuteMinutes: 30,
    afterWorkEnergy: "low",
    studiesActive: true,
    studyWeeklyHours: 6,
    studyBestPeriod: "morning",
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
  childRoutines: [
    {
      id: "routine-1",
      child_id: "child-1",
      household_id: "household-1",
      bedtime_weekday: "20:00",
      bedtime_weekend: "21:00",
      evening_routine_minutes: 45,
      wake_time: null,
      school_days: null,
      created_at: "",
      updated_at: "",
    },
  ],
  householdEvening: {
    eveningRoutineStart: null,
    eveningRoutineManager: null,
    averageEveningRoutineMinutes: 45,
  },
  familyContext: makeFamilyContext(),
  familyContextPeriods: [],
  targetDate: date,
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
    starts_at: combineDateAndTime(date, "14:00"),
    ends_at: combineDateAndTime(date, "15:00"),
    locked: true,
    source: "user",
    details: { constraintType: "appointment", status: "accepted" },
    created_at: "2026-07-13T10:00:00.000Z",
    updated_at: "2026-07-13T10:00:00.000Z",
  };
}

function makeTaskItem(): CalendarItemRecord {
  return {
    id: "task-block-1",
    household_id: "household-1",
    user_id: "user-1",
    task_id: "task-1",
    title: "Réviser",
    item_type: "task",
    starts_at: combineDateAndTime(date, "10:30"),
    ends_at: combineDateAndTime(date, "11:00"),
    locked: false,
    source: "ai",
    details: { status: "proposed", blockType: "task" },
    created_at: "2026-07-13T10:00:00.000Z",
    updated_at: "2026-07-13T10:00:00.000Z",
  };
}

describe("buildDisplayedDayTimeline", () => {
  function getDisplayConstraints(context = baseContext, existingItems: CalendarItemRecord[] = []) {
    return buildDayConstraints({
      date,
      context,
      existingItems,
    }).displayConstraints;
  }

  it("A. shows wake and sleep", () => {
    const timeline = buildDisplayedDayTimeline({
      constraints: getDisplayConstraints(),
      persistedItems: [],
    });

    expect(timeline.some((entry) => entry.visualType === "wake")).toBe(true);
    expect(timeline.some((entry) => entry.visualType === "sleep")).toBe(true);
  });

  it("B. shows children routines", () => {
    const timeline = buildDisplayedDayTimeline({
      constraints: getDisplayConstraints(),
      persistedItems: [],
    });

    expect(
      timeline.some((entry) => entry.visualType === "children_routine"),
    ).toBe(true);
  });

  it("C. shows work and commute as separate blocks", () => {
    const timeline = buildDisplayedDayTimeline({
      constraints: getDisplayConstraints(),
      persistedItems: [],
    });

    expect(timeline.some((entry) => entry.visualType === "work")).toBe(true);
    expect(timeline.filter((entry) => entry.visualType === "commute").length).toBeGreaterThanOrEqual(1);
  });

  it("D. shows manual appointment", () => {
    const manual = makeManualItem();
    const timeline = buildDisplayedDayTimeline({
      constraints: getDisplayConstraints(baseContext, [manual]),
      persistedItems: [manual],
    });

    expect(
      timeline.some(
        (entry) =>
          entry.visualType === "appointment" && entry.title === "Médecin",
      ),
    ).toBe(true);
  });

  it("E. shows planned task", () => {
    const timeline = buildDisplayedDayTimeline({
      constraints: getDisplayConstraints(),
      persistedItems: [makeTaskItem()],
    });

    expect(
      timeline.some(
        (entry) => entry.visualType === "task" && entry.title === "Réviser",
      ),
    ).toBe(true);
  });

  it("F. dedupes manual appointment without duplicate", () => {
    const manual = makeManualItem();
    const timeline = buildDisplayedDayTimeline({
      constraints: getDisplayConstraints(baseContext, [manual]),
      persistedItems: [manual],
    });

    const appointments = timeline.filter(
      (entry) => entry.title === "Médecin",
    );

    expect(appointments).toHaveLength(1);
  });

  it("G. sorts entries chronologically", () => {
    const manual = makeManualItem();
    const timeline = buildDisplayedDayTimeline({
      constraints: getDisplayConstraints(baseContext, [manual, makeTaskItem()]),
      persistedItems: [manual, makeTaskItem()],
    });

    for (let index = 1; index < timeline.length; index += 1) {
      expect(
        new Date(timeline[index].startsAt).getTime(),
      ).toBeGreaterThanOrEqual(
        new Date(timeline[index - 1].startsAt).getTime(),
      );
    }
  });

  it("J. hides work during vacation context", () => {
    const timeline = buildDisplayedDayTimeline({
      constraints: getDisplayConstraints({
        ...baseContext,
        familyContext: makeFamilyContext({
          disableWork: true,
          userVacation: true,
        }),
      }),
      persistedItems: [],
    });

    expect(timeline.some((entry) => entry.visualType === "work")).toBe(false);
  });

  it("K. keeps children routine for solo parent", () => {
    const timeline = buildDisplayedDayTimeline({
      constraints: getDisplayConstraints({
        ...baseContext,
        familyContext: makeFamilyContext({
          soloParentWithChildren: true,
        }),
      }),
      persistedItems: [],
    });

    expect(
      timeline.some((entry) => entry.visualType === "children_routine"),
    ).toBe(true);
  });
});

describe("mapConstraintTypeToVisualType", () => {
  it("L. maps overlapping manual constraint to appointment", () => {
    expect(mapConstraintTypeToVisualType("manual")).toBe("appointment");
  });
});

describe("dedupeTimelineEntries", () => {
  it("prefers persisted duplicate over computed", () => {
    const deduped = dedupeTimelineEntries([
      {
        id: "manual-1",
        visualType: "appointment",
        title: "Médecin",
        startsAt: combineDateAndTime(date, "14:00"),
        endsAt: combineDateAndTime(date, "15:00"),
        locked: true,
        origin: "computed",
        blockKind: "appointment",
      },
      {
        id: "manual-1",
        visualType: "appointment",
        title: "Médecin",
        startsAt: combineDateAndTime(date, "14:00"),
        endsAt: combineDateAndTime(date, "15:00"),
        locked: true,
        status: "accepted",
        origin: "persisted",
        blockKind: "appointment",
        calendarItemId: "manual-1",
      },
    ]);

    expect(deduped).toHaveLength(1);
    expect(deduped[0].origin).toBe("persisted");
    expect(deduped[0].status).toBe("accepted");
  });
});

describe("Sprint 2.1 — manual appointments visibility", () => {
  it("A. manual appointment on target day is visible", () => {
    const manual = makeManualItem();
    const timeline = buildDisplayedDayTimeline({
      constraints: buildDayConstraints({
        date,
        context: baseContext,
        existingItems: [manual],
      }).displayConstraints,
      persistedItems: [manual],
    });

    expect(
      timeline.some(
        (entry) =>
          entry.visualType === "appointment" &&
          entry.title === "Médecin" &&
          entry.origin === "persisted",
      ),
    ).toBe(true);
  });

  it("B. manual appointment outside day is not visible in timeline", () => {
    const outsideDay: CalendarItemRecord = {
      ...makeManualItem(),
      id: "manual-outside",
      starts_at: combineDateAndTime("2026-07-14", "10:00"),
      ends_at: combineDateAndTime("2026-07-14", "11:00"),
    };

    expect(
      overlapsLocalDay({
        startsAt: outsideDay.starts_at,
        endsAt: outsideDay.ends_at,
        date,
      }),
    ).toBe(false);

    const timeline = buildDisplayedDayTimeline({
      constraints: buildDayConstraints({ date, context: baseContext }).displayConstraints,
      persistedItems: [],
    });

    expect(timeline.some((entry) => entry.title === "Médecin")).toBe(false);
  });

  it("C. appointment crossing midnight overlaps target day", () => {
    const crossing: CalendarItemRecord = {
      ...makeManualItem(),
      id: "manual-cross",
      starts_at: combineDateAndTime(date, "23:00"),
      ends_at: combineDateAndTime("2026-07-14", "01:00"),
    };

    expect(
      overlapsLocalDay({
        startsAt: crossing.starts_at,
        endsAt: crossing.ends_at,
        date,
      }),
    ).toBe(true);

    const timeline = buildDisplayedDayTimeline({
      constraints: buildDayConstraints({
        date,
        context: baseContext,
        existingItems: [crossing],
      }).displayConstraints,
      persistedItems: [crossing],
    });

    expect(timeline.some((entry) => entry.id === "manual-cross")).toBe(true);
  });

  it("D. user source appointment is kept in timeline", () => {
    const manual = makeManualItem();
    const timeline = buildDisplayedDayTimeline({
      constraints: buildDayConstraints({
        date,
        context: baseContext,
        existingItems: [manual],
      }).displayConstraints,
      persistedItems: [manual],
    });

    const appointment = timeline.find((entry) => entry.title === "Médecin");
    expect(appointment?.origin).toBe("persisted");
    expect(appointment?.locked).toBe(true);
  });

  it("I. work stays visible with commute blocks", () => {
    const timeline = buildDisplayedDayTimeline({
      constraints: buildDayConstraints({ date, context: baseContext }).displayConstraints,
      persistedItems: [],
    });

    const work = timeline.find((entry) => entry.visualType === "work");
    const commutes = timeline.filter((entry) => entry.visualType === "commute");

    expect(work).toBeDefined();
    expect(commutes.length).toBeGreaterThanOrEqual(1);
    expect(work?.title).toBe("Travail");
  });
});
