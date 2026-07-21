import { supabase } from "../lib/supabase/client";
import { formatSupabaseError } from "../lib/supabase/formatError";
import { getDiscoveryProgressSummary } from "../lib/navigation/progressChecks";
import { aggregateBehaviorSignals } from "../ai/core/aggregateBehaviorSignals";
import { buildLanguageMemoryContext } from "../ai/core/buildLanguageMemoryContext";
import type { LanguageMemoryContext } from "../ai/core/buildLanguageMemoryContext";
import { loadHouseholdMemoryContext } from "./memoryContextService";
import { loadLivingMemory } from "./livingMemoryService";
import { getCurrentHouseholdId } from "./householdService";
import type { LifeContext } from "../types/lifeContext";
import type { TaskActivityEventRecord } from "../types/taskActivity";

const EVENTS_TABLE = "task_activity_events";

async function loadRecentTaskActivityEvents(
  userId: string,
  days = 30,
): Promise<TaskActivityEventRecord[]> {
  const householdId = await getCurrentHouseholdId(userId);
  const start = new Date();
  start.setDate(start.getDate() - days);

  const { data, error } = await supabase
    .from(EVENTS_TABLE)
    .select(
      "id, household_id, user_id, task_id, calendar_item_id, event_type, occurred_at, metadata, created_at",
    )
    .eq("household_id", householdId)
    .eq("user_id", userId)
    .gte("occurred_at", start.toISOString())
    .order("occurred_at", { ascending: false });

  if (error) {
    throw formatSupabaseError({ table: EVENTS_TABLE, operation: "SELECT", error });
  }

  return data ?? [];
}

export async function loadLanguageMemoryContext({
  userId,
  referenceDate,
  lifeContext = null,
}: {
  userId: string;
  referenceDate: string;
  lifeContext?: LifeContext | null;
}): Promise<LanguageMemoryContext> {
  try {
    const [householdContext, livingMemory, events] = await Promise.all([
      loadHouseholdMemoryContext(userId),
      loadLivingMemory({ userId, referenceDate, lifeContext }).catch(() => null),
      loadRecentTaskActivityEvents(userId).catch(() => [] as TaskActivityEventRecord[]),
    ]);

    const discovery = getDiscoveryProgressSummary(householdContext.facts);
    const behavior = aggregateBehaviorSignals({
      events,
      referenceDate,
    });

    return buildLanguageMemoryContext({
      userId,
      referenceDate,
      baseProfile: householdContext.baseProfile,
      profile: householdContext.profile,
      onboardingCompleted:
        householdContext.userProfile?.onboarding_completed ?? false,
      discovery,
      living: livingMemory
        ? {
            knowledgeLevel: livingMemory.knowledgeLevel,
            globalConfidence: livingMemory.globalConfidence,
            coachPersonality: livingMemory.coachPersonality,
            insights: livingMemory.insights,
            dailyMissionTitle: livingMemory.dailyMission?.title ?? null,
            dailyMissionDescription: livingMemory.dailyMission?.description ?? null,
          }
        : null,
      behavior: behavior.counts.total > 0 ? behavior : null,
    });
  } catch {
    return buildLanguageMemoryContext({
      userId,
      referenceDate,
      baseProfile: {
        workSchedule: {},
        sleepSchedule: {},
      },
      profile: {
        eveningRoutine: [],
        workDays: [],
        procrastinationCauses: [],
        sleepProblems: [],
        sportInterests: [],
        sportMusic: [],
        restPreferences: [],
        faithContent: [],
        spiritualThemesAvoid: [],
      },
      onboardingCompleted: false,
      discovery: {
        percentage: 0,
        answeredCount: 0,
        applicableCount: 0,
        remainingCount: 0,
        isComplete: false,
      },
      living: null,
      behavior: null,
    });
  }
}
