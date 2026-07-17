import { supabase } from "../lib/supabase/client";
import {
  formatSupabaseError,
  logSupabaseInsertPayload,
} from "../lib/supabase/formatError";
import {
  buildConstraintTimestamps,
  buildManualConstraintInsert,
  buildSportManualDetails,
} from "../lib/calendar/manualConstraint";
import { MANUAL_CONSTRAINT_SOURCE } from "../config/calendarSources";
import { MANUAL_CONSTRAINT_ITEM_TYPES } from "../config/calendarItemTypes";
import { buildValidatedCalendarInsert } from "../lib/calendar/validateCalendarInsert";
import type { ManualConstraintType } from "../config/dailyRoutineOptions";
import { getCurrentHouseholdId } from "./householdService";
import type { CalendarItemRecord } from "../types";

export {
  buildConstraintTimestamps,
  buildManualConstraintInsert,
} from "../lib/calendar/manualConstraint";

const TABLE = "calendar_items";

const CALENDAR_SELECT = `
  id,
  household_id,
  user_id,
  task_id,
  title,
  item_type,
  starts_at,
  ends_at,
  locked,
  source,
  details,
  created_at,
  updated_at
`;

import { getLocalDayBounds } from "../lib/time/dayBounds";

export async function loadManualConstraintsForDate({
  userId,
  householdId,
  date,
}: {
  userId: string;
  householdId: string;
  date: string;
}): Promise<CalendarItemRecord[]> {
  const { start, end } = getLocalDayBounds(date);

  const { data, error } = await supabase
    .from(TABLE)
    .select(CALENDAR_SELECT)
    .eq("household_id", householdId)
    .eq("user_id", userId)
    .in("item_type", [...MANUAL_CONSTRAINT_ITEM_TYPES])
    .eq("source", MANUAL_CONSTRAINT_SOURCE)
    .lte("starts_at", end)
    .gte("ends_at", start)
    .order("starts_at", { ascending: true });

  if (error) {
    throw formatSupabaseError({ table: TABLE, operation: "SELECT", error });
  }

  return data ?? [];
}

export async function createManualConstraint({
  userId,
  date,
  title,
  constraintType,
  startTime,
  endTime,
  workoutSession,
  withSession = false,
  sportType,
}: {
  userId: string;
  date: string;
  title: string;
  constraintType: ManualConstraintType;
  startTime: string;
  endTime: string;
  workoutSession?: import("../types/workoutSession").WorkoutSession | null;
  withSession?: boolean;
  sportType?: string;
}): Promise<CalendarItemRecord> {
  const householdId = await getCurrentHouseholdId(userId);
  const { startsAt, endsAt } = buildConstraintTimestamps(
    date,
    startTime,
    endTime,
  );

  const payload = buildManualConstraintInsert({
    householdId,
    userId,
    title,
    constraintType,
    startsAt,
    endsAt,
    workoutSession,
    withSession,
    sportType,
  });

  const validatedPayload = buildValidatedCalendarInsert(payload);

  logSupabaseInsertPayload(TABLE, validatedPayload);

  const { data, error } = await supabase
    .from(TABLE)
    .insert(validatedPayload)
    .select(CALENDAR_SELECT)
    .single();

  if (error) {
    console.error(`[${TABLE}] INSERT error object`, error);
    throw formatSupabaseError({ table: TABLE, operation: "INSERT", error });
  }

  return data;
}

export async function updateManualConstraint({
  constraintId,
  title,
  constraintType,
  date,
  startTime,
  endTime,
}: {
  constraintId: string;
  title: string;
  constraintType: ManualConstraintType;
  date: string;
  startTime: string;
  endTime: string;
}): Promise<CalendarItemRecord> {
  const { startsAt, endsAt } = buildConstraintTimestamps(
    date,
    startTime,
    endTime,
  );

  const updatePayload: Record<string, unknown> = {
    title: title.trim(),
    starts_at: startsAt,
    ends_at: endsAt,
    details: buildSportManualDetails({
      constraintType,
      withSession: false,
    }),
    updated_at: new Date().toISOString(),
  };

  if (constraintType === "sport") {
    updatePayload.item_type = "task";
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update(updatePayload)
    .eq("id", constraintId)
    .eq("source", MANUAL_CONSTRAINT_SOURCE)
    .select(CALENDAR_SELECT)
    .single();

  if (error) {
    throw formatSupabaseError({ table: TABLE, operation: "UPDATE", error });
  }

  return data;
}

export async function deleteManualConstraint(
  constraintId: string,
): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq("id", constraintId)
    .eq("source", MANUAL_CONSTRAINT_SOURCE);

  if (error) {
    throw formatSupabaseError({ table: TABLE, operation: "DELETE", error });
  }
}
