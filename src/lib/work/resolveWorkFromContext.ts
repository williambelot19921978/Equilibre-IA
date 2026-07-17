import type { PlanningContext } from "../../ai/memoryEngine";
import type { FamilyContextPeriodRecord } from "../../types/familyContext";
import type { ResolvedWorkStatus, WorkSchedulePatternData } from "../../types/workSchedule";
import { resolveWorkStatusForDate } from "./resolveWorkStatusForDate";

export function resolveWorkFromContext({
  date,
  workDays,
  workSchedulePattern,
  contextPeriods,
  workStart,
  workEnd,
  commuteMinutes,
}: {
  date: string;
  workDays: string[];
  workSchedulePattern?: WorkSchedulePatternData | null;
  contextPeriods?: FamilyContextPeriodRecord[];
  workStart?: string | null;
  workEnd?: string | null;
  commuteMinutes?: number;
}): ResolvedWorkStatus {
  return resolveWorkStatusForDate({
    date,
    fixedWorkDays: workDays,
    workSchedulePattern,
    contextPeriods,
    defaultStartTime: workStart ?? "09:00",
    defaultEndTime: workEnd ?? "17:00",
    commuteMinutes,
  });
}

export function resolveWorkFromPlanningContext(
  context: PlanningContext,
  date?: string,
): ResolvedWorkStatus {
  const targetDate = date ?? context.targetDate;
  return resolveWorkFromContext({
    date: targetDate,
    workDays: context.profile.workDays,
    workSchedulePattern: context.workSchedulePattern,
    contextPeriods: context.familyContextPeriods,
    workStart: context.workStart,
    workEnd: context.workEnd,
    commuteMinutes: context.profile.commuteMinutes,
  });
}
