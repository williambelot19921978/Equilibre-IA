import { getActivePeriodsForDate } from "../../ai/familyContextEngine";
import type { FamilyContextPeriodRecord } from "../../types/familyContext";
import type {
  DayScheduleEntry,
  ResolvedWorkStatus,
  WeekdayKey,
  WorkDayOverride,
  WorkSchedulePatternData,
} from "../../types/workSchedule";
import { addDaysToDate } from "../time/deviceClock";
import { getWeekdayKey, isWorkDay as isFixedWorkDay } from "../time/daySchedule";
import {
  describeWorkExceptionBadge,
  isPartialWorkException,
  type WorkExceptionType,
} from "./workExceptionTypes";
import {
  getCycleWeekIndex,
  getDateForWeekdayInWeek,
  getMondayOfWeek,
} from "./workScheduleCycle";

const VACATION_TYPES = new Set(["user_vacation", "children_vacation"]);
const WEEKEND_DAYS = new Set<WeekdayKey>(["saturday", "sunday"]);

function buildStatus(
  partial: {
    isWorkDay: boolean;
    isCompensatoryRest?: boolean;
    isExceptional?: boolean;
    startTime?: string;
    endTime?: string;
    commuteMinutes?: number;
    source: ResolvedWorkStatus["source"];
    cycleWeek?: number;
    reason: string;
    weekday: WeekdayKey;
    partialWorkDay?: ResolvedWorkStatus["partialWorkDay"];
  },
): ResolvedWorkStatus {
  const isCompensatoryRest = partial.isCompensatoryRest ?? false;
  const isWeekendNonWork =
    !partial.isWorkDay &&
    WEEKEND_DAYS.has(partial.weekday) &&
    !isCompensatoryRest;

  return {
    isWorkDay: partial.isWorkDay,
    isRestDay: !partial.isWorkDay,
    isCompensatoryRest,
    isWeekendNonWork,
    isExceptional: partial.isExceptional ?? false,
    startTime: partial.startTime,
    endTime: partial.endTime,
    commuteMinutes: partial.commuteMinutes,
    source: partial.source,
    cycleWeek: partial.cycleWeek,
    reason: partial.reason,
    partialWorkDay: partial.partialWorkDay,
  };
}

function hasVacation(periods: FamilyContextPeriodRecord[]): boolean {
  return periods.some((p) => VACATION_TYPES.has(p.context_type));
}

function findManualOverride(
  overrides: WorkDayOverride[],
  date: string,
): WorkDayOverride | undefined {
  return overrides.find((o) => o.date === date);
}

function findContextWorkOverride(
  periods: FamilyContextPeriodRecord[],
): FamilyContextPeriodRecord | undefined {
  return periods.find(
    (p) =>
      p.impact?.forceWorkDay === true ||
      p.context_type === "exceptional_work_hours",
  );
}

function findContextRestOverride(
  periods: FamilyContextPeriodRecord[],
): FamilyContextPeriodRecord | undefined {
  return periods.find(
    (p) =>
      p.impact?.disableWork === true &&
      !p.impact?.forceWorkDay &&
      !isPartialWorkException(p.impact?.workExceptionType),
  );
}

function extractPartialWorkDay(
  period: FamilyContextPeriodRecord | undefined,
): ResolvedWorkStatus["partialWorkDay"] {
  const type = period?.impact?.workExceptionType;
  if (!type || !isPartialWorkException(type)) {
    return undefined;
  }

  return {
    type,
    affectedPeriod:
      period?.impact?.affectedPeriod ??
      (type === "no_work_morning" || type === "work_morning_only"
        ? "morning"
        : "afternoon"),
  };
}

function getPatternDayEntry(
  pattern: WorkSchedulePatternData,
  date: string,
): { entry: DayScheduleEntry; cycleWeek: number } | null {
  if (date < pattern.effectiveFrom) return null;

  const weekday = getWeekdayKey(date) as WeekdayKey;
  const cycleWeek = getCycleWeekIndex({
    date,
    referenceWeek: pattern.referenceWeek,
    cycleLengthWeeks: pattern.cycleLengthWeeks,
  });
  const weekPattern = pattern.weeklyPatterns[cycleWeek];
  if (!weekPattern) return null;

  const entry = weekPattern.days[weekday];
  if (!entry) return null;

  return { entry, cycleWeek };
}

function getCompensatoryRestDate(
  workDate: string,
  restWeekday: WeekdayKey,
): string {
  const weekMonday = getMondayOfWeek(workDate);
  const restInSameWeek = getDateForWeekdayInWeek(weekMonday, restWeekday);
  if (restInSameWeek > workDate) {
    return restInSameWeek;
  }
  return getDateForWeekdayInWeek(addDaysToDate(weekMonday, 7), restWeekday);
}

