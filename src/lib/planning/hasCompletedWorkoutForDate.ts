import { classifyCalendarItemActivity } from "./classifyCalendarItemActivity";
import type { CalendarItemRecord } from "../../types/database";
import type { TaskActivityEventRecord } from "../../types/taskActivity";
import { getDurationMinutes } from "../time/daySchedule";
import { overlapsLocalDay } from "../time/dayBounds";
import { getLocalDayBounds } from "../time/dayBounds";

export type WorkoutCompletionSummary = {
  workoutCompletedToday: boolean;
  workoutMinutesCompletedToday: number;
  workoutTypeCompletedToday: string | null;
};

function isSportCalendarItem(item: CalendarItemRecord): boolean {
  return classifyCalendarItemActivity(item).isSport;
}

function isCalendarItemOnLocalDate(item: CalendarItemRecord, date: string): boolean {
  return overlapsLocalDay({
    startsAt: item.starts_at,
    endsAt: item.ends_at,
    date,
  });
}

function isCompletedSportCalendarItem(
  item: CalendarItemRecord,
  date: string,
): boolean {
  if (!isCalendarItemOnLocalDate(item, date)) return false;
  if (!isSportCalendarItem(item)) return false;

  const details = item.details ?? {};
  if (details.status === "completed") return true;
  if (typeof details.actual_completed_at === "string") return true;

  const workoutSession = details.workoutSession;
  if (
    workoutSession &&
    typeof workoutSession === "object" &&
    (workoutSession as { status?: string }).status === "completed"
  ) {
    return true;
  }

  return false;
}

function resolveWorkoutTypeFromItem(item: CalendarItemRecord): string | null {
  const details = item.details ?? {};
  if (typeof details.sportType === "string") return details.sportType;
  if (typeof details.activityType === "string" && details.activityType === "workout") {
    return "workout";
  }

  const session = details.workoutSession;
  if (session && typeof session === "object") {
    const type = (session as { type?: string }).type;
    if (typeof type === "string") return type;
  }

  return null;
}

function resolveWorkoutMinutesFromItem(item: CalendarItemRecord): number {
  const details = item.details ?? {};
  const actualStart =
    typeof details.actual_started_at === "string" ? details.actual_started_at : item.starts_at;
  const actualEnd =
    typeof details.actual_completed_at === "string"
      ? details.actual_completed_at
      : item.ends_at;

  return Math.max(1, getDurationMinutes(actualStart, actualEnd));
}

function isEventOnLocalDate(iso: string, date: string): boolean {
  const { start, end } = getLocalDayBounds(date);
  const value = new Date(iso).getTime();
  return value >= new Date(start).getTime() && value <= new Date(end).getTime();
}

function isWorkoutCompletionEvent({
  event,
  userId,
  date,
  calendarItemsById,
}: {
  event: TaskActivityEventRecord;
  userId: string;
  date: string;
  calendarItemsById: Map<string, CalendarItemRecord>;
}): boolean {
  if (event.user_id !== userId) return false;
  if (!isEventOnLocalDate(event.occurred_at, date)) return false;

  const metadata = event.metadata ?? {};

  if (metadata.workoutCompleted === true) return true;
  if (metadata.partialCompletion === true) return true;

  if (event.event_type !== "completed") return false;

  if (
    metadata.completedEarly === true ||
    metadata.completedOnTime === true ||
    metadata.completedLate === true
  ) {
    if (metadata.workoutCompleted === true || metadata.partialCompletion === true) {
      return true;
    }
  }

  if (event.calendar_item_id) {
    const linked = calendarItemsById.get(event.calendar_item_id);
    if (linked && isCompletedSportCalendarItem(linked, date)) {
      return true;
    }
  }

  return false;
}

export function hasCompletedWorkoutForDate({
  userId,
  date,
  calendarItems,
  taskActivityEvents = [],
}: {
  userId: string;
  date: string;
  calendarItems: CalendarItemRecord[];
  taskActivityEvents?: TaskActivityEventRecord[];
}): boolean {
  return resolveWorkoutCompletionForDate({
    userId,
    date,
    calendarItems,
    taskActivityEvents,
  }).workoutCompletedToday;
}

export function resolveWorkoutCompletionForDate({
  userId,
  date,
  calendarItems,
  taskActivityEvents = [],
}: {
  userId: string;
  date: string;
  calendarItems: CalendarItemRecord[];
  taskActivityEvents?: TaskActivityEventRecord[];
}): WorkoutCompletionSummary {
  const calendarItemsById = new Map(calendarItems.map((item) => [item.id, item]));
  const completedSportItems = calendarItems.filter((item) =>
    isCompletedSportCalendarItem(item, date),
  );

  let workoutMinutesCompletedToday = 0;
  let workoutTypeCompletedToday: string | null = null;

  for (const item of completedSportItems) {
    workoutMinutesCompletedToday += resolveWorkoutMinutesFromItem(item);
    workoutTypeCompletedToday ??= resolveWorkoutTypeFromItem(item);
  }

  const eventCompleted = taskActivityEvents.some((event) =>
    isWorkoutCompletionEvent({ event, userId, date, calendarItemsById }),
  );

  const workoutCompletedToday = completedSportItems.length > 0 || eventCompleted;

  if (workoutCompletedToday && workoutMinutesCompletedToday === 0 && eventCompleted) {
    const latestEvent = [...taskActivityEvents]
      .filter((event) =>
        isWorkoutCompletionEvent({ event, userId, date, calendarItemsById }),
      )
      .sort(
        (a, b) =>
          new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime(),
      )[0];

    const duration = latestEvent?.metadata?.durationCompleted;
    if (typeof duration === "number" && duration > 0) {
      workoutMinutesCompletedToday = duration;
    }
  }

  return {
    workoutCompletedToday,
    workoutMinutesCompletedToday,
    workoutTypeCompletedToday,
  };
}

export const SECOND_WORKOUT_CONFIRM_MESSAGE =
  "Tu as déjà réalisé une séance aujourd'hui. Souhaites-tu vraiment en ajouter une autre ?";

export function shouldConfirmAdditionalWorkout(
  workoutCompletedToday: boolean,
): boolean {
  return workoutCompletedToday;
}

export function confirmAdditionalWorkout(
  workoutCompletedToday: boolean,
): boolean {
  if (!shouldConfirmAdditionalWorkout(workoutCompletedToday)) {
    return true;
  }

  if (typeof window === "undefined") return true;
  return window.confirm(SECOND_WORKOUT_CONFIRM_MESSAGE);
}
