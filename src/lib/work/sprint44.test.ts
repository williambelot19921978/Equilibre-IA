import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { buildDayConstraints } from "../../ai/planningEngine";
import type { PlanningContext } from "../../ai/memoryEngine";
import { resolveEveningOpportunity } from "../../ai/eveningOpportunityEngine";
import {
  generateWorkoutSession,
  isIntenseSportBlocked,
} from "../../ai/sportSessionGenerator";
import {
  buildRecoveryMessage,
  isNonPunitiveWording,
  resolveRecoveryRecommendation,
} from "../../ai/recoveryPriorityEngine";
import { placeBreakfast, placeDinner } from "../planning/mealPlacement";
import { DEFAULT_HOME_PREFERENCES } from "../../types/homePreferences";
import { DEFAULT_MEAL_SETTINGS } from "../../types/mealSettings";
import type { ResolvedFamilyContext } from "../../types/familyContext";
import { combineDateAndTime } from "../time/daySchedule";
import { resolveBedWindDownEnd } from "../time/bedTime";
import { isHardConstraint } from "../planning/blockActionHelpers";

const root = join(process.cwd(), "src");
const date = "2026-07-13";

function readSrc(fragment: string): string {
  return readFileSync(join(root, fragment), "utf8");
}

function makeFamilyContext(): ResolvedFamilyContext {
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
    eveningRoutine: [],
    workDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    commuteMinutes: 30,
    afterWorkEnergy: "low",
    studiesActive: true,
    preferredFocusMinutes: 25,
    procrastinationCauses: [],
    sleepProblems: [],
    sportInterests: [],
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
  mealSettings: DEFAULT_MEAL_SETTINGS,
};

describe("Sprint 4.4 — accueil et calendrier", () => {
  it("A. calendrier absent du centre par défaut", () => {
    expect(DEFAULT_HOME_PREFERENCES.visibleWidgets).not.toContain("calendar");
  });

  it("B. calendrier en drawer par défaut", () => {
    expect(DEFAULT_HOME_PREFERENCES.calendarWidgetPosition).toBe("drawer");
    const home = readSrc("pages/HomePage.tsx");
    expect(home).not.toContain("HeaderCalendarWidget");
  });

  it("C. calendrier drawer — toujours dans le menu", () => {
    expect(DEFAULT_HOME_PREFERENCES.calendarWidgetPositionMobile).toBe("drawer");
    const drawer = readSrc("components/navigation/DrawerCalendarSection.tsx");
    expect(drawer).toContain('variant="drawer"');
    expect(readSrc("components/navigation/AppDrawer.tsx")).toContain("DrawerCalendarSection");
  });
});

describe("Sprint 4.4 — repas", () => {
  it("D. petit déjeuner après réveil", () => {
    const breakfast = placeBreakfast({
      date,
      wakeTime: "06:30",
      morningRoutineStart: "07:00",
      settings: DEFAULT_MEAL_SETTINGS.breakfast,
    });
    expect(breakfast).not.toBeNull();
    expect(new Date(breakfast!.startsAt).getHours()).toBeGreaterThanOrEqual(6);
    expect(new Date(breakfast!.endsAt).getTime()).toBeLessThanOrEqual(
      new Date(combineDateAndTime(date, "07:00")).getTime(),
    );
  });

  it("E. dîner avant routine enfants", () => {
    const dinner = placeDinner({
      date,
      eveningRoutineStart: "19:30",
      afterWorkEnd: combineDateAndTime(date, "18:00"),
      settings: DEFAULT_MEAL_SETTINGS.dinner,
    });
    expect(dinner).not.toBeNull();
    expect(new Date(dinner!.endsAt).getTime()).toBeLessThanOrEqual(
      new Date(combineDateAndTime(date, "19:30")).getTime(),
    );
  });

  it("F. planning inclut breakfast et dinner", () => {
    const { constraints } = buildDayConstraints({ date, context: baseContext });
    expect(constraints.some((c) => c.type === "breakfast")).toBe(true);
    expect(constraints.some((c) => c.type === "dinner")).toBe(true);
  });
});

