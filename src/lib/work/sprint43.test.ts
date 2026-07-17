import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { buildDayConstraints } from "../../ai/planningEngine";
import type { PlanningContext } from "../../ai/memoryEngine";
import {
  buildEveningOpportunityInput,
  resolveEveningOpportunity,
} from "../../ai/eveningOpportunityEngine";
import { buildAlternatingWeeksPattern, buildCyclePattern } from "./workScheduleBuilders";
import {
  applyScheduleModeChange,
  hydrateEditorFromPattern,
  patternTypeToMode,
} from "./workScheduleEditorState";
import { previewWorkSchedule, resolveWorkStatusForDate } from "./resolveWorkStatusForDate";
import {
  emptyWeekPattern,
  type WeekdayKey,
} from "../../types/workSchedule";
import {
  resolveBedTimeIso,
  resolveBedWindDownEnd,
} from "../time/bedTime";
import { combineDateAndTime } from "../time/daySchedule";
import { buildDisplayedDayTimeline } from "../planning/displayedDayTimeline";
import type { LifeContext } from "../../types/lifeContext";
import type { ResolvedFamilyContext } from "../../types/familyContext";
import { DEFAULT_LAYOUT_PREFERENCES } from "../../types/layoutPreferences";

const root = join(process.cwd(), "src");

function readSrc(fragment: string): string {
  return readFileSync(join(root, fragment), "utf8");
}

function setDayWork(
  week: ReturnType<typeof emptyWeekPattern>,
  days: WeekdayKey[],
  start = "09:00",
  end = "17:00",
) {
  for (const day of days) {
    week.days[day] = { work: true, startTime: start, endTime: end };
  }
  return week;
}

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

const basePlanningContext: PlanningContext = {
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
  bedTime: "00:00",
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
    preferredFocusMinutes: 25,
    procrastinationCauses: [],
    sleepProblems: [],
    sportInterests: [],
    sportMusic: [],
    restPreferences: ["lecture"],
    faithImportance: "disabled",
    faithContent: [],
  },
  childRoutines: [
    {
      id: "routine-1",
      child_id: "child-1",
      household_id: "household-1",
      bedtime_weekday: "20:30",
      bedtime_weekend: "21:00",
      evening_routine_minutes: 60,
      wake_time: null,
      school_days: null,
      created_at: "",
      updated_at: "",
    },
  ],
  householdEvening: {
    eveningRoutineStart: null,
    eveningRoutineManager: null,
    averageEveningRoutineMinutes: 60,
  },
  familyContext: makeFamilyContext(),
  familyContextPeriods: [],
  targetDate: date,
  currentUserId: "user-1",
  eveningPlanningMode: "suggestions_only",
};

function makeLifeContext(overrides: Partial<LifeContext> = {}): LifeContext {
  return {
    date,
    dayType: "WORKDAY",
    dayTypeReason: "Journée de travail",
    workDay: true,
    vacation: false,
    restDay: false,
    travelDay: false,
    familySituation: "normal",
    availableMinutes: 180,
    lockedMinutes: 600,
    energyPrediction: "low",
    childrenPresent: true,
    partnerPresent: true,
    sportPossible: true,
    studyPossible: true,
    freeEvening: true,
    workoutCompletedToday: false,
    workoutMinutesCompletedToday: 0,
    workoutTypeCompletedToday: null,
    priority: "studies",
    reasoning: [],
    freeSlots: [],
    proposals: [],
    maxFillRatio: 0.6,
    ...overrides,
  };
}

function eveningInput(overrides: Partial<Parameters<typeof resolveEveningOpportunity>[0]> = {}) {
  return {
    eveningStart: combineDateAndTime(date, "20:30"),
    eveningEnd: resolveBedWindDownEnd({ date, bedTime: "00:00" }),
    workDay: true,
    restDay: false,
    energyPrediction: "low" as const,
    afterWorkEnergy: "low",
    mainPriority: "studies",
    studiesActive: true,
    preferredFocusMinutes: 25,
    sportPossible: true,
    daysSinceSport: 5,
    faithImportance: "disabled",
    restPreferences: ["lecture"],
    familySituation: "normal" as const,
    partnerPresent: true,
    eveningPlanningMode: "suggestions_only" as const,
    ...overrides,
  };
}

