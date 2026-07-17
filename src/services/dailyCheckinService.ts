import { supabase } from "../lib/supabase/client";
import { formatSupabaseError } from "../lib/supabase/formatError";
import {
  resolveCheckinPlanningImpact,
  type DailyCheckinInput,
  type DailyCheckinMood,
  type DailyCheckinRecord,
} from "../types/dailyCheckin";
import { getCurrentHouseholdId } from "./householdService";

const TABLE = "daily_checkins";

const SELECT_FIELDS =
  "id, user_id, household_id, checkin_date, energy_level, fatigue_level, stress_level, mood, intensity, note, created_at, updated_at";

function mapImpactToFields(mood: DailyCheckinMood, intensity?: number | null) {
  const impact = resolveCheckinPlanningImpact(mood, intensity);
  return {
    energy_level: impact.energyLevel,
    fatigue_level: impact.fatigueLevel,
    stress_level: impact.stressLevel,
  };
}

export async function loadDailyCheckin({
  userId,
  date,
}: {
  userId: string;
  date: string;
}): Promise<DailyCheckinRecord | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_FIELDS)
    .eq("user_id", userId)
    .eq("checkin_date", date)
    .maybeSingle();

  if (error) {
    throw formatSupabaseError({ table: TABLE, operation: "SELECT", error });
  }

  return (data as DailyCheckinRecord | null) ?? null;
}

export async function saveDailyCheckin({
  userId,
  date,
  input,
}: {
  userId: string;
  date: string;
  input: DailyCheckinInput;
}): Promise<DailyCheckinRecord> {
  const householdId = await getCurrentHouseholdId(userId).catch(() => null);
  const impactFields = mapImpactToFields(input.mood, input.intensity);

  const payload = {
    user_id: userId,
    household_id: householdId,
    checkin_date: date,
    mood: input.mood,
    intensity: input.intensity ?? null,
    note: input.note?.trim() || null,
    ...impactFields,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from(TABLE)
    .upsert(payload, { onConflict: "user_id,checkin_date" })
    .select(SELECT_FIELDS)
    .single();

  if (error) {
    throw formatSupabaseError({ table: TABLE, operation: "UPSERT", error });
  }

  return data as DailyCheckinRecord;
}

export { resolveCheckinPlanningImpact } from "../types/dailyCheckin";
