import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { buildDayConstraints } from "../../ai/planningEngine";
import type { PlanningContext } from "../../ai/memoryEngine";
import {
  computeEasterSunday,
  getCatholicDayInfo,
} from "../../content/catholicCalendar";
import { resolveDayCellVisual } from "../../design-system/dayCellVisual";
import { resolveCalendarDayStatus } from "../../lib/calendar/resolveCalendarDayStatus";
import {
  previewWorkSchedule,
  resolveWorkStatusForDate,
} from "../../lib/work/resolveWorkStatusForDate";
import { buildCyclePattern } from "../../lib/work/workScheduleBuilders";
import {
  createDefaultFixedPattern,
  emptyWeekPattern,
  type WeekdayKey,
} from "../../types/workSchedule";
import type { FamilyContextPeriodRecord } from "../../types/familyContext";
import type { ResolvedFamilyContext } from "../../types/familyContext";
import { DEFAULT_LAYOUT_PREFERENCES } from "../../types/layoutPreferences";

const root = join(process.cwd(), "src");

function readSrc(fragment: string): string {
  return readFileSync(join(root, fragment), "utf8");
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

const basePlanningContext: PlanningContext = {
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
    eveningRoutine: [],
    workDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    commuteMinutes: 30,
    procrastinationCauses: [],
    sleepProblems: [],
    sportInterests: [],
    sportMusic: [],
    restPreferences: [],
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
  targetDate: "2026-07-13",
  currentUserId: "user-1",
};

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

function makeVacationPeriod(
  starts: string,
  ends: string,
): FamilyContextPeriodRecord {
  return {
    id: "vacation-1",
    household_id: "household-1",
    user_id: "user-1",
    context_type: "user_vacation",
    title: "Vacances",
    starts_at: `${starts}T00:00:00.000Z`,
    ends_at: `${ends}T23:59:59.999Z`,
    affected_member_id: null,
    description: null,
    status: "active",
    created_by: "user-1",
    created_at: "2026-06-01T00:00:00.000Z",
    updated_at: "2026-06-01T00:00:00.000Z",
    impact: {},
  };
}

describe("Sprint 4.2 — rythmes variables", () => {
  it("A. semaine fixe — lundi travaillé", () => {
    const status = resolveWorkStatusForDate({
      date: "2026-07-13",
      fixedWorkDays: ["monday", "tuesday", "thursday", "friday"],
    });
    expect(status.isWorkDay).toBe(true);
    expect(status.source).toBe("fixed_days");
  });

  it("B. un samedi sur deux — samedi travaillé semaine 0", () => {
    const weekWork = emptyWeekPattern("Semaine travail");
    setDayWork(weekWork, ["saturday"], "08:00", "12:00");
    const weekRest = emptyWeekPattern("Semaine repos");

    const pattern = buildCyclePattern({
      weeks: [weekWork, weekRest],
      effectiveFrom: "2026-07-06",
      referenceWeek: "2026-07-06",
      compensatoryRules: [{ whenWorkWeekday: "saturday", restWeekday: "tuesday" }],
    });

    const workedSaturday = resolveWorkStatusForDate({
      date: "2026-07-11",
      fixedWorkDays: [],
      workSchedulePattern: pattern,
    });
    expect(workedSaturday.isWorkDay).toBe(true);

    const offSaturday = resolveWorkStatusForDate({
      date: "2026-07-18",
      fixedWorkDays: [],
      workSchedulePattern: pattern,
    });
    expect(offSaturday.isWorkDay).toBe(false);
    expect(offSaturday.isWeekendNonWork).toBe(true);
  });

  it("C. un samedi sur trois", () => {
    const weekWork = emptyWeekPattern();
    setDayWork(weekWork, ["saturday"]);
    const pattern = buildCyclePattern({
      weeks: [weekWork, emptyWeekPattern(), emptyWeekPattern()],
      effectiveFrom: "2026-07-06",
      referenceWeek: "2026-07-06",
    });

    expect(
      resolveWorkStatusForDate({
        date: "2026-07-11",
        fixedWorkDays: [],
        workSchedulePattern: pattern,
      }).isWorkDay,
    ).toBe(true);

    expect(
      resolveWorkStatusForDate({
        date: "2026-07-18",
        fixedWorkDays: [],
        workSchedulePattern: pattern,
      }).isWorkDay,
    ).toBe(false);
  });

  it("D. semaine A / B", () => {
    const weekA = emptyWeekPattern("A");
    setDayWork(weekA, ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]);
    const weekB = emptyWeekPattern("B");
    setDayWork(weekB, ["monday", "wednesday", "thursday", "friday"]);

    const pattern = buildCyclePattern({
      weeks: [weekA, weekB],
      effectiveFrom: "2026-07-06",
      referenceWeek: "2026-07-06",
    });

    const mondayA = resolveWorkStatusForDate({
      date: "2026-07-13",
      fixedWorkDays: [],
      workSchedulePattern: pattern,
    });
    expect(mondayA.isWorkDay).toBe(true);
    expect(mondayA.cycleWeek).toBe(1);

    const tuesdayB = resolveWorkStatusForDate({
      date: "2026-07-14",
      fixedWorkDays: [],
      workSchedulePattern: pattern,
    });
    expect(tuesdayB.isWorkDay).toBe(false);
  });

  it("E. mardi compensateur", () => {
    const weekWork = emptyWeekPattern();
    setDayWork(weekWork, ["saturday"]);
    const pattern = buildCyclePattern({
      weeks: [weekWork, emptyWeekPattern()],
      effectiveFrom: "2026-07-06",
      referenceWeek: "2026-07-06",
      compensatoryRules: [{ whenWorkWeekday: "saturday", restWeekday: "tuesday" }],
    });

    const compensatoryTuesday = resolveWorkStatusForDate({
      date: "2026-07-14",
      fixedWorkDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      workSchedulePattern: pattern,
    });

    expect(compensatoryTuesday.isCompensatoryRest).toBe(true);
    expect(compensatoryTuesday.isWorkDay).toBe(false);
  });

  it("F. exception ponctuelle", () => {
    const pattern = createDefaultFixedPattern(
      ["monday", "tuesday", "wednesday", "thursday", "friday"],
      "09:00",
      "17:00",
    );
    pattern.workOverrides = [
      {
        date: "2026-07-18",
        work: true,
        startTime: "10:00",
        endTime: "14:00",
        reason: "Travail exceptionnel le samedi 18 juillet.",
      },
    ];

    const status = resolveWorkStatusForDate({
      date: "2026-07-18",
      fixedWorkDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      workSchedulePattern: pattern,
    });

    expect(status.isWorkDay).toBe(true);
    expect(status.isExceptional).toBe(true);
    expect(status.startTime).toBe("10:00");
  });

  it("G. vacances écrasant un jour travaillé", () => {
    const status = resolveWorkStatusForDate({
      date: "2026-07-14",
      fixedWorkDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      contextPeriods: [makeVacationPeriod("2026-07-10", "2026-07-20")],
    });
    expect(status.isWorkDay).toBe(false);
    expect(status.source).toBe("vacation");
  });

  it("H. reprise correcte du cycle après vacances", () => {
    const weekWork = emptyWeekPattern();
    setDayWork(weekWork, ["saturday"]);
    const pattern = buildCyclePattern({
      weeks: [weekWork, emptyWeekPattern()],
      effectiveFrom: "2026-06-01",
      referenceWeek: "2026-06-01",
    });

    const afterVacation = resolveWorkStatusForDate({
      date: "2026-07-25",
      fixedWorkDays: [],
      workSchedulePattern: pattern,
      contextPeriods: [makeVacationPeriod("2026-07-10", "2026-07-20")],
    });

    expect(afterVacation.isWorkDay).toBe(false);
    expect(afterVacation.cycleWeek).toBe(1);
  });

  it("I. même statut dans calendrier et planning", () => {
    const pattern = buildCyclePattern({
      weeks: [setDayWork(emptyWeekPattern(), ["saturday"]), emptyWeekPattern()],
      effectiveFrom: "2026-07-06",
      referenceWeek: "2026-07-06",
    });

    const calendar = resolveCalendarDayStatus({
      date: "2026-07-11",
      workDays: [],
      workSchedulePattern: pattern,
    });
    const work = resolveWorkStatusForDate({
      date: "2026-07-11",
      fixedWorkDays: [],
      workSchedulePattern: pattern,
    });

    expect(calendar.status).toBe("workday");
    expect(work.isWorkDay).toBe(true);
  });

  it("J. trajet + travail + trajet sur jour travaillé", () => {
    const { constraints } = buildDayConstraints({
      date: "2026-07-13",
      context: {
        ...basePlanningContext,
        workSchedulePattern: createDefaultFixedPattern(
          basePlanningContext.profile.workDays,
          "09:00",
          "17:00",
        ),
      },
    });

    const types = constraints.map((item) => item.type);
    expect(types).toContain("commute_out");
    expect(types).toContain("work");
    expect(types).toContain("commute_in");
  });

  it("K. repos visible sur jour compensateur", () => {
    const weekWork = emptyWeekPattern();
    setDayWork(weekWork, ["saturday"]);
    const pattern = buildCyclePattern({
      weeks: [weekWork, emptyWeekPattern()],
      effectiveFrom: "2026-07-06",
      referenceWeek: "2026-07-06",
      compensatoryRules: [{ whenWorkWeekday: "saturday", restWeekday: "tuesday" }],
    });

    const { constraints } = buildDayConstraints({
      date: "2026-07-14",
      context: {
        ...basePlanningContext,
        workSchedulePattern: pattern,
      },
    });

    expect(constraints.some((item) => item.title === "Journée de repos")).toBe(true);
    expect(constraints.some((item) => item.type === "work")).toBe(false);
    expect(constraints.some((item) => item.type === "commute_out")).toBe(false);
  });
});