describe("Sprint 4.3 — rythme A/B (éditeur)", () => {
  it("A. fixed_week — mode par défaut", () => {
    const state = hydrateEditorFromPattern(
      null,
      ["monday", "friday"],
      "09:00",
      "17:00",
      "2026-07-06",
    );
    expect(state.mode).toBe("fixed_week");
    expect(state.weekA.days.monday?.work).toBe(true);
    expect(state.weekA.days.friday?.work).toBe(true);
  });

  it("B. alternating_weeks — changement de mode immédiat", () => {
    const initial = hydrateEditorFromPattern(
      null,
      ["monday"],
      "09:00",
      "17:00",
      "2026-07-06",
    );
    const next = applyScheduleModeChange(initial, "alternating_weeks");
    expect(next.mode).toBe("alternating_weeks");
    expect(next.weekB.label).toBe("Semaine B");
  });

  it("C. cycle — affichage semaines multiples", () => {
    const initial = hydrateEditorFromPattern(
      null,
      ["monday"],
      "09:00",
      "17:00",
      "2026-07-06",
    );
    const next = applyScheduleModeChange(initial, "cycle");
    expect(next.mode).toBe("cycle");
    expect(next.cycleWeeks.length).toBeGreaterThanOrEqual(2);
  });

  it("D. hydratation alternating_weeks depuis pattern", () => {
    const weekA = emptyWeekPattern("Semaine A");
    const weekB = emptyWeekPattern("Semaine B");
    setDayWork(weekA, ["monday", "tuesday", "wednesday", "thursday", "friday"]);
    const pattern = buildAlternatingWeeksPattern({
      weekA,
      weekB,
      effectiveFrom: "2026-07-06",
      referenceWeek: "2026-07-06",
    });
    const state = hydrateEditorFromPattern(
      pattern,
      ["monday"],
      "09:00",
      "17:00",
      "2026-07-06",
    );
    expect(patternTypeToMode(pattern.patternType)).toBe("alternating_weeks");
    expect(state.mode).toBe("alternating_weeks");
    expect(state.weekA.days.monday?.work).toBe(true);
    expect(state.weekB.label).toBe("Semaine B");
  });

  it("E. sauvegarde alternating — patternType correct", () => {
    const weekA = emptyWeekPattern("Semaine A");
    const weekB = emptyWeekPattern("Semaine B");
    setDayWork(weekA, ["monday", "wednesday", "friday"]);
    setDayWork(weekB, ["tuesday", "thursday"]);
    const pattern = buildAlternatingWeeksPattern({
      weekA,
      weekB,
      effectiveFrom: "2026-07-06",
      referenceWeek: "2026-07-06",
    });
    expect(pattern.patternType).toBe("alternating_weeks");
    expect(pattern.weeklyPatterns).toHaveLength(2);
  });

  it("F. rechargement — preview alternance A/B", () => {
    const weekA = emptyWeekPattern("Semaine A");
    const weekB = emptyWeekPattern("Semaine B");
    setDayWork(weekA, ["monday", "wednesday", "friday"]);
    setDayWork(weekB, ["tuesday", "thursday"]);
    const pattern = buildAlternatingWeeksPattern({
      weekA,
      weekB,
      effectiveFrom: "2026-07-06",
      referenceWeek: "2026-07-06",
    });
    const preview = previewWorkSchedule({
      startDate: "2026-07-06",
      weekCount: 2,
      fixedWorkDays: [],
      workSchedulePattern: pattern,
    });
    const mondayWeek1 = preview.find((item) => item.date === "2026-07-06");
    const mondayWeek2 = preview.find((item) => item.date === "2026-07-13");
    expect(mondayWeek1?.status.isWorkDay).toBe(true);
    expect(mondayWeek2?.status.isWorkDay).toBe(false);
  });

  it("G. RLS — policies work_schedule_patterns", () => {
    const migration = readFileSync(
      join(process.cwd(), "supabase/migrations/00011_sprint42_work_schedule_sidebar.sql"),
      "utf8",
    );
    expect(migration).toContain("work_schedule_patterns_select_own");
    expect(migration).toContain("work_schedule_patterns_insert_own");
    expect(migration).toContain("user_id = auth.uid()");
  });

  it("H. samedi travaillé une semaine sur deux", () => {
    const weekA = emptyWeekPattern();
    const weekB = emptyWeekPattern();
    setDayWork(weekA, ["saturday"]);
    const pattern = buildAlternatingWeeksPattern({
      weekA,
      weekB,
      effectiveFrom: "2026-07-06",
      referenceWeek: "2026-07-06",
    });
    const satWeek1 = resolveWorkStatusForDate({
      date: "2026-07-11",
      fixedWorkDays: [],
      workSchedulePattern: pattern,
    });
    const satWeek2 = resolveWorkStatusForDate({
      date: "2026-07-18",
      fixedWorkDays: [],
      workSchedulePattern: pattern,
    });
    expect(satWeek1.isWorkDay).toBe(true);
    expect(satWeek2.isWorkDay).toBe(false);
  });

  it("I. mardi compensateur", () => {
    const weekWork = emptyWeekPattern();
    setDayWork(weekWork, ["saturday"]);
    const pattern = buildCyclePattern({
      weeks: [weekWork, emptyWeekPattern()],
      effectiveFrom: "2026-07-06",
      referenceWeek: "2026-07-06",
      compensatoryRules: [{ whenWorkWeekday: "saturday", restWeekday: "tuesday" }],
    });
    const tuesday = resolveWorkStatusForDate({
      date: "2026-07-14",
      fixedWorkDays: [],
      workSchedulePattern: pattern,
    });
    expect(tuesday.isCompensatoryRest).toBe(true);
    expect(tuesday.isWorkDay).toBe(false);
  });

  it("J. hook stable — userTouchedRef empêche écrasement", () => {
    const hook = readSrc("hooks/useWorkScheduleEditor.ts");
    expect(hook).toContain("userTouchedRef");
    expect(hook).toContain("workDaysKey");
    expect(hook).toContain("if (!userTouchedRef.current)");
  });

  it("K. WorkScheduleSection visible hors mode Modifier", () => {
    const profile = readSrc("pages/ProfilePage.tsx");
    const section = readSrc("components/profile/WorkScheduleSection.tsx");
    expect(profile).toContain("<WorkScheduleSection");
    expect(profile).not.toContain('editingSection === "work" && user && (\n                          <WorkScheduleSection');
    expect(section).toContain("Enregistrer mon rythme");
    expect(section).toContain('setMode(value)');
  });

  it("L. calendrier utilise le pattern alternating", () => {
    const weekA = emptyWeekPattern();
    const weekB = emptyWeekPattern();
    setDayWork(weekA, ["monday", "tuesday", "wednesday", "thursday", "friday"]);
    const pattern = buildAlternatingWeeksPattern({
      weekA,
      weekB,
      effectiveFrom: "2026-07-06",
      referenceWeek: "2026-07-06",
    });
    const { constraints } = buildDayConstraints({
      date: "2026-07-13",
      context: { ...basePlanningContext, workSchedulePattern: pattern },
    });
    expect(constraints.some((item) => item.type === "work")).toBe(false);
  });
});

