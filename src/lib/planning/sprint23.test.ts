import { describe, expect, it } from "vitest";

import { buildDayConstraints } from "../../ai/planningEngine";
import {
  buildVacationSuggestionIntro,
  generateFreeTimeSuggestions,
} from "../../ai/freeTimeSuggestionEngine";
import { generateSportSession } from "../../ai/sportSessionGenerator";
import { computeEveningAvailableSlot } from "../../lib/planning/freeSlotEntries";
import { combineDateAndTime } from "../../lib/time/daySchedule";
import type { PlanningContext } from "../../ai/memoryEngine";
import type { DayTimelineEntry } from "../../lib/planning/displayedDayTimeline";
import {
  datesInMonth,
  getMonthBounds,
  isValidDateParam,
  parseUrlDate,
  resolveSelectedDate,
} from "../../lib/navigation/urlDate";
import { overlapsLocalDay } from "../../lib/time/dayBounds";

const date = "2026-07-13";

function makePlanningContext(
  overrides: Partial<PlanningContext> = {},
): PlanningContext {
  return {
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
      eveningRoutine: [],
      workDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      procrastinationCauses: [],
      sleepProblems: [],
      sportInterests: ["walk"],
      sportMusic: [],
      restPreferences: ["musique douce"],
      faithImportance: "important",
      faithContent: ["verse"],
      studiesActive: true,
      preferredFocusMinutes: 20,
      afterWorkEnergy: "low",
    },
    childRoutines: [],
    householdEvening: {
      eveningRoutineStart: null,
      eveningRoutineManager: null,
      averageEveningRoutineMinutes: 45,
    },
    familyContext: {
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
    },
    targetDate: date,
    currentUserId: "user-1",
    ...overrides,
  };
}

function makeFamilyContext(
  overrides: Partial<PlanningContext["familyContext"]> = {},
) {
  return {
    ...makePlanningContext().familyContext,
    ...overrides,
  };
}

function makeEntry(overrides: Partial<DayTimelineEntry>): DayTimelineEntry {
  return {
    id: "evening",
    visualType: "children_routine",
    title: "Routine soir",
    startsAt: combineDateAndTime(date, "19:30"),
    endsAt: combineDateAndTime(date, "20:30"),
    locked: true,
    origin: "computed",
    blockKind: "structural",
    constraintType: "evening_routine",
    ...overrides,
  };
}

describe("Sprint 2.3 — evening available slot", () => {
  it("A. shows evening available time after children bedtime", () => {
    const slot = computeEveningAvailableSlot({
      occupiedEntries: [
        makeEntry({
          id: "evening",
          constraintType: "evening_routine",
          endsAt: combineDateAndTime(date, "20:30"),
        }),
      ],
      adultBedTime: "22:00",
      date,
    });

    expect(slot).not.toBeNull();
    expect(slot?.title).toContain("Temps disponible");
    expect(slot?.startsAt).toBe(combineDateAndTime(date, "20:30"));
    expect(slot?.freeSlotKind).toBe("evening_available");
  });

  it("B. no evening slot after adult bedtime buffer", () => {
    const slot = computeEveningAvailableSlot({
      occupiedEntries: [
        makeEntry({
          endsAt: combineDateAndTime(date, "21:50"),
        }),
      ],
      adultBedTime: "22:00",
      date,
      windDownMinutes: 30,
    });

    expect(slot).toBeNull();
  });
});