function isCompensatoryRestDay({
  date,
  pattern,
  periods,
}: {
  date: string;
  pattern: WorkSchedulePatternData | null | undefined;
  periods: FamilyContextPeriodRecord[];
}): { rest: boolean; reason?: string } {
  if (!pattern || pattern.compensatoryRules.length === 0) {
    return { rest: false };
  }

  if (hasVacation(periods)) {
    return { rest: false };
  }

  for (const rule of pattern.compensatoryRules) {
    for (let lookback = 1; lookback <= 14; lookback += 1) {
      const candidateWorkDate = addDaysToDate(date, -lookback);
      if (getWeekdayKey(candidateWorkDate) !== rule.whenWorkWeekday) {
        continue;
      }

      const cycleWeek = getCycleWeekIndex({
        date: candidateWorkDate,
        referenceWeek: pattern.referenceWeek,
        cycleLengthWeeks: pattern.cycleLengthWeeks,
      });

      if (
        rule.cycleWeekIndex !== undefined &&
        rule.cycleWeekIndex !== cycleWeek
      ) {
        continue;
      }

      const workEntry = getPatternDayEntry(pattern, candidateWorkDate);
      const manualWork = pattern.workOverrides?.find(
        (o) => o.date === candidateWorkDate,
      );
      const isWork = manualWork?.work ?? workEntry?.entry.work ?? false;

      if (!isWork) continue;

      const expectedRest = getCompensatoryRestDate(
        candidateWorkDate,
        rule.restWeekday,
      );
      if (expectedRest !== date) continue;

      return {
        rest: true,
        reason: `Repos compensateur (suite au travail du ${rule.whenWorkWeekday} ${candidateWorkDate}).`,
      };
    }
  }

  return { rest: false };
}

function resolveFromPattern(
  date: string,
  pattern: WorkSchedulePatternData,
  weekday: WeekdayKey,
): ResolvedWorkStatus | null {
  const resolved = getPatternDayEntry(pattern, date);
  if (!resolved) return null;

  const { entry, cycleWeek } = resolved;
  const startTime = entry.startTime ?? pattern.defaultStartTime;
  const endTime = entry.endTime ?? pattern.defaultEndTime;

  if (entry.work) {
    return buildStatus({
      isWorkDay: true,
      source: "pattern",
      cycleWeek,
      startTime,
      endTime,
      commuteMinutes: pattern.commuteMinutes,
      reason: `Jour travaillé selon le rythme ${
        pattern.weeklyPatterns[cycleWeek]?.label ?? `semaine ${cycleWeek + 1}`
      }.`,
      weekday,
    });
  }

  return buildStatus({
    isWorkDay: false,
    source: "pattern",
    cycleWeek,
    reason: `Jour de repos selon le rythme cyclique.`,
    weekday,
  });
}

function resolveFromFixedDays(
  date: string,
  fixedWorkDays: string[],
  defaultStart: string,
  defaultEnd: string,
  commuteMinutes?: number,
): ResolvedWorkStatus {
  const weekday = getWeekdayKey(date) as WeekdayKey;
  const work = isFixedWorkDay(date, fixedWorkDays);

  if (work) {
    return buildStatus({
      isWorkDay: true,
      source: "fixed_days",
      startTime: defaultStart,
      endTime: defaultEnd,
      commuteMinutes,
      reason: "Jour travaillé selon les jours fixes du profil.",
      weekday,
    });
  }

  if (WEEKEND_DAYS.has(weekday)) {
    return buildStatus({
      isWorkDay: false,
      source: "default_rest",
      reason: "Week-end — pas de travail habituel.",
      weekday,
    });
  }

  return buildStatus({
    isWorkDay: false,
    source: fixedWorkDays.length > 0 ? "fixed_days" : "default_rest",
    reason:
      fixedWorkDays.length > 0
        ? "Jour de repos selon le rythme habituel du profil."
        : "Aucun rythme de travail configuré.",
    weekday,
  });
}

/**
 * Source de vérité unique : un jour est-il travaillé ?
 * Utilisée par calendrier, Life Engine et Planning Engine.
 */