describe("Sprint 4.3 — coucher minuit et marge", () => {
  it("M. 00:00 = fin de soirée (jour suivant)", () => {
    const bedIso = resolveBedTimeIso(date, "00:00");
    expect(bedIso).toBe(combineDateAndTime("2026-07-14", "00:00"));
  });

  it("N. marge 30 min avant minuit", () => {
    const windDown = resolveBedWindDownEnd({ date, bedTime: "00:00" });
    expect(windDown).toBe(combineDateAndTime(date, "23:30"));
  });

  it("O. créneau 20:30–23:30 exploitable", () => {
    const input = eveningInput();
    const result = resolveEveningOpportunity(input);
    expect(result.totalMinutes).toBe(180);
    expect(result.blocks.length).toBeGreaterThan(0);
  });
});

describe("Sprint 4.3 — EveningOpportunity", () => {
  it("P. journée fatigante — temps calme", () => {
    const result = resolveEveningOpportunity(
      eveningInput({
        energyPrediction: "low",
        afterWorkEnergy: "low",
        mainPriority: "work",
        studiesActive: false,
      }),
    );
    expect(result.blocks.some((block) => block.type === "calm")).toBe(true);
    expect(
      result.blocks.some((block) =>
        block.reason.includes("journée a été longue"),
      ),
    ).toBe(true);
  });

  it("Q. priorité étude — révision limitée", () => {
    const result = resolveEveningOpportunity(
      eveningInput({
        energyPrediction: "medium",
        afterWorkEnergy: "medium",
        mainPriority: "studies",
        studiesActive: true,
        preferredFocusMinutes: 25,
      }),
    );
    const study = result.blocks.find((block) => block.type === "study");
    expect(study).toBeDefined();
    expect(study?.reason).toContain("25 minutes");
  });

  it("R. sport absent — mobilité courte si pas trop tard", () => {
    const result = resolveEveningOpportunity(
      eveningInput({
        energyPrediction: "medium",
        afterWorkEnergy: "medium",
        studiesActive: false,
        mainPriority: "sport",
        partnerPresent: false,
        restPreferences: [],
        daysSinceSport: 5,
        eveningStart: combineDateAndTime(date, "20:30"),
      }),
    );
    expect(result.blocks.some((block) => block.type === "sport")).toBe(true);
  });

  it("S. sport récent — pas de sport intense tard", () => {
    const result = resolveEveningOpportunity(
      eveningInput({
        energyPrediction: "high",
        daysSinceSport: 1,
        eveningStart: combineDateAndTime(date, "21:30"),
      }),
    );
    expect(result.blocks.some((block) => block.type === "sport")).toBe(false);
  });

  it("T. parent seul — activité légère", () => {
    const result = resolveEveningOpportunity(
      eveningInput({
        familySituation: "parent_alone",
        energyPrediction: "low",
        partnerPresent: false,
      }),
    );
    expect(result.fillRatio).toBeLessThanOrEqual(0.6);
    expect(
      result.blocks.filter((block) => block.type !== "keep_free").length,
    ).toBeLessThanOrEqual(3);
  });

  it("U. spiritualité désactivée — pas de bloc spirituel", () => {
    const result = resolveEveningOpportunity(
      eveningInput({ faithImportance: "disabled" }),
    );
    expect(result.blocks.some((block) => block.type === "spiritual")).toBe(false);
  });

  it("V. jour de repos — loisir possible", () => {
    const result = resolveEveningOpportunity(
      eveningInput({
        workDay: false,
        restDay: true,
        energyPrediction: "medium",
        afterWorkEnergy: "medium",
        mainPriority: "rest",
        studiesActive: false,
        partnerPresent: false,
        sportPossible: false,
        daysSinceSport: 1,
      }),
    );
    expect(
      result.blocks.some(
        (block) =>
          block.type === "leisure" ||
          block.type === "reading" ||
          block.type === "calm",
      ),
    ).toBe(true);
  });

  it("W. maximum 60 % rempli", () => {
    const result = resolveEveningOpportunity(eveningInput());
    expect(result.fillRatio).toBeLessThanOrEqual(0.6);
  });

  it("X. temps libre conservé", () => {
    const result = resolveEveningOpportunity(eveningInput());
    expect(result.blocks.some((block) => block.type === "keep_free")).toBe(true);
    expect(result.keptFreeMinutes).toBeGreaterThanOrEqual(45);
  });

  it("Y. mode disabled — créneau libre", () => {
    const result = resolveEveningOpportunity(
      eveningInput({ eveningPlanningMode: "disabled" }),
    );
    expect(result.blocks).toHaveLength(0);
    expect(result.summary).toContain("désactivée");
  });

  it("Z. mode suggestions_only — blocs proposés", () => {
    const result = resolveEveningOpportunity(
      eveningInput({ eveningPlanningMode: "suggestions_only" }),
    );
    expect(result.blocks.some((block) => block.suggested)).toBe(true);
  });

  it("AA. mode automatic — blocs non suggérés", () => {
    const result = resolveEveningOpportunity(
      eveningInput({ eveningPlanningMode: "automatic" }),
    );
    const planned = result.blocks.filter((block) => block.type !== "keep_free");
    expect(planned.every((block) => !block.suggested)).toBe(true);
  });
});

