import { getProfileFacts, saveProfileFact } from "./profileFactsService";
import { getCurrentHouseholdId } from "./householdService";
import {
  applyHabitInsightCorrection,
  buildHabitProfileFromHistory,
} from "../ai/habits/buildHabitProfile";
import type { HabitInsight, HabitProfile } from "../types/habitProfile";
import type { CalendarItemRecord } from "../types/database";
import type { TaskActivityEventRecord } from "../types/taskActivity";
import { supabase } from "../lib/supabase/client";
import { formatSupabaseError } from "../lib/supabase/formatError";

const CORRECTION_PREFIX = "habit_correction_";

async function loadCorrections(userId: string): Promise<Record<string, HabitInsight["status"]>> {
  const facts = await getProfileFacts(userId);
  const corrections: Record<string, HabitInsight["status"]> = {};

  for (const fact of facts) {
    if (!fact.fact_key.startsWith(CORRECTION_PREFIX)) continue;
    const insightId = fact.fact_key.slice(CORRECTION_PREFIX.length);
    const value = fact.fact_value?.value;
    if (value === "confirmed" || value === "rejected" || value === "deferred") {
      corrections[insightId] = value;
    }
  }

  return corrections;
}

async function loadHistory(userId: string, days = 60): Promise<{
  calendarItems: CalendarItemRecord[];
  taskActivityEvents: TaskActivityEventRecord[];
}> {
  const householdId = await getCurrentHouseholdId(userId);
  const start = new Date();
  start.setDate(start.getDate() - days);

  const [calendarResult, eventsResult] = await Promise.all([
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

  return {
    calendarItems: (calendarResult.data ?? []) as CalendarItemRecord[],
    taskActivityEvents: (eventsResult.data ?? []) as TaskActivityEventRecord[],
  };
}

export async function loadHabitProfile(userId: string): Promise<HabitProfile> {
  const [history, corrections] = await Promise.all([
    loadHistory(userId),
    loadCorrections(userId),
  ]);

  return buildHabitProfileFromHistory({
    userId,
    calendarItems: history.calendarItems,
    taskActivityEvents: history.taskActivityEvents,
    userCorrections: corrections,
  });
}

export async function saveHabitInsightFeedback({
  userId,
  insightId,
  status,
}: {
  userId: string;
  insightId: string;
  status: "confirmed" | "rejected" | "deferred";
}): Promise<HabitProfile> {
  const householdId = await getCurrentHouseholdId(userId);
  await saveProfileFact({
    householdId,
    userId,
    factKey: `${CORRECTION_PREFIX}${insightId}`,
    value: status,
  });

  const profile = await loadHabitProfile(userId);
  return applyHabitInsightCorrection(profile, insightId, status);
}
