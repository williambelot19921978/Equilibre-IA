import type { CalendarItemRecord } from "../../types/database";
import type { TaskActivityEventRecord } from "../../types/taskActivity";
import type { TaskRecord } from "../../types";
import { getLocalWeekBounds } from "../time/weekBounds";
import { overlapsLocalDay } from "../time/dayBounds";

export type WeeklyStudyProgress = {
  weekStart: string;
  plannedMinutes: number;
  completedMinutes: number;
  weeklyGoalMinutes: number;
  remainingMinutes: number;
  progressPercent: number;
};

function isStudyCalendarItem(item: CalendarItemRecord): boolean {
  const details = item.details ?? {};
  if (details.businessType === "study") return true;
  if (details.suggestionType === "study") return true;
  if (details.activityType === "revision") return true;
  if (/révis|étude|study/i.test(item.title)) return true;
  return false;
}

function itemDurationMinutes(item: CalendarItemRecord): number {
  const start = new Date(item.starts_at).getTime();
  const end = new Date(item.ends_at).getTime();
  return Math.max(0, Math.round((end - start) / 60_000));
}

function completedDurationFromItem(item: CalendarItemRecord): number {
  const details = item.details ?? {};
  const actualCompletedAt =
    typeof details.actual_completed_at === "string"
      ? details.actual_completed_at
      : null;
  if (!actualCompletedAt) return 0;

  const actualStartedAt =
    typeof details.actual_started_at === "string"
      ? details.actual_started_at
      : item.starts_at;

  return Math.max(
    0,
    Math.round(
      (new Date(actualCompletedAt).getTime() -
        new Date(actualStartedAt).getTime()) /
        60_000,
    ),
  );
}

function isStudyCompletionEvent(event: TaskActivityEventRecord): boolean {
  const metadata = event.metadata ?? {};
  if (metadata.studySession === true) return true;
  if (metadata.activityCategory === "study") return true;
  if (metadata.suggestionType === "study") return true;
  if (typeof metadata.title === "string" && /révis|étude|study/i.test(metadata.title)) {
    return true;
  }
  return false;
}

function completedMinutesFromEvent(event: TaskActivityEventRecord): number {
  const metadata = event.metadata ?? {};
  if (typeof metadata.durationCompleted === "number" && metadata.durationCompleted > 0) {
    return Math.round(metadata.durationCompleted);
  }
  const actualStart =
    typeof metadata.actualStart === "string" ? metadata.actualStart : null;
  const actualEnd =
    typeof metadata.actualEnd === "string" ? metadata.actualEnd : null;
  if (actualStart && actualEnd) {
    return Math.max(
      0,
      Math.round(
        (new Date(actualEnd).getTime() - new Date(actualStart).getTime()) / 60_000,
      ),
    );
  }
  return 0;
}

function weekDays(weekStart: string): string[] {
  const days: string[] = [];
  const cursor = new Date(`${weekStart}T12:00:00`);
  for (let index = 0; index < 7; index += 1) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

export function getWeeklyStudyProgress({
  referenceDate,
  calendarItems,
  taskActivityEvents,
  studyTasks = [],
  studyWeeklyHours,
}: {
  userId: string;
  referenceDate: string;
  calendarItems: CalendarItemRecord[];
  taskActivityEvents: TaskActivityEventRecord[];
  studyTasks?: TaskRecord[];
  studyWeeklyHours?: number;
}): WeeklyStudyProgress {
  const { weekStart, start, end } = getLocalWeekBounds(referenceDate);
  const weekDaySet = new Set(weekDays(weekStart));

  const studyItems = calendarItems.filter((item) => {
    if (!isStudyCalendarItem(item)) return false;
    return [...weekDaySet].some((day) =>
      overlapsLocalDay({
        startsAt: item.starts_at,
        endsAt: item.ends_at,
        date: day,
      }),
    );
  });

  const plannedMinutes = studyItems.reduce(
    (total, item) => total + itemDurationMinutes(item),
    0,
  );

  const completedEventIds = new Set<string>();
  let completedMinutes = 0;

  for (const event of taskActivityEvents) {
    if (event.event_type !== "completed") continue;
    if (event.occurred_at < start || event.occurred_at > end) continue;
    if (!isStudyCompletionEvent(event)) continue;

    completedEventIds.add(event.id);
    completedMinutes += completedMinutesFromEvent(event);
  }

  for (const item of studyItems) {
    if (item.details?.status !== "completed") continue;
    const calendarItemId = item.id;
    const alreadyCounted = taskActivityEvents.some(
      (event) =>
        event.calendar_item_id === calendarItemId &&
        completedEventIds.has(event.id),
    );
    if (alreadyCounted) continue;
    completedMinutes += completedDurationFromItem(item);
  }

  const weeklyGoalMinutes = Math.round((studyWeeklyHours ?? 0) * 60);
  const remainingMinutes = Math.max(0, weeklyGoalMinutes - completedMinutes);
  const progressPercent =
    weeklyGoalMinutes > 0
      ? Math.min(100, Math.round((completedMinutes / weeklyGoalMinutes) * 100))
      : 0;

  void studyTasks;

  return {
    weekStart,
    plannedMinutes,
    completedMinutes,
    weeklyGoalMinutes,
    remainingMinutes,
    progressPercent,
  };
}

export function formatStudyMinutesLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (remainder === 0) return `${hours} h`;
  return `${hours} h ${remainder} min`;
}
