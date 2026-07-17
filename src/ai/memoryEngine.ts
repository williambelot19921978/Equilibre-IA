import type { ChildRecord, ProfileFactRecord, ProfileRecord } from "../types";
import type { ChildRoutineRecord, HouseholdEveningSettings } from "../types/childRoutine";
import type { ResolvedFamilyContext } from "../types/familyContext";
import type { WorkSchedulePatternData } from "../types/workSchedule";
import { calculateDiscoveryProgress } from "../lib/navigation/progressChecks";
import type { MealSettings } from "../types/mealSettings";
import { DEFAULT_MEAL_SETTINGS } from "../types/mealSettings";
import type { SportPreferences } from "../types/sportPreferences";
import { DEFAULT_SPORT_PREFERENCES } from "../types/sportPreferences";
import { DEFAULT_EVENING_PLANNING_MODE } from "../types/eveningPlanning";

type FactValue = string | number | string[] | null | undefined;

export type BaseProfileMemory = {
  partnerName?: string | null;
  workSchedule: {
    start?: string | null;
    end?: string | null;
  };
  sleepSchedule: {
    wakeTime?: string | null;
    bedTime?: string | null;
  };
  mainPriority?: string | null;
};

export type HouseholdMemoryContext = {
  householdId: string | null;
  children: ChildRecord[];
  facts: ProfileFactRecord[];
  baseProfile: BaseProfileMemory;
  userProfile: Pick<ProfileRecord, "onboarding_completed"> | null;
  profile: MemoryProfile;
  childRoutines: ChildRoutineRecord[];
  householdEvening: HouseholdEveningSettings;
  familyContextPeriods: import("../types/familyContext").FamilyContextPeriodRecord[];
};

/** Contexte structuré pour le Planning Engine (Sprint 1). */
export type PlanningContext = {
  householdId: string;
  children: ChildRecord[];
  childrenCount: number;
  wakeTime: string | null;
  bedTime: string | null;
  workStart: string | null;
  workEnd: string | null;
  mainPriority: string | null;
  onboardingCompleted: boolean;
  profile: MemoryProfile;
  childRoutines: ChildRoutineRecord[];
  householdEvening: HouseholdEveningSettings;
  familyContext: ResolvedFamilyContext;
  familyContextPeriods: import("../types/familyContext").FamilyContextPeriodRecord[];
  workSchedulePattern?: WorkSchedulePatternData | null;
  eveningPlanningMode?: import("../types/eveningPlanning").EveningPlanningMode;
  mealSettings?: MealSettings;
  sportSettings?: SportPreferences;
  dailyCheckin?: import("../types/dailyCheckin").DailyCheckinRecord | null;
  targetDate: string;
  currentUserId: string;
  lifeContext?: import("../types/lifeContext").LifeContext;
};

export type MemoryProfile = {
  morningResponsibility?: string;
  morningDurationMinutes?: number;
  personalPrepMinutes?: number;
  childrenDepartureTime?: string;
  eveningRoutine: string[];
  workDays: string[];
  commuteMinutes?: number;
  afterWorkEnergy?: string;
  studiesActive?: boolean;
  studyWeeklyHours?: number;
  studyBestPeriod?: string;
  procrastinationCauses: string[];
  preferredFocusMinutes?: number;
  sleepNeededHours?: number;
  sleepProblems: string[];
  sportInterests: string[];
  sportMinimumMinutes?: number;
  sportMusic: string[];
  restPreferences: string[];
  faithImportance?: string;
  faithContent: string[];
  spiritualFrequency?: string;
  spiritualPreferredDuration?: number;
  spiritualPreferredMoment?: string;
  spiritualThemesAvoid: string[];
  spiritualShowOnHome?: string;
};

export type MemoryInsight = {
  id: string;
  category:
    | "family"
    | "work"
    | "studies"
    | "sleep"
    | "sport"
    | "rest"
    | "spirituality";
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
};

function getFactValue(
  facts: ProfileFactRecord[],
  key: string,
): FactValue {
  return facts.find((fact) => fact.fact_key === key)?.fact_value
    ?.value as FactValue;
}

function getString(
  facts: ProfileFactRecord[],
  key: string,
): string | undefined {
  const value = getFactValue(facts, key);
  return typeof value === "string" ? value : undefined;
}

