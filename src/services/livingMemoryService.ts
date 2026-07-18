import { getProfileFacts, saveProfileFact } from "./profileFactsService";
import { getCurrentHouseholdId } from "./householdService";
import { supabase } from "../lib/supabase/client";
import { formatSupabaseError } from "../lib/supabase/formatError";
import {
  applyInsightFeedbackToLivingMemory,
  buildLivingMemory,
} from "../ai/memory/livingMemoryEngine";
import { getStatisticsForPeriod } from "../lib/statistics/getStatisticsForPeriod";
import type { CalendarItemRecord } from "../types/database";
import type { DailyCheckinRecord } from "../types/dailyCheckin";
import type { TaskActivityEventRecord } from "../types/taskActivity";
import type {
  LivingInsightStatus,
  LivingMemory,
} from "../types/livingMemory";
import type { LifeContext } from "../types/lifeContext";

const CORRECTION_PREFIX = "habit_correction_";
const INSIGHT_META_PREFIX = "living_insight_meta_";

async function loadCorrections(
  userId: string,
): Promise<Record<string, LivingInsightStatus>> {
  const facts = await getProfileFacts(userId);
  const corrections: Record<string, LivingInsightStatus> = {};

  for (const fact of facts) {
    if (!fact.fact_key.startsWith(CORRECTION_PREFIX)) continue;
    const insightId = fact.fact_key.slice(CORRECTION_PREFIX.length);
    const value = fact.fact_value?.value;
    if (
      value === "confirmed" ||
      value === "rejected" ||
      value === "deferred"
    ) {
      corrections[insightId] = value;
    }
  }

  return corrections;
}

async function loadInsightMeta(
  userId: string,
): Promise<Record<string, { firstSeen?: string; lastConfirmed?: string }>> {
  const facts = await getProfileFacts(userId);
  const meta: Record<string, { firstSeen?: string; lastConfirmed?: string }> =
    {};

  for (const fact of facts) {
    if (!fact.fact_key.startsWith(INSIGHT_META_PREFIX)) continue;
    const insightId = fact.fact_key.slice(INSIGHT_META_PREFIX.length);
    const value = fact.fact_value?.value;
    if (typeof value === "string") {
      try {
        meta[insightId] = JSON.parse(value) as {
          firstSeen?: string;
          lastConfirmed?: string;
        };
      } catch {
        // ignore invalid meta
      }
    }
  }

  return meta;
}

async function loadHistory(userId: string, days = 60): Promise<{
  calendarItems: CalendarItemRecord[];
  taskActivityEvents: TaskActivityEventRecord[];
  checkins: DailyCheckinRecord[];
  accountAgeDays: number;
}> {
  const householdId = await getCurrentHouseholdId(userId);
  const start = new Date();
  start.setDate(start.getDate() - days);

  const [calendarResult, eventsResult, checkinsResult, profileResult] =
    await Promise.all([
      supabase
        .from("calendar_items")
        .select("*")
        .eq("household_id", householdId)
        .eq("user_id", userId)
        .gte("starts_at", start.toISOString()),
      supabase
        .from("task_activity_events")
        .select("*")
        .eq("household_id", householdId)
        .eq("user_id", userId)
        .gte("occurred_at", start.toISOString()),
      supabase
        .from("daily_checkins")
        .select("*")
        .eq("user_id", userId)
        .gte("checkin_date", start.toISOString().slice(0, 10)),
      supabase.from("profiles").select("created_at").eq("id", userId).maybeSingle(),
    ]);

  if (calendarResult.error) {
    throw formatSupabaseError({
      table: "calendar_items",
      operation: "SELECT",
      error: calendarResult.error,
    });
  }

  if (eventsResult.error) {
    throw formatSupabaseError({
      table: "task_activity_events",
      operation: "SELECT",
      error: eventsResult.error,
    });
  }

  if (checkinsResult.error) {
    throw formatSupabaseError({
      table: "daily_checkins",
      operation: "SELECT",
      error: checkinsResult.error,
    });
  }

  const createdAt = profileResult.data?.created_at;
  const accountAgeDays = createdAt
    ? Math.max(
        0,
        Math.floor(
          (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24),
        ),
      )
    : 0;

  return {
    calendarItems: (calendarResult.data ?? []) as CalendarItemRecord[],
    taskActivityEvents: (eventsResult.data ?? []) as TaskActivityEventRecord[],
    checkins: (checkinsResult.data ?? []) as DailyCheckinRecord[],
    accountAgeDays,
  };
}

export async function loadLivingMemory({
  userId,
  referenceDate,
  lifeContext = null,
  studyWeeklyHours,
}: {
  userId: string;
  referenceDate: string;
  lifeContext?: LifeContext | null;
  studyWeeklyHours?: number;
}): Promise<LivingMemory> {
  const [history, corrections, insightMeta] = await Promise.all([
    loadHistory(userId),
    loadCorrections(userId),
    loadInsightMeta(userId),
  ]);

  const statistics = getStatisticsForPeriod({
    referenceDate,
    period: "week",
    calendarItems: history.calendarItems,
    taskActivityEvents: history.taskActivityEvents,
    checkins: history.checkins,
    studyWeeklyHours,
  });

  return buildLivingMemory({
    userId,
    referenceDate,
    calendarItems: history.calendarItems,
    taskActivityEvents: history.taskActivityEvents,
    checkins: history.checkins,
    statistics,
    lifeContext,
    userCorrections: corrections,
    insightMeta,
    accountAgeDays: history.accountAgeDays,
  });
}

export async function saveLivingInsightFeedback({
  userId,
  insightId,
  status,
  memory,
}: {
  userId: string;
  insightId: string;
  status: LivingInsightStatus;
  memory: LivingMemory;
}): Promise<LivingMemory> {
  const householdId = await getCurrentHouseholdId(userId);
  const now = new Date().toISOString();
  const existingInsight = memory.insights.find(
    (insight) => insight.id === insightId,
  );

  await saveProfileFact({
    householdId,
    userId,
    factKey: `${CORRECTION_PREFIX}${insightId}`,
    value: status,
  });

  await saveProfileFact({
    householdId,
    userId,
    factKey: `${INSIGHT_META_PREFIX}${insightId}`,
    value: JSON.stringify({
      firstSeen: existingInsight?.firstSeen ?? now,
      lastConfirmed:
        status === "confirmed" ? now : existingInsight?.lastConfirmed,
    }),
  });

  return applyInsightFeedbackToLivingMemory(memory, insightId, status);
}

export { buildLivingMemory } from "../ai/memory/livingMemoryEngine";