export function resolveWorkStatusForDate({
  date,
  fixedWorkDays = [],
  workSchedulePattern,
  contextPeriods = [],
  manualOverrides = [],
  defaultStartTime = "09:00",
  defaultEndTime = "17:00",
  commuteMinutes,
}: {
  date: string;
  fixedWorkDays?: string[];
  workSchedulePattern?: WorkSchedulePatternData | null;
  contextPeriods?: FamilyContextPeriodRecord[];
  manualOverrides?: WorkDayOverride[];
  defaultStartTime?: string;
  defaultEndTime?: string;
  commuteMinutes?: number;
}): ResolvedWorkStatus {
  const weekday = getWeekdayKey(date) as WeekdayKey;
  const activePeriods = getActivePeriodsForDate(contextPeriods, date);

  if (hasVacation(activePeriods)) {
    return buildStatus({
      isWorkDay: false,
      source: "vacation",
      reason: "Vacances — aucune contrainte de travail habituelle.",
      weekday,
    });
  }

  const patternOverrides = workSchedulePattern?.workOverrides ?? [];
  const allOverrides = [...patternOverrides, ...manualOverrides];
  const manual = findManualOverride(allOverrides, date);

  if (manual) {
    if (manual.work) {
      return buildStatus({
        isWorkDay: true,
        isExceptional: true,
        source: "override",
        startTime: manual.startTime ?? defaultStartTime,
        endTime: manual.endTime ?? defaultEndTime,
        commuteMinutes:
          workSchedulePattern?.commuteMinutes ?? commuteMinutes,
        reason: manual.reason ?? "Travail exceptionnel ponctuel.",
        weekday,
      });
    }
    return buildStatus({
      isWorkDay: false,
      isExceptional: true,
      source: "override",
      reason: manual.reason ?? "Repos exceptionnel ponctuel.",
      weekday,
    });
  }

  const contextRest = findContextRestOverride(activePeriods);
  if (contextRest) {
    return buildStatus({
      isWorkDay: false,
      source: "override",
      reason: "Repos exceptionnel (contexte familial).",
      weekday,
    });
  }

  const contextWork = findContextWorkOverride(activePeriods);
  if (contextWork) {
    const start =
      contextWork.impact?.workStartOverride ?? defaultStartTime;
    const end = contextWork.impact?.workEndOverride ?? defaultEndTime;
    const partialWorkDay = extractPartialWorkDay(contextWork);
    const partialLabel = describeWorkExceptionBadge(
      contextWork.impact?.workExceptionType as WorkExceptionType | undefined,
    );
    return buildStatus({
      isWorkDay: true,
      isExceptional: true,
      source: "exceptional",
      startTime: start,
      endTime: end,
      commuteMinutes:
        workSchedulePattern?.commuteMinutes ?? commuteMinutes,
      reason: partialLabel
        ? `Demi-journée — ${partialLabel.toLowerCase()}.`
        : "Horaire ou journée de travail exceptionnelle.",
      weekday,
      partialWorkDay,
    });
  }

  const compensatory = isCompensatoryRestDay({
    date,
    pattern: workSchedulePattern,
    periods: activePeriods,
  });
  if (compensatory.rest) {
    return buildStatus({
      isWorkDay: false,
      isCompensatoryRest: true,
      source: "compensatory",
      reason: compensatory.reason ?? "Repos compensateur.",
      weekday,
    });
  }

  if (workSchedulePattern && workSchedulePattern.patternType !== "fixed_week") {
    const fromPattern = resolveFromPattern(date, workSchedulePattern, weekday);
    if (fromPattern) return fromPattern;
  }

  if (workSchedulePattern?.patternType === "fixed_week") {
    const fromPattern = resolveFromPattern(date, workSchedulePattern, weekday);
    if (fromPattern) return fromPattern;
  }

  return resolveFromFixedDays(
    date,
    fixedWorkDays,
    workSchedulePattern?.defaultStartTime ?? defaultStartTime,
    workSchedulePattern?.defaultEndTime ?? defaultEndTime,
    workSchedulePattern?.commuteMinutes ?? commuteMinutes,
  );
}

/** Aperçu des N prochaines semaines (dates → statut). */
export function previewWorkSchedule({
  startDate,
  weekCount,
  fixedWorkDays,
  workSchedulePattern,
  contextPeriods = [],
}: {
  startDate: string;
  weekCount: number;
  fixedWorkDays: string[];
  workSchedulePattern?: WorkSchedulePatternData | null;
  contextPeriods?: FamilyContextPeriodRecord[];
}): Array<{ date: string; status: ResolvedWorkStatus }> {
  const results: Array<{ date: string; status: ResolvedWorkStatus }> = [];
  const totalDays = weekCount * 7;

  for (let i = 0; i < totalDays; i += 1) {
    const date = addDaysToDate(startDate, i);
    results.push({
      date,
      status: resolveWorkStatusForDate({
        date,
        fixedWorkDays,
        workSchedulePattern,
        contextPeriods,
      }),
    });
  }

  return results;
}
