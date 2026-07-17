import type {
  CompensatoryRestRule,
  WorkSchedulePatternData,
} from "../../types/workSchedule";

export function buildAlternatingWeeksPattern({
  weekA,
  weekB,
  compensatoryRules = [],
  effectiveFrom,
  referenceWeek,
  defaultStartTime = "09:00",
  defaultEndTime = "17:00",
  commuteMinutes,
}: {
  weekA: WorkSchedulePatternData["weeklyPatterns"][0];
  weekB: WorkSchedulePatternData["weeklyPatterns"][0];
  compensatoryRules?: CompensatoryRestRule[];
  effectiveFrom: string;
  referenceWeek: string;
  defaultStartTime?: string;
  defaultEndTime?: string;
  commuteMinutes?: number;
}): WorkSchedulePatternData {
  return {
    patternType: "alternating_weeks",
    effectiveFrom,
    cycleLengthWeeks: 2,
    referenceWeek,
    weeklyPatterns: [
      { ...weekA, label: weekA.label ?? "Semaine A" },
      { ...weekB, label: weekB.label ?? "Semaine B" },
    ],
    compensatoryRules,
    defaultStartTime,
    defaultEndTime,
    commuteMinutes,
  };
}

export function buildCyclePattern({
  weeks,
  effectiveFrom,
  referenceWeek,
  compensatoryRules = [],
  defaultStartTime = "09:00",
  defaultEndTime = "17:00",
  commuteMinutes,
}: {
  weeks: WorkSchedulePatternData["weeklyPatterns"];
  effectiveFrom: string;
  referenceWeek: string;
  compensatoryRules?: CompensatoryRestRule[];
  defaultStartTime?: string;
  defaultEndTime?: string;
  commuteMinutes?: number;
}): WorkSchedulePatternData {
  return {
    patternType: "cycle",
    effectiveFrom,
    cycleLengthWeeks: weeks.length,
    referenceWeek,
    weeklyPatterns: weeks.map((week, index) => ({
      ...week,
      label: week.label ?? `Semaine ${index + 1}`,
    })),
    compensatoryRules,
    defaultStartTime,
    defaultEndTime,
    commuteMinutes,
  };
}
