export type WorkPatternType =
  | "fixed_week"
  | "alternating_weeks"
  | "cycle"
  | "custom_rotation";

export type WeekdayKey =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type DayScheduleEntry = {
  work: boolean;
  startTime?: string;
  endTime?: string;
};

export type WeekPattern = {
  label?: string;
  days: Partial<Record<WeekdayKey, DayScheduleEntry>>;
};

export type CompensatoryRestRule = {
  /** Jour travaillé déclencheur (ex. saturday) */
  whenWorkWeekday: WeekdayKey;
  /** Jour de repos compensateur (ex. tuesday) */
  restWeekday: WeekdayKey;
  /** Limiter à une semaine du cycle (optionnel) */
  cycleWeekIndex?: number;
};

export type WorkDayOverride = {
  date: string;
  work: boolean;
  startTime?: string;
  endTime?: string;
  reason?: string;
};

export type WorkSchedulePatternData = {
  patternType: WorkPatternType;
  effectiveFrom: string;
  cycleLengthWeeks: number;
  referenceWeek: string;
  weeklyPatterns: WeekPattern[];
  compensatoryRules: CompensatoryRestRule[];
  defaultStartTime: string;
  defaultEndTime: string;
  commuteMinutes?: number;
  workOverrides?: WorkDayOverride[];
};

export type WorkSchedulePatternRecord = {
  id: string;
  user_id: string;
  household_id: string | null;
  name: string;
  pattern_type: WorkPatternType;
  effective_from: string;
  cycle_length_weeks: number;
  reference_week: string | null;
  schedule: WorkSchedulePatternData;
  compensatory_rules: CompensatoryRestRule[];
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type WorkStatusSource =
  | "vacation"
  | "override"
  | "exceptional"
  | "compensatory"
  | "pattern"
  | "fixed_days"
  | "default_rest";

export type ResolvedWorkStatus = {
  isWorkDay: boolean;
  isRestDay: boolean;
  isCompensatoryRest: boolean;
  isWeekendNonWork: boolean;
  isExceptional: boolean;
  startTime?: string;
  endTime?: string;
  commuteMinutes?: number;
  source: WorkStatusSource;
  cycleWeek?: number;
  reason: string;
  partialWorkDay?: {
    type: import("../lib/work/workExceptionTypes").WorkExceptionType;
    affectedPeriod: import("../lib/work/workExceptionTypes").WorkAffectedPeriod;
  };
};

export const WEEKDAY_KEYS: WeekdayKey[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export const WEEKDAY_LABELS: Record<WeekdayKey, string> = {
  monday: "Lundi",
  tuesday: "Mardi",
  wednesday: "Mercredi",
  thursday: "Jeudi",
  friday: "Vendredi",
  saturday: "Samedi",
  sunday: "Dimanche",
};

export function emptyWeekPattern(label?: string): WeekPattern {
  return {
    label,
    days: Object.fromEntries(
      WEEKDAY_KEYS.map((key) => [key, { work: false }]),
    ) as WeekPattern["days"],
  };
}

export function createDefaultFixedPattern(
  workDays: string[],
  startTime = "09:00",
  endTime = "17:00",
): WorkSchedulePatternData {
  const week = emptyWeekPattern("Semaine habituelle");
  for (const key of WEEKDAY_KEYS) {
    week.days[key] = {
      work: workDays.includes(key),
      startTime,
      endTime,
    };
  }
  return {
    patternType: "fixed_week",
    effectiveFrom: new Date().toISOString().slice(0, 10),
    cycleLengthWeeks: 1,
    referenceWeek: new Date().toISOString().slice(0, 10),
    weeklyPatterns: [week],
    compensatoryRules: [],
    defaultStartTime: startTime,
    defaultEndTime: endTime,
  };
}