describe("Sprint 4.2 — sidebar", () => {
  it("L. sidebar ouverte — classes et toggle", () => {
    const sidebar = readSrc("components/navigation/AppSidebar.tsx");
    const shell = readSrc("components/navigation/AppShell.tsx");
    expect(sidebar).toContain("app-sidebar-expanded");
    expect(sidebar).toContain("app-sidebar-toggle");
    expect(shell).toContain("app-shell-sidebar-expanded");
    expect(shell).toContain("useSidebarPreferences");
  });

  it("M. sidebar compacte — mode icônes", () => {
    const css = readSrc("styles/sprint42.css");
    const sidebar = readSrc("components/navigation/AppSidebar.tsx");
    expect(css).toContain("app-sidebar-collapsed");
    expect(css).toContain("--sidebar-width-collapsed");
    expect(sidebar).toContain('title={collapsed ? item.label : undefined}');
  });

  it("N. préférence sidebar après F5", () => {
    const service = readSrc("services/layoutPreferencesService.ts");
    expect(service).toContain("sidebar_collapsed");
    expect(DEFAULT_LAYOUT_PREFERENCES.sidebarCollapsed).toBe(false);
  });
});

describe("Sprint 4.2 — saint du jour", () => {
  it("O. saint fixe du calendrier — Benoît le 11 juillet", () => {
    const info = getCatholicDayInfo("2026-07-11");
    expect(info?.saintName).toBe("Benoît");
  });

  it("P. fête liturgique mobile — Pâques 2026", () => {
    expect(computeEasterSunday(2026)).toBe("2026-04-05");
    const easter = getCatholicDayInfo("2026-04-05");
    expect(easter?.liturgicalCelebration).toBe("Pâques");

    const ashWednesday = getCatholicDayInfo("2026-02-18");
    expect(ashWednesday?.liturgicalCelebration).toBe("Mercredi des Cendres");

    const assumption = getCatholicDayInfo("2026-08-15");
    expect(assumption?.liturgicalCelebration).toBe("Assomption");
  });

  it("Q. spiritualité désactivée — préférence showSaintCalendar", () => {
    const motivation = readSrc("components/home/MotivationCard.tsx");
    const widget = readSrc("components/home/widgets/MotivationWidget.tsx");
    expect(motivation).toContain("showSaintCalendar");
    expect(widget).toContain("showSaintCalendar");
    expect(DEFAULT_LAYOUT_PREFERENCES.showSaintCalendar).toBe(true);
  });

  it("R. changement d'année — Noël", () => {
    const christmas2025 = getCatholicDayInfo("2025-12-25");
    const christmas2026 = getCatholicDayInfo("2026-12-25");
    expect(christmas2025?.liturgicalCelebration).toContain("Nativité");
    expect(christmas2026?.liturgicalCelebration).toContain("Nativité");
    expect(computeEasterSunday(2025)).toBe("2025-04-20");
    expect(computeEasterSunday(2027)).toBe("2027-03-28");
  });
});

describe("Sprint 4.2 — calendrier couleurs", () => {
  it("samedi travaillé → orange, repos compensateur → vert clair", () => {
    const weekWork = emptyWeekPattern();
    setDayWork(weekWork, ["saturday"]);
    const pattern = buildCyclePattern({
      weeks: [weekWork, emptyWeekPattern()],
      effectiveFrom: "2026-07-06",
      referenceWeek: "2026-07-06",
      compensatoryRules: [{ whenWorkWeekday: "saturday", restWeekday: "tuesday" }],
    });

    const saturday = resolveDayCellVisual("2026-07-11", {
      workDays: [],
      workSchedulePattern: pattern,
    });
    expect(saturday.type).toBe("work");

    const tuesday = resolveDayCellVisual("2026-07-14", {
      workDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      workSchedulePattern: pattern,
    });
    expect(tuesday.type).toBe("compensatory");
  });

  it("aperçu 6 semaines", () => {
    const preview = previewWorkSchedule({
      startDate: "2026-07-06",
      weekCount: 6,
      fixedWorkDays: ["monday", "friday"],
    });
    expect(preview).toHaveLength(42);
  });
});