describe("Sprint 2.3 — free time suggestions", () => {
  it("C. generates 15 min sport session", () => {
    const session = generateSportSession({
      durationMinutes: 15,
      sportType: "strength",
      intensity: "gentle",
      slotHour: 10,
    });

    expect(session?.title).toContain("15 min");
    expect(session?.steps.length).toBeGreaterThan(0);
  });

  it("D. short study suggestion in late evening", () => {
    const suggestions = generateFreeTimeSuggestions({
      slot: {
        id: "free-1",
        startsAt: combineDateAndTime(date, "21:00"),
        endsAt: combineDateAndTime(date, "21:30"),
        durationMinutes: 30,
        slotKind: "evening_available",
      },
      date,
      planningContext: makePlanningContext(),
      tasks: [],
    });

    const study = suggestions.find((item) => item.type === "study");
    expect(study).toBeDefined();
    expect(study?.recommendedDuration).toBeLessThanOrEqual(20);
  });

  it("E. calm time includes voluntary Spotify link", () => {
    const suggestions = generateFreeTimeSuggestions({
      slot: {
        id: "free-1",
        startsAt: combineDateAndTime(date, "20:30"),
        endsAt: combineDateAndTime(date, "21:30"),
        durationMinutes: 60,
        slotKind: "evening_available",
      },
      date,
      planningContext: makePlanningContext(),
    });

    const calm = suggestions.find((item) => item.type === "calm");
    expect(calm?.optionalContent).toMatchObject({
      spotifyUrl: "https://open.spotify.com/",
    });
    expect(calm?.description).toContain("sans lancement automatique");
  });

  it("F. hides spiritual when disabled", () => {
    const suggestions = generateFreeTimeSuggestions({
      slot: {
        id: "free-1",
        startsAt: combineDateAndTime(date, "15:00"),
        endsAt: combineDateAndTime(date, "16:00"),
        durationMinutes: 60,
      },
      date,
      planningContext: makePlanningContext({
        profile: {
          ...makePlanningContext().profile,
          faithImportance: "disabled",
        },
      }),
    });

    expect(suggestions.some((item) => item.type === "spiritual")).toBe(false);
  });

  it("G. shows spiritual when important", () => {
    const suggestions = generateFreeTimeSuggestions({
      slot: {
        id: "free-1",
        startsAt: combineDateAndTime(date, "20:00"),
        endsAt: combineDateAndTime(date, "21:00"),
        durationMinutes: 60,
        slotKind: "evening_available",
      },
      date,
      planningContext: makePlanningContext(),
    });

    expect(suggestions.some((item) => item.type === "spiritual")).toBe(true);
  });

  it("H. user vacation removes habitual work constraints", () => {
    const { constraints } = buildDayConstraints({
      date,
      context: makePlanningContext({
        familyContext: makeFamilyContext({
          disableWork: true,
          userVacation: true,
        }),
      }),
    });

    const types = constraints.map((constraint) => constraint.type);
    expect(types).not.toContain("work");
    expect(types).not.toContain("commute_out");
  });

  it("I. children vacation removes school departure", () => {
    const { constraints } = buildDayConstraints({
      date,
      context: makePlanningContext({
        familyContext: makeFamilyContext({
          disableSchoolDeparture: true,
          childrenVacation: true,
        }),
      }),
    });

    const types = constraints.map((constraint) => constraint.type);
    expect(types).not.toContain("morning_routine");
  });

  it("J. vacation keeps free time with capped suggestions", () => {
    const suggestions = generateFreeTimeSuggestions({
      slot: {
        id: "free-1",
        startsAt: combineDateAndTime(date, "14:00"),
        endsAt: combineDateAndTime(date, "16:00"),
        durationMinutes: 120,
      },
      date,
      planningContext: makePlanningContext({
        familyContext: makeFamilyContext({
          userVacation: true,
          childrenVacation: true,
          maxFillRatio: 0.6,
        }),
      }),
    });

    expect(suggestions.some((item) => item.type === "keep_free")).toBe(true);
    expect(
      suggestions
        .filter((item) => item.type !== "keep_free")
        .every((item) => item.recommendedDuration <= 72),
    ).toBe(true);
  });

  it("O. always includes keep free option", () => {
    const suggestions = generateFreeTimeSuggestions({
      slot: {
        id: "free-1",
        startsAt: combineDateAndTime(date, "14:00"),
        endsAt: combineDateAndTime(date, "15:00"),
        durationMinutes: 60,
      },
      date,
      planningContext: makePlanningContext(),
    });

    expect(suggestions.some((item) => item.type === "keep_free")).toBe(true);
    expect(suggestions.length).toBeLessThanOrEqual(5);
  });

  it("P. vacation intro stays light and optional", () => {
    const intro = buildVacationSuggestionIntro({
      slot: {
        id: "free-1",
        startsAt: combineDateAndTime(date, "14:00"),
        endsAt: combineDateAndTime(date, "15:30"),
        durationMinutes: 90,
      },
      planningContext: makePlanningContext({
        familyContext: makeFamilyContext({ userVacation: true }),
      }),
    });

    expect(intro).toContain("vacances");
    expect(intro).not.toContain("obligatoire");
  });
});

describe("Sprint 2.3 — URL date navigation", () => {
  it("K. month navigation helpers return correct bounds", () => {
    const julyDays = datesInMonth(2026, 6);
    expect(julyDays[0]).toBe("2026-07-01");
    expect(julyDays.at(-1)).toBe("2026-07-31");

    const bounds = getMonthBounds(2026, 6);
    expect(bounds.start.slice(0, 10)).toBe("2026-06-30");
    expect(bounds.end.slice(0, 10)).toBe("2026-07-31");
  });

  it("L/M. validates and resolves URL date", () => {
    expect(isValidDateParam("2026-07-20")).toBe(true);
    expect(parseUrlDate("invalid")).toBeNull();
    expect(resolveSelectedDate("2026-07-20")).toBe("2026-07-20");
    expect(resolveSelectedDate(null, "2026-07-01")).toBe("2026-07-01");
  });

  it("Q. appointment overlaps selected date for calendar display", () => {
    const appointmentStart = combineDateAndTime("2026-07-20", "10:00");
    const appointmentEnd = combineDateAndTime("2026-07-20", "11:00");

    expect(
      overlapsLocalDay({
        startsAt: appointmentStart,
        endsAt: appointmentEnd,
        date: "2026-07-20",
      }),
    ).toBe(true);
    expect(
      overlapsLocalDay({
        startsAt: appointmentStart,
        endsAt: appointmentEnd,
        date: "2026-07-21",
      }),
    ).toBe(false);
  });
});

describe("Sprint 2.3 — suggestion persistence rules", () => {
  it("N/O. keep free action must not create calendar items", () => {
    const keepFree = generateFreeTimeSuggestions({
      slot: {
        id: "free-1",
        startsAt: combineDateAndTime(date, "14:00"),
        endsAt: combineDateAndTime(date, "15:00"),
        durationMinutes: 60,
      },
      date,
      planningContext: makePlanningContext(),
    }).find((item) => item.action === "keep_free");

    expect(keepFree?.action).toBe("keep_free");
    expect(keepFree?.recommendedDuration).toBe(0);
  });
});