describe("Sprint 4.3 — timeline soir", () => {
  function buildEveningTimeline(
    bedTime = "00:00",
    mode: "automatic" | "suggestions_only" | "disabled" = "suggestions_only",
    lifeOverrides: Partial<LifeContext> = {},
  ) {
    const context: PlanningContext = {
      ...basePlanningContext,
      bedTime,
      eveningPlanningMode: mode,
    };
    const { displayConstraints } = buildDayConstraints({
      date,
      context,
    });
    const lifeContext = makeLifeContext(lifeOverrides);
    return buildDisplayedDayTimeline({
      constraints: displayConstraints,
      persistedItems: [],
      adultBedTime: bedTime,
      date,
      lifeContext,
      planningContext: context,
      eveningPlanningMode: mode,
    });
  }

  it("AB. soirée affichée comme un bloc Temps libre", () => {
    const timeline = buildEveningTimeline();
    expect(
      timeline.some(
        (entry) =>
          entry.freeSlotKind === "evening_available" &&
          entry.title.startsWith("Temps libre"),
      ),
    ).toBe(true);
  });

  it("AC. suggestion principale visible après coucher enfants", () => {
    const timeline = buildEveningTimeline();
    const evening = timeline.find((entry) => entry.freeSlotKind === "evening_available");
    expect(evening?.primarySuggestion).toBeDefined();
    expect(evening?.explanation).toBeTruthy();
  });

  it("AD. pas de trou silencieux jusqu'à minuit", () => {
    const timeline = buildEveningTimeline("00:00");
    const eveningBlocks = timeline.filter(
      (entry) => entry.freeSlotKind === "evening_available",
    );
    expect(eveningBlocks.length).toBeGreaterThan(0);
    const lastEvening = eveningBlocks[eveningBlocks.length - 1];
    expect(new Date(lastEvening.endsAt).getHours()).toBeGreaterThanOrEqual(22);
  });

  it("AE. mode disabled — explication libre", () => {
    const timeline = buildEveningTimeline("00:00", "disabled");
    expect(
      timeline.some(
        (entry) =>
          entry.freeSlotKind === "evening_available" &&
          entry.title.startsWith("Temps libre"),
      ),
    ).toBe(true);
  });

  it("AF. préférence evening_planning_mode en base", () => {
    const migration = readFileSync(
      join(process.cwd(), "supabase/migrations/00012_sprint43_evening_planning.sql"),
      "utf8",
    );
    const service = readSrc("services/layoutPreferencesService.ts");
    expect(migration).toContain("evening_planning_mode");
    expect(service).toContain("evening_planning_mode");
    expect(DEFAULT_LAYOUT_PREFERENCES.eveningPlanningMode).toBe("suggestions_only");
  });

  it("AG. buildEveningOpportunityInput relie contexte", () => {
    const input = buildEveningOpportunityInput({
      eveningStart: combineDateAndTime(date, "20:30"),
      eveningEnd: resolveBedWindDownEnd({ date, bedTime: "00:00" }),
      context: basePlanningContext,
      lifeContext: makeLifeContext(),
      eveningPlanningMode: "suggestions_only",
      daysSinceSport: 4,
    });
    expect(input.preferredFocusMinutes).toBe(25);
    expect(input.daysSinceSport).toBe(4);
  });
});
