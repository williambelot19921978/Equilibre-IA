import {
  buildHouseholdMemoryContext,
  buildPlanningContext,
  type HouseholdMemoryContext,
  type PlanningContext,
} from "../ai/memoryEngine";
import { resolveFamilyContextForDate } from "../ai/familyContextEngine";
import { enrichPlanningContextWithLife } from "../ai/lifeEngine";
import { loadChildRoutinesByHousehold } from "./childRoutineService";
import { loadFamilyContextPeriods } from "./familyContextService";
import { getChildrenByHousehold } from "./childrenService";
import { getHouseholdMembership } from "./householdService";
import { getProfileFacts } from "./profileFactsService";
import { getUserProfile } from "./profileService";
import { loadActiveWorkSchedulePattern } from "./workScheduleService";
import { loadMealSettings, loadSportSettings } from "./homePreferencesService";
import { loadDailyCheckin } from "./dailyCheckinService";
import { loadLayoutPreferences } from "./layoutPreferencesService";
import { DEFAULT_EVENING_PLANNING_MODE } from "../types/eveningPlanning";
import type { ProfileFactRecord } from "../types";

function emptyArrayOnFailure<T>(
  result: PromiseSettledResult<T>,
  label: string,
): T {
  if (result.status === "fulfilled") {
    return result.value;
  }

  console.warn(
    `[memoryContext] ${label} indisponible — poursuite avec valeur vide.`,
    result.reason,
  );

  return [] as T;
}

export async function loadHouseholdMemoryContext(
  userId: string,
): Promise<HouseholdMemoryContext> {
  const [membership, facts, userProfile] = await Promise.all([
    getHouseholdMembership(userId),
    getProfileFacts(userId),
    getUserProfile(userId),
  ]);

  if (!membership) {
    return buildHouseholdMemoryContext({
      facts,
      children: [],
      householdId: null,
      userProfile: userProfile
        ? { onboarding_completed: userProfile.onboarding_completed }
        : null,
    });
  }

  const [childrenResult, childRoutinesResult, familyContextResult] =
    await Promise.allSettled([
      getChildrenByHousehold(membership.household_id),
      loadChildRoutinesByHousehold(membership.household_id),
      loadFamilyContextPeriods(membership.household_id),
    ]);

  const children = emptyArrayOnFailure(childrenResult, "children");
  const childRoutines = emptyArrayOnFailure(
    childRoutinesResult,
    "child_routines",
  );
  const familyContextPeriods = emptyArrayOnFailure(
    familyContextResult,
    "family_context_periods",
  );

  return buildHouseholdMemoryContext({
    facts,
    children,
    householdId: membership.household_id,
    userProfile: userProfile
      ? { onboarding_completed: userProfile.onboarding_completed }
      : null,
    childRoutines,
    familyContextPeriods,
  });
}

export async function loadPlanningContextForDate({
  userId,
  date,
}: {
  userId: string;
  date: string;
}): Promise<PlanningContext | null> {
  const householdContext = await loadHouseholdMemoryContext(userId);

  if (!householdContext.householdId) {
    return null;
  }

  const familyContext = resolveFamilyContextForDate({
    periods: householdContext.familyContextPeriods,
    date,
    currentUserId: userId,
  });

  const [workSchedulePattern, layoutPreferences, mealSettings, sportSettings, dailyCheckin] =
    await Promise.all([
    loadActiveWorkSchedulePattern(userId).catch(() => null),
    loadLayoutPreferences(userId).catch(() => ({
      sidebarCollapsed: false,
      showSaintCalendar: true,
      eveningPlanningMode: DEFAULT_EVENING_PLANNING_MODE,
    })),
    loadMealSettings(userId).catch(() => undefined),
    loadSportSettings(userId).catch(() => undefined),
    loadDailyCheckin({ userId, date }).catch(() => null),
  ]);

  return buildPlanningContext(householdContext, {
    targetDate: date,
    currentUserId: userId,
    familyContext,
    workSchedulePattern,
    eveningPlanningMode: layoutPreferences.eveningPlanningMode,
    mealSettings,
    sportSettings,
    dailyCheckin,
  });
}

export async function loadPlanningContextWithLife({
  userId,
  date,
  calendarItems = [],
}: {
  userId: string;
  date: string;
  calendarItems?: import("../types").CalendarItemRecord[];
}) {
  const context = await loadPlanningContextForDate({ userId, date });

  if (!context) return null;

  return enrichPlanningContextWithLife(context, calendarItems);
}

/** Charge uniquement les facts — indépendant du calendrier et des tables Sprint 1.6. */
export async function loadProfileFactsSafe(
  userId: string,
): Promise<ProfileFactRecord[]> {
  return getProfileFacts(userId);
}