describe("Sprint 4.4 — soirée max 2 activités", () => {
  const eveningStart = combineDateAndTime(date, "20:30");
  const eveningEnd = resolveBedWindDownEnd({ date, bedTime: "00:00" });

  it("G. une activité principale", () => {
    const result = resolveEveningOpportunity({
      eveningStart,
      eveningEnd,
      workDay: true,
      restDay: false,
      energyPrediction: "low",
      afterWorkEnergy: "low",
      studiesActive: true,
      preferredFocusMinutes: 25,
      sportPossible: true,
      faithImportance: "disabled",
      restPreferences: [],
      familySituation: "normal",
      partnerPresent: true,
      eveningPlanningMode: "suggestions_only",
    });
    const activities = result.blocks.filter(
      (b) => b.type !== "keep_free" && b.type !== "wind_down",
    );
    expect(activities.length).toBeLessThanOrEqual(2);
  });

  it("H. maximum 2 activités sur créneau long", () => {
    const result = resolveEveningOpportunity({
      eveningStart,
      eveningEnd,
      workDay: false,
      restDay: true,
      energyPrediction: "medium",
      afterWorkEnergy: "medium",
      mainPriority: "rest",
      studiesActive: false,
      sportPossible: true,
      daysSinceSport: 5,
      faithImportance: "important",
      restPreferences: ["lecture"],
      familySituation: "normal",
      partnerPresent: true,
      eveningPlanningMode: "suggestions_only",
    });
    const activities = result.blocks.filter(
      (b) => b.type !== "keep_free" && b.type !== "wind_down",
    );
    expect(activities.length).toBeLessThanOrEqual(2);
  });

  it("I. temps libre conservé", () => {
    const result = resolveEveningOpportunity({
      eveningStart,
      eveningEnd,
      workDay: true,
      restDay: false,
      energyPrediction: "medium",
      afterWorkEnergy: "medium",
      sportPossible: true,
      restPreferences: [],
      familySituation: "normal",
      partnerPresent: true,
      eveningPlanningMode: "suggestions_only",
    });
    const hasExplicitFree = result.blocks.some((b) => b.type === "keep_free");
    const hasCoupleEvening = result.blocks.some((b) => b.type === "couple");
    expect(hasExplicitFree || hasCoupleEvening).toBe(true);
    expect(result.keptFreeMinutes).toBeGreaterThanOrEqual(45);
  });
});

describe("Sprint 4.4 — sport séance détaillée", () => {
  it("J. sport génère WorkoutSession", () => {
    const session = generateWorkoutSession({
      durationMinutes: 20,
      sportType: "strength",
      intensity: "moderate",
      slotHour: 18,
    });
    expect(session).not.toBeNull();
    expect(session!.warmup.length).toBeGreaterThan(0);
    expect(session!.cooldown.length).toBeGreaterThan(0);
    expect(session!.rounds?.length).toBeGreaterThan(0);
  });

  it("K. séance douce tard le soir", () => {
    expect(isIntenseSportBlocked({ hour: 21, intensity: "dynamic" })).toBe(true);
    const session = generateWorkoutSession({
      durationMinutes: 15,
      sportType: "run",
      intensity: "dynamic",
      slotHour: 21,
      afterWorkEnergy: "low",
    });
    expect(session?.intensity).toBe("gentle");
  });
});

describe("Sprint 4.4 — reprise après annulations", () => {
  it("O. 3 annulations → micro-version", () => {
    const rec = resolveRecoveryRecommendation({
      taskId: "t1",
      title: "Révision",
      category: "studies",
      skipCount: 2,
      cancellationCount: 1,
      consecutiveCancellations: 3,
      durationMinutes: 45,
      priority: 4,
    });
    expect(rec.action).toBe("micro_step");
    expect(rec.recommendedDuration).toBeLessThanOrEqual(15);
  });

  it("P. 4 annulations → question cause", () => {
    const rec = resolveRecoveryRecommendation({
      taskId: "t1",
      title: "Révision",
      category: "studies",
      skipCount: 4,
      cancellationCount: 4,
      consecutiveCancellations: 4,
      durationMinutes: 45,
      priority: 4,
    });
    expect(rec.action).toBe("clarify_blocker");
    expect(rec.blockerOptions?.length).toBeGreaterThan(0);
  });

  it("Q. pas de culpabilisation", () => {
    const rec = resolveRecoveryRecommendation({
      taskId: "t1",
      title: "Révision",
      category: "studies",
      skipCount: 5,
      cancellationCount: 5,
      consecutiveCancellations: 5,
      durationMinutes: 45,
      priority: 4,
    });
    const message = buildRecoveryMessage(rec, "Révision");
    expect(isNonPunitiveWording(message)).toBe(true);
  });
});

describe("Sprint 4.4 — actions et persistance", () => {
  it("L–N. services block actions", () => {
    const service = readSrc("services/blockActionService.ts");
    expect(service).toContain("applyBlockAction");
    expect(service).toContain("shorten_10");
    expect(service).toContain("later_today");
  });

  it("R. contraintes dures protégées", () => {
    expect(
      isHardConstraint({
        id: "work-1",
        visualType: "work",
        title: "Travail",
        startsAt: combineDateAndTime(date, "09:00"),
        endsAt: combineDateAndTime(date, "17:00"),
        locked: true,
        origin: "computed",
        blockKind: "structural",
        constraintType: "work",
      }),
    ).toBe(true);
  });

  it("S. BlockActionsMenu dans timeline", () => {
    const timeline = readSrc("components/planning/DayTimeline.tsx");
    expect(timeline).toContain("BlockActionsMenu");
    const menu = readSrc("components/planning/BlockActionsMenu.tsx");
    expect(menu).toContain("Je n'ai pas le temps");
  });

  it("T. historique task_activity_events", () => {
    const migration = readFileSync(
      join(process.cwd(), "supabase/migrations/00013_sprint44_realistic_day.sql"),
      "utf8",
    );
    expect(migration).toContain("task_activity_events");
    expect(migration).toContain("task_activity_events_insert_own");
  });

  it("U. workoutSession persisté", () => {
    const service = readSrc("services/suggestionAcceptanceService.ts");
    expect(service).toContain("workoutSession");
    const panel = readSrc("components/planning/BlockActionsMenu.tsx");
    expect(panel).toContain("Voir la séance");
  });
});