function getNumber(
  facts: ProfileFactRecord[],
  key: string,
): number | undefined {
  const value = getFactValue(facts, key);

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function getArray(
  facts: ProfileFactRecord[],
  key: string,
): string[] {
  const value = getFactValue(facts, key);

  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function getFactObject(
  facts: ProfileFactRecord[],
  key: string,
): ProfileFactRecord["fact_value"] | undefined {
  return facts.find((fact) => fact.fact_key === key)?.fact_value;
}

export function buildBaseProfileMemory(
  facts: ProfileFactRecord[],
): BaseProfileMemory {
  const partnerFact = getFactObject(facts, "partner_name");
  const workFact = getFactObject(facts, "work_schedule");
  const sleepFact = getFactObject(facts, "sleep_schedule");
  const priorityFact = getFactObject(facts, "main_priority");

  return {
    partnerName:
      typeof partnerFact?.value === "string" ? partnerFact.value : null,
    workSchedule: {
      start: typeof workFact?.start === "string" ? workFact.start : null,
      end: typeof workFact?.end === "string" ? workFact.end : null,
    },
    sleepSchedule: {
      wakeTime:
        typeof sleepFact?.wake_time === "string" ? sleepFact.wake_time : null,
      bedTime:
        typeof sleepFact?.bed_time === "string" ? sleepFact.bed_time : null,
    },
    mainPriority:
      typeof priorityFact?.value === "string" ? priorityFact.value : null,
  };
}

export function buildHouseholdEveningSettings(
  facts: ProfileFactRecord[],
): HouseholdEveningSettings {
  const startFact = getFactObject(facts, "evening_routine_start");
  const managerFact = getFactObject(facts, "evening_routine_manager");
  const avgFact = getFactObject(facts, "average_evening_routine_minutes");

  const avgValue = avgFact?.value;
  const averageEveningRoutineMinutes =
    typeof avgValue === "number"
      ? avgValue
      : typeof avgValue === "string" && Number.isFinite(Number(avgValue))
        ? Number(avgValue)
        : null;

  return {
    eveningRoutineStart:
      typeof startFact?.value === "string" ? startFact.value : null,
    eveningRoutineManager:
      typeof managerFact?.value === "string" ? managerFact.value : null,
    averageEveningRoutineMinutes,
  };
}

export function buildHouseholdMemoryContext({
  facts,
  children,
  householdId,
  userProfile,
  childRoutines = [],
  householdEvening,
  familyContextPeriods = [],
}: {
  facts: ProfileFactRecord[];
  children: ChildRecord[];
  householdId: string | null;
  userProfile: Pick<ProfileRecord, "onboarding_completed"> | null;
  childRoutines?: ChildRoutineRecord[];
  householdEvening?: HouseholdEveningSettings;
  familyContextPeriods?: import("../types/familyContext").FamilyContextPeriodRecord[];
}): HouseholdMemoryContext {
  return {
    householdId,
    children,
    facts,
    baseProfile: buildBaseProfileMemory(facts),
    userProfile,
    profile: buildMemoryProfile(facts),
    childRoutines,
    householdEvening: householdEvening ?? buildHouseholdEveningSettings(facts),
    familyContextPeriods,
  };
}

export function buildPlanningContext(
  context: HouseholdMemoryContext,
  {
    targetDate,
    currentUserId,
    familyContext,
    workSchedulePattern,
    eveningPlanningMode = DEFAULT_EVENING_PLANNING_MODE,
    mealSettings = DEFAULT_MEAL_SETTINGS,
    sportSettings = DEFAULT_SPORT_PREFERENCES,
    dailyCheckin = null,
  }: {
    targetDate: string;
    currentUserId: string;
    familyContext: ResolvedFamilyContext;
    workSchedulePattern?: WorkSchedulePatternData | null;
    eveningPlanningMode?: import("../types/eveningPlanning").EveningPlanningMode;
    mealSettings?: MealSettings;
    sportSettings?: SportPreferences;
    dailyCheckin?: import("../types/dailyCheckin").DailyCheckinRecord | null;
  },
): PlanningContext | null {
  if (!context.householdId) {
    return null;
  }

  return {
    householdId: context.householdId,
    children: context.children,
    childrenCount: context.children.length,
    wakeTime: context.baseProfile.sleepSchedule.wakeTime ?? null,
    bedTime: context.baseProfile.sleepSchedule.bedTime ?? null,
    workStart: context.baseProfile.workSchedule.start ?? null,
    workEnd: context.baseProfile.workSchedule.end ?? null,
    mainPriority: context.baseProfile.mainPriority ?? null,
    onboardingCompleted: context.userProfile?.onboarding_completed ?? false,
    profile: context.profile,
    childRoutines: context.childRoutines,
    householdEvening: context.householdEvening,
    familyContext,
    familyContextPeriods: context.familyContextPeriods,
    workSchedulePattern,
    eveningPlanningMode,
    mealSettings,
    sportSettings,
    dailyCheckin,
    targetDate,
    currentUserId,
  };
}

export function getWakeTime(context: PlanningContext): string {
  return context.wakeTime ?? "07:00";
}

export function getBedTime(context: PlanningContext): string {
  return context.bedTime ?? "22:00";
}

export function getWorkHours(
  context: PlanningContext,
): { start: string | null; end: string | null } {
  return {
    start: context.workStart,
    end: context.workEnd,
  };
}

export function buildMemoryProfile(
  facts: ProfileFactRecord[],
): MemoryProfile {
  return {
    morningResponsibility: getString(
      facts,
      "morning_children_responsibility",
    ),
    morningDurationMinutes: getNumber(
      facts,
      "morning_children_duration",
    ),
    personalPrepMinutes: getNumber(facts, "personal_prep_duration"),
    childrenDepartureTime: getString(
      facts,
      "children_departure_time",
    ),
    eveningRoutine: getArray(
      facts,
      "children_evening_routine",
    ),
    workDays: getArray(facts, "work_days"),
    commuteMinutes: getNumber(facts, "commute_duration"),
    afterWorkEnergy: getString(facts, "after_work_energy"),
    studiesActive:
      getString(facts, "studies_active") === "yes",
    studyWeeklyHours: getNumber(
      facts,
      "study_weekly_target",
    ),
    studyBestPeriod: getString(
      facts,
      "study_best_period",
    ),
    procrastinationCauses: getArray(
      facts,
      "procrastination_cause",
    ),
    preferredFocusMinutes: getNumber(
      facts,
      "preferred_focus_duration",
    ),
    sleepNeededHours: getNumber(
      facts,
      "sleep_needed_hours",
    ),
    sleepProblems: getArray(facts, "sleep_main_problem"),
    sportInterests: getArray(facts, "sport_interest"),
    sportMinimumMinutes: getNumber(
      facts,
      "sport_minimum_duration",
    ),
    sportMusic: getArray(
      facts,
      "sport_music_preference",
    ),
    restPreferences: getArray(facts, "rest_preference"),
    faithImportance: getString(facts, "faith_importance"),
    faithContent: getArray(
      facts,
      "faith_content_preferences",
    ),
    spiritualFrequency: getString(facts, "spiritual_frequency"),
    spiritualPreferredDuration: getNumber(
      facts,
      "spiritual_preferred_duration",
    ),
    spiritualPreferredMoment: getString(facts, "spiritual_preferred_moment"),
    spiritualThemesAvoid: getArray(facts, "spiritual_themes_avoid"),
    spiritualShowOnHome: getString(facts, "spiritual_show_on_home"),
  };
}

export function generateMemoryInsights(
  profile: MemoryProfile,
): MemoryInsight[] {
  const insights: MemoryInsight[] = [];

  if (
    profile.morningDurationMinutes &&
    profile.morningDurationMinutes >= 45
  ) {
    insights.push({
      id: "protect-children-morning",
      category: "family",
      title: "Protéger la routine du matin",
      description: `La préparation des enfants prend environ ${profile.morningDurationMinutes} minutes. Ce temps devra être bloqué avant toute autre activité.`,
      priority: "high",
    });
  }

  if (
    profile.afterWorkEnergy === "low" &&
    profile.studiesActive
  ) {
    insights.push({
      id: "avoid-study-after-work",
      category: "studies",
      title: "Éviter les longues révisions après le travail",
      description:
        "Ton énergie est souvent basse après le travail. Les séances de formation devront plutôt être placées le matin ou pendant un jour de repos.",
      priority: "high",
    });
  }

  if (
    profile.studyWeeklyHours &&
    profile.preferredFocusMinutes
  ) {
    const weeklyMinutes = profile.studyWeeklyHours * 60;
    const sessions = Math.ceil(
      weeklyMinutes / profile.preferredFocusMinutes,
    );

    insights.push({
      id: "study-session-splitting",
      category: "studies",
      title: "Découper la formation",
      description: `Ton objectif correspond à environ ${sessions} séances de ${profile.preferredFocusMinutes} minutes par semaine.`,
      priority: "medium",
    });
  }

  if (
    profile.procrastinationCauses.includes("too_long") ||
    profile.procrastinationCauses.includes("unclear_start")
  ) {
    insights.push({
      id: "reduce-task-entry",
      category: "studies",
      title: "Commencer par une très petite étape",
      description:
        "Les tâches longues ou mal définies favorisent la procrastination. L’application proposera d’abord une action de 5 à 15 minutes.",
      priority: "high",
    });
  }

  if (
    profile.sleepProblems.includes("late_tasks") ||
    profile.sleepProblems.includes("late_bedtime")
  ) {
    insights.push({
      id: "protect-bedtime",
      category: "sleep",
      title: "Protéger l’heure du coucher",
      description:
        "Les tâches tardives perturbent ton sommeil. Les activités non urgentes devront être reportées plutôt que prolongées le soir.",
      priority: "high",
    });
  }

  if (profile.sportMinimumMinutes) {
    insights.push({
      id: "micro-sport",
      category: "sport",
      title: "Utiliser les petits créneaux",
      description: `Même les journées chargées pourront intégrer une séance de ${profile.sportMinimumMinutes} minutes.`,
      priority: "medium",
    });
  }

  if (profile.restPreferences.length > 0) {
    insights.push({
      id: "personalized-rest",
      category: "rest",
      title: "Préparer un repos adapté",
      description:
        "Lorsqu’une pause sera nécessaire, l’application proposera une ambiance Spotify correspondant à tes préférences.",
      priority: "medium",
    });
  }

  if (
    profile.faithImportance &&
    profile.faithImportance !== "disabled"
  ) {
    insights.push({
      id: "faith-support",
      category: "spirituality",
      title: "Intégrer la spiritualité avec discrétion",
      description:
        "Des encouragements chrétiens pourront être proposés aux moments appropriés, selon les préférences choisies.",
      priority: "low",
    });
  }

  return insights;
}

export function calculateKnowledgeProgress(
  facts: ProfileFactRecord[],
  _totalQuestions?: number,
): number {
  return calculateDiscoveryProgress(facts);
}