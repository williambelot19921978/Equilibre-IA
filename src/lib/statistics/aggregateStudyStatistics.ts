import type { CalendarItemRecord } from "../../types/database";
import type { TaskActivityEventRecord } from "../../types/taskActivity";
import type { TaskRecord } from "../../types";

export type StudyStatistics = {
  plannedMinutes: number;
  completedMinutes: number;
  sessionCount: number;
  cancelledSessions: number;
  postponedSessions: number;
  weeklyGoalMinutes: number;
  progressPercent: number;
};

function isStudyItem(item: CalendarItemRecord): boolean {
  const details = item.details ?? {};
  return (
    details.businessType === "study" ||
    details.activityType === "revision" ||
    details.suggestionType === "study"
  );
}

function itemDurationMinutes(item: CalendarItemRecord): number {
  return Math.max(
    0,
    Math.round(
      (new Date(item.ends_at).getTime() - new Date(item.starts_at).getTime()) /
        60_000,
    ),
  );
}

function isStudyCompletionEvent(event: TaskActivityEventRecord): boolean {
  const metadata = event.metadata ?? {};
  return (
    metadata.studySession === true ||
    metadata.activityCategory === "study" ||
    metadata.suggestionType === "study"
  );
}

function completedMinutesFromEvent(event: TaskActivityEventRecord): number {
  const metadata = event.metadata ?? {};
  if (typeof metadata.durationCompleted === "number") {
    return Math.round(metadata.durationCompleted);
  }
  return 0;
}

export function aggregateStudyStatistics({
  periodStart,
  periodEnd,
  calendarItems,
  taskActivityEvents,
  studyWeeklyHours,
}: {
  periodStart: string;
  periodEnd: string;
  calendarItems: CalendarItemRecord[];
  taskActivityEvents: TaskActivityEventRecord[];
  studyTasks?: TaskRecord[];
  studyWeeklyHours?: number;
}): StudyStatistics {
  const studyItems = calendarItems.filter((item) => {
    if (!isStudyItem(item)) return false;
    const day = item.starts_at.slice(0, 10);
    return day >= periodStart.slice(0, 10) && day <= periodEnd.slice(0, 10);
  });

  const plannedMinutes = studyItems.reduce(
    (total, item) => total + itemDurationMinutes(item),
    0,
  );

  const completedEventIds = new Set<string>();
  let completedMinutes = 0;

  for (const event of taskActivityEvents) {
    if (event.event_type !== "completed") continue;
    if (event.occurred_at < periodStart || event.occurred_at > periodEnd) continue;
    if (!isStudyCompletionEvent(event)) continue;
    completedEventIds.add(event.id);
    completedMinutes += completedMinutesFromEvent(event);
  }

  for (const item of studyItems) {
    if (item.details?.status !== "completed") continue;
    const alreadyCounted = taskActivityEvents.some(
      (event) =>
        event.calendar_item_id === item.id && completedEventIds.has(event.id),
    );
    if (alreadyCounted) continue;
    completedMinutes += itemDurationMinutes(item);
  }

  const weeklyGoalMinutes = Math.round((studyWeeklyHours ?? 0) * 60);
  const progressPercent =
    weeklyGoalMinutes > 0
      ? Math.min(100, Math.round((completedMinutes / weeklyGoalMinutes) * 100))
      : 0;

  const cancelledSessions = taskActivityEvents.filter(
    (event) =>
      event.event_type === "cancelled" &&
      event.occurred_at >= periodStart &&
      event.occurred_at <= periodEnd &&
      isStudyCompletionEvent(event),
  ).length;

  const postponedSessions = taskActivityEvents.filter(
    (event) =>
      event.event_type === "moved" &&
      event.occurred_at >= periodStart &&
      event.occurred_at <= periodEnd &&
      isStudyCompletionEvent(event),
  ).length;

  return {
    plannedMinutes,
    completedMinutes,
    sessionCount: studyItems.length,
    cancelledSessions,
    postponedSessions,
    weeklyGoalMinutes,
    progressPercent,
  };
}
