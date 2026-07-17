import { supabase } from "../lib/supabase/client";
import { formatSupabaseError } from "../lib/supabase/formatError";
import type { ChildRoutineInput, ChildRoutineRecord } from "../types/childRoutine";
import { getCurrentHouseholdId } from "./householdService";

const TABLE = "child_routines";

const ROUTINE_SELECT = `
  id,
  child_id,
  household_id,
  bedtime_weekday,
  bedtime_weekend,
  evening_routine_minutes,
  wake_time,
  school_days,
  created_at,
  updated_at
`;

function normalizeTime(value: string | null): string | null {
  if (!value) return null;
  return value.slice(0, 5);
}

export async function loadChildRoutinesByHousehold(
  householdId: string,
): Promise<ChildRoutineRecord[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select(ROUTINE_SELECT)
    .eq("household_id", householdId);

  if (error) {
    throw formatSupabaseError({ table: TABLE, operation: "SELECT", error });
  }

  return (data ?? []).map((row) => ({
    ...row,
    bedtime_weekday: normalizeTime(row.bedtime_weekday),
    bedtime_weekend: normalizeTime(row.bedtime_weekend),
    wake_time: normalizeTime(row.wake_time),
  }));
}

export async function upsertChildRoutine({
  userId,
  routine,
}: {
  userId: string;
  routine: ChildRoutineInput;
}): Promise<ChildRoutineRecord> {
  const householdId = await getCurrentHouseholdId(userId);

  const { data, error } = await supabase
    .from(TABLE)
    .upsert(
      {
        child_id: routine.childId,
        household_id: householdId,
        bedtime_weekday: routine.bedtimeWeekday || null,
        bedtime_weekend: routine.bedtimeWeekend || null,
        evening_routine_minutes: routine.eveningRoutineMinutes ?? null,
        wake_time: routine.wakeTime || null,
        school_days: routine.schoolDays ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "child_id" },
    )
    .select(ROUTINE_SELECT)
    .single();

  if (error) {
    throw formatSupabaseError({ table: TABLE, operation: "UPSERT", error });
  }

  return {
    ...data,
    bedtime_weekday: normalizeTime(data.bedtime_weekday),
    bedtime_weekend: normalizeTime(data.bedtime_weekend),
    wake_time: normalizeTime(data.wake_time),
  };
}

export async function upsertChildRoutinesBatch({
  userId,
  routines,
}: {
  userId: string;
  routines: ChildRoutineInput[];
}): Promise<void> {
  for (const routine of routines) {
    await upsertChildRoutine({ userId, routine });
  }
}
