import type {
  WeekdayKey,
  WorkSchedulePatternData,
  WorkPatternType,
} from "../../types/workSchedule";
import { emptyWeekPattern } from "../../types/workSchedule";

export type ScheduleMode = "fixed_week" | "alternating_weeks" | "cycle";

export type WorkScheduleEditorState = {
  mode: ScheduleMode;
  weekA: WorkSchedulePatternData["weeklyPatterns"][0];
  weekB: WorkSchedulePatternData["weeklyPatterns"][0];
  cycleWeeks: WorkSchedulePatternData["weeklyPatterns"];
  referenceWeek: string;
  compensatoryDay: WeekdayKey;
  compensatoryWhen: WeekdayKey;
};

export function patternTypeToMode(
  patternType: WorkPatternType,
): ScheduleMode {
  if (patternType === "alternating_weeks") return "alternating_weeks";
  if (patternType === "cycle" || patternType === "custom_rotation") {
    return "cycle";
  }
  return "fixed_week";
}

export function hydrateEditorFromPattern(
  pattern: WorkSchedulePatternData | null,
  workDays: string[],
  workStart: string,
  workEnd: string,
  defaultReferenceWeek: string,
): WorkScheduleEditorState {
  if (!pattern) {
    const week = emptyWeekPattern("Semaine habituelle");
    for (const day of workDays) {
      if (day in week.days) {
        week.days[day as WeekdayKey] = {
          work: true,
          startTime: workStart,
          endTime: workEnd,
        };
      }
    }
    return {
      mode: "fixed_week",
      weekA: week,
      weekB: emptyWeekPattern("Semaine B"),
      cycleWeeks: [emptyWeekPattern("Semaine 1"), emptyWeekPattern("Semaine 2")],
      referenceWeek: defaultReferenceWeek,
      compensatoryDay: "tuesday",
      compensatoryWhen: "saturday",
    };
  }

  const rule = pattern.compensatoryRules[0];

  return {
    mode: patternTypeToMode(pattern.patternType),
    weekA: pattern.weeklyPatterns[0] ?? emptyWeekPattern("Semaine A"),
    weekB: pattern.weeklyPatterns[1] ?? emptyWeekPattern("Semaine B"),
    cycleWeeks:
      pattern.weeklyPatterns.length > 0
        ? pattern.weeklyPatterns
        : [emptyWeekPattern("Semaine 1"), emptyWeekPattern("Semaine 2")],
    referenceWeek: pattern.referenceWeek || defaultReferenceWeek,
    compensatoryDay: rule?.restWeekday ?? "tuesday",
    compensatoryWhen: rule?.whenWorkWeekday ?? "saturday",
  };
}

export function applyScheduleModeChange(
  state: WorkScheduleEditorState,
  mode: ScheduleMode,
): WorkScheduleEditorState {
  if (mode === state.mode) return state;

  if (mode === "alternating_weeks") {
    return {
      ...state,
      mode,
      weekB:
        state.weekB.days && Object.keys(state.weekB.days).length > 0
          ? state.weekB
          : emptyWeekPattern("Semaine B"),
    };
  }

  if (mode === "cycle") {
    return {
      ...state,
      mode,
      cycleWeeks:
        state.cycleWeeks.length >= 2
          ? state.cycleWeeks
          : [state.weekA, emptyWeekPattern("Semaine 2")],
    };
  }

  return { ...state, mode };
}
