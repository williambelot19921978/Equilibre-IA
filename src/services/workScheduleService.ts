import { supabase } from "../lib/supabase/client";
import { formatSupabaseError } from "../lib/supabase/formatError";
import type {
  WorkSchedulePatternData,
  WorkSchedulePatternRecord,
  WorkPatternType,
} from "../types/workSchedule";
import { createDefaultFixedPattern } from "../types/workSchedule";
import { getCurrentHouseholdId } from "./householdService";

export { buildAlternatingWeeksPattern, buildCyclePattern } from "../lib/work/workScheduleBuilders";

const TABLE = "work_schedule_patterns";

function parseScheduleJson(raw: unknown): WorkSchedulePatternData | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as WorkSchedulePatternData;
  if (!data.patternType || !Array.isArray(data.weeklyPatterns)) return null;
  return data;
}

function recordToPatternData(
  record: WorkSchedulePatternRecord,
): WorkSchedulePatternData {
  const fromSchedule = parseScheduleJson(record.schedule);
  if (fromSchedule) return fromSchedule;

  return {
    patternType: record.pattern_type,
    effectiveFrom: record.effective_from,
    cycleLengthWeeks: record.cycle_length_weeks,
    referenceWeek: record.reference_week ?? record.effective_from,
    weeklyPatterns: [],
    compensatoryRules: record.compensatory_rules ?? [],
    defaultStartTime: "09:00",
    defaultEndTime: "17:00",
  };
}

export async function loadActiveWorkSchedulePattern(
  userId: string,
): Promise<WorkSchedulePatternData | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("user_id", userId)
    .eq("active", true)
    .maybeSingle();

  if (error) {
    throw formatSupabaseError({ table: TABLE, operation: "SELECT", error });
  }

  if (!data) return null;
  return recordToPatternData(data as WorkSchedulePatternRecord);
}

export async function saveWorkSchedulePattern({
  userId,
  name = "Mon rythme",
  pattern,
}: {
  userId: string;
  name?: string;
  pattern: WorkSchedulePatternData;
}): Promise<WorkSchedulePatternData> {
  const householdId = await getCurrentHouseholdId(userId).catch(() => null);

  await supabase
    .from(TABLE)
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("active", true);

  const payload = {
    user_id: userId,
    household_id: householdId,
    name,
    pattern_type: pattern.patternType as WorkPatternType,
    effective_from: pattern.effectiveFrom,
    cycle_length_weeks: pattern.cycleLengthWeeks,
    reference_week: pattern.referenceWeek,
    schedule: pattern,
    compensatory_rules: pattern.compensatoryRules,
    active: true,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw formatSupabaseError({ table: TABLE, operation: "INSERT", error });
  }

  return recordToPatternData(data as WorkSchedulePatternRecord);
}

export async function ensureFixedPatternFromWorkDays({
  userId,
  workDays,
  startTime = "09:00",
  endTime = "17:00",
  commuteMinutes,
}: {
  userId: string;
  workDays: string[];
  startTime?: string;
  endTime?: string;
  commuteMinutes?: number;
}): Promise<WorkSchedulePatternData | null> {
  const existing = await loadActiveWorkSchedulePattern(userId);
  if (existing) return existing;

  if (workDays.length === 0) return null;

  const pattern = createDefaultFixedPattern(workDays, startTime, endTime);
  if (commuteMinutes !== undefined) {
    pattern.commuteMinutes = commuteMinutes;
  }

  return saveWorkSchedulePattern({ userId, pattern });
}
