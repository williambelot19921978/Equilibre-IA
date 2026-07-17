import { supabase } from "../lib/supabase/client";
import { getPeriodBounds, type StatisticsPeriod } from "../lib/time/periodBounds";
import { getStatisticsForPeriod } from "../lib/statistics/getStatisticsForPeriod";
import type { PeriodStatistics } from "../lib/statistics/getStatisticsForPeriod";
import {
  computeBalanceScore,
  computeStatisticsTrends,
  type StatisticsTrends,
} from "../lib/statistics/computeBalanceAndTrends";
import type { BalanceScore } from "../types/balanceScore";
import type { CalendarItemRecord } from "../types/database";
import type { TaskActivityEventRecord } from "../types/taskActivity";
import type { DailyCheckinRecord } from "../types/dailyCheckin";
import { formatSupabaseError } from "../lib/supabase/formatError";
import { getCurrentHouseholdId } from "./householdService";
import { getProfileFacts } from "./profileFactsService";
import { buildMemoryProfile } from "../ai/memoryEngine";

export type { PeriodStatistics, StatisticsPeriod };

async function loadCalendarItemsForRange({
  userId,
  householdId,
  start,
  end,
}: {
  userId: string;
  householdId: string;
  start: string;
  end: string;
}): Promise<CalendarItemRecord[]> {
  const { data, error } = await supabase
    .from("calendar_items")
    .select("*")
    .eq("household_id", householdId)
    .eq("user_id", userId)
    .gte("starts_at", start)
    .lte("starts_at", end);

  if (error) {
    throw formatSupabaseError({
      table: "calendar_items",
      operation: "SELECT",
      error,
    });
  }

  return (data ?? []) as CalendarItemRecord[];
}

async function loadTaskActivityEventsForRange({
  userId,
  householdId,
  start,
  end,
}: {
  userId: string;
  householdId: string;
  start: string;
  end: string;
}): Promise<TaskActivityEventRecord[]> {
  const { data, error } = await supabase
    .from("task_activity_events")
    .select("*")
    .eq("household_id", householdId)
    .eq("user_id", userId)
    .gte("occurred_at", start)
    .lte("occurred_at", end)
    .order("occurred_at", { ascending: false });

  if (error) {
    throw formatSupabaseError({
      table: "task_activity_events",
      operation: "SELECT",
      error,
    });
  }

  return (data ?? []) as TaskActivityEventRecord[];
}

async function loadCheckinsForRange({
  userId,
  startDate,
  endDate,
}: {
  userId: string;
  startDate: string;
  endDate: string;
}): Promise<DailyCheckinRecord[]> {
  const { data, error } = await supabase
    .from("daily_checkins")
    .select("*")
    .eq("user_id", userId)
    .gte("checkin_date", startDate)
    .lte("checkin_date", endDate)
    .order("checkin_date", { ascending: false });

  if (error) {
    throw formatSupabaseError({
      table: "daily_checkins",
      operation: "SELECT",
      error,
    });
  }

  return (data ?? []) as DailyCheckinRecord[];
}

export type EnrichedPeriodStatistics = PeriodStatistics & {
  trends: StatisticsTrends;
  balance: BalanceScore;
};

export async function loadStatisticsForPeriod({
  userId,
  referenceDate,
  period,
}: {
  userId: string;
  referenceDate: string;
  period: StatisticsPeriod;
}): Promise<EnrichedPeriodStatistics> {
  const householdId = await getCurrentHouseholdId(userId);
  const bounds = getPeriodBounds(referenceDate, period);
  const facts = await getProfileFacts(userId);
  const profile = buildMemoryProfile(facts);

  const [calendarItems, taskActivityEvents, checkins] = await Promise.all([
    loadCalendarItemsForRange({
      userId,
      householdId,
      start: bounds.start,
      end: bounds.end,
    }),
    loadTaskActivityEventsForRange({
      userId,
      householdId,
      start: bounds.start,
      end: bounds.end,
    }),
    loadCheckinsForRange({
      userId,
      startDate: bounds.start.slice(0, 10),
      endDate: bounds.end.slice(0, 10),
    }),
  ]);

  const base = getStatisticsForPeriod({
    referenceDate,
    period,
    calendarItems,
    taskActivityEvents,
    checkins,
    studyWeeklyHours: profile.studyWeeklyHours,
  });

  return {
    ...base,
    trends: computeStatisticsTrends(base),
    balance: computeBalanceScore(base),
  };
}
