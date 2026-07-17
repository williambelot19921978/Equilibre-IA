import type { CalendarItemRecord } from "../../types/database";
import type { TaskActivityEventRecord } from "../../types/taskActivity";

export type WorkoutStatistics = {
  sessionCount: number;
  totalMinutes: number;
  averageMinutes: number;
  completedSessions: number;
  cancelledSessions: number;
  runningMinutes: number;
  runningSessions: number;
  strengthMinutes: number;
  yogaMinutes: number;
  mobilityMinutes: number;
  walkingMinutes: number;
  otherMinutes: number;
  totalDistanceKm: number | null;
  hasDistanceData: boolean;
};

function eventMinutes(event: TaskActivityEventRecord): number {
  const metadata = event.metadata ?? {};
  if (typeof metadata.durationCompleted === "number") {
    return Math.round(metadata.durationCompleted);
  }
  return 0;
}

function resolveSportCategory(metadata: Record<string, unknown>): string {
  if (metadata.workoutCompleted === true) {
    const sportType =
      typeof metadata.sportType === "string"
        ? metadata.sportType.toLowerCase()
        : typeof metadata.workoutType === "string"
          ? metadata.workoutType.toLowerCase()
          : "";
    if (/run|cours/.test(sportType)) return "running";
    if (/yoga/.test(sportType)) return "yoga";
    if (/mobil/.test(sportType)) return "mobility";
    if (/walk|marche/.test(sportType)) return "walking";
    if (/renfo|strength|muscu/.test(sportType)) return "strength";
    return "other";
  }
  return "other";
}

export function aggregateWorkoutStatistics({
  events,
  calendarItems,
}: {
  events: TaskActivityEventRecord[];
  calendarItems: CalendarItemRecord[];
}): WorkoutStatistics {
  const sportEvents = events.filter(
    (event) =>
      event.metadata?.workoutCompleted === true ||
      event.metadata?.activityCategory === "sport" ||
      event.metadata?.suggestionType === "sport",
  );

  const completed = sportEvents.filter((event) => event.event_type === "completed");
  const cancelled = sportEvents.filter((event) => event.event_type === "cancelled");

  let runningMinutes = 0;
  let strengthMinutes = 0;
  let yogaMinutes = 0;
  let mobilityMinutes = 0;
  let walkingMinutes = 0;
  let otherMinutes = 0;
  let totalDistanceKm = 0;
  let distanceCount = 0;

  for (const event of completed) {
    const minutes = eventMinutes(event);
    const category = resolveSportCategory(event.metadata ?? {});
    if (category === "running") runningMinutes += minutes;
    else if (category === "strength") strengthMinutes += minutes;
    else if (category === "yoga") yogaMinutes += minutes;
    else if (category === "mobility") mobilityMinutes += minutes;
    else if (category === "walking") walkingMinutes += minutes;
    else otherMinutes += minutes;

    const distance =
      typeof event.metadata?.distanceKm === "number"
        ? event.metadata.distanceKm
        : typeof event.metadata?.distance_km === "number"
          ? event.metadata.distance_km
          : null;
    if (distance !== null && distance > 0) {
      totalDistanceKm += distance;
      distanceCount += 1;
    }
  }

  const countedCalendarIds = new Set(
    completed.map((event) => event.calendar_item_id).filter(Boolean),
  );

  for (const item of calendarItems) {
    const details = item.details ?? {};
    if (details.businessType !== "sport" && details.activityType !== "sport") {
      continue;
    }
    if (countedCalendarIds.has(item.id)) continue;
    if (details.status !== "completed") continue;

    const start = new Date(item.starts_at).getTime();
    const end = new Date(item.ends_at).getTime();
    const minutes = Math.max(0, Math.round((end - start) / 60_000));
    otherMinutes += minutes;
  }

  const totalMinutes =
    runningMinutes +
    strengthMinutes +
    yogaMinutes +
    mobilityMinutes +
    walkingMinutes +
    otherMinutes;

  const sessionCount = completed.length + cancelled.length;

  return {
    sessionCount,
    totalMinutes,
    averageMinutes:
      completed.length > 0 ? Math.round(totalMinutes / completed.length) : 0,
    completedSessions: completed.length,
    cancelledSessions: cancelled.length,
    runningMinutes,
    runningSessions: completed.filter(
      (event) => resolveSportCategory(event.metadata ?? {}) === "running",
    ).length,
    strengthMinutes,
    yogaMinutes,
    mobilityMinutes,
    walkingMinutes,
    otherMinutes,
    totalDistanceKm: distanceCount > 0 ? Math.round(totalDistanceKm * 10) / 10 : null,
    hasDistanceData: distanceCount > 0,
  };
}
