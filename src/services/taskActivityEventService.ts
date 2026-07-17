import type {
  TaskActivityEventRecord,
  TaskActivityEventType,
} from "../types/taskActivity";
import { supabase } from "../lib/supabase/client";
import { getLocalDayBounds } from "../lib/time/dayBounds";
import { getLocalWeekBounds } from "../lib/time/weekBounds";
import { formatSupabaseError } from "../lib/supabase/formatError";
import { getCurrentHouseholdId } from "./householdService";

const TABLE = "task_activity_events";

export async function loadTaskActivityEventsForDate({
  userId,
  householdId,
  date,
}: {
  userId: string;
  householdId: string;
  date: string;
}): Promise<TaskActivityEventRecord[]> {
  const { start, end } = getLocalDayBounds(date);

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("household_id", householdId)
    .eq("user_id", userId)
    .gte("occurred_at", start)
    .lte("occurred_at", end)
    .order("occurred_at", { ascending: false });

  if (error) {
    throw formatSupabaseError({ table: TABLE, operation: "SELECT", error });
  }

  return (data ?? []) as TaskActivityEventRecord[];
}

export async function loadTaskActivityEventsForWeek({
  userId,
  householdId,
  referenceDate,
}: {
  userId: string;
  householdId: string;
  referenceDate: string;
}): Promise<TaskActivityEventRecord[]> {
  const { start, end } = getLocalWeekBounds(referenceDate);

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("household_id", householdId)
    .eq("user_id", userId)
    .gte("occurred_at", start)
    .lte("occurred_at", end)
    .order("occurred_at", { ascending: false });

  if (error) {
    throw formatSupabaseError({ table: TABLE, operation: "SELECT", error });
  }

  return (data ?? []) as TaskActivityEventRecord[];
}

export async function recordTaskActivityEvent({
  userId,
  taskId,
  calendarItemId,
  eventType,
  metadata = {},
  occurredAt,
}: {
  userId: string;
  taskId?: string | null;
  calendarItemId?: string | null;
  eventType: TaskActivityEventType;
  metadata?: Record<string, unknown>;
  occurredAt?: string;
}): Promise<void> {
  const householdId = await getCurrentHouseholdId(userId).catch(() => null);
  if (!householdId) return;

  const { error } = await supabase.from(TABLE).insert({
    household_id: householdId,
    user_id: userId,
    task_id: taskId ?? null,
    calendar_item_id: calendarItemId ?? null,
    event_type: eventType,
    occurred_at: occurredAt ?? new Date().toISOString(),
    metadata,
  });

  if (error) {
    throw formatSupabaseError({ table: TABLE, operation: "INSERT", error });
  }
}
