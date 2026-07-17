import type { CalendarItemRecord } from "../../types/database";
import type { DailyCheckinRecord } from "../../types/dailyCheckin";
import type { TaskActivityEventRecord } from "../../types/taskActivity";
import type { LivingHabitProfile } from "../../types/livingMemory";
import { classifyCalendarItemActivity } from "../../lib/planning/classifyCalendarItemActivity";
import {
  clampConfidence,
  hourBucket,
  hourFromIso,
  isCalmEvent,
  isCoupleEvent,
  isLeisureEvent,
  isSportEvent,
  isStudyEvent,
  metric,
  roundDuration,
  weekdayLabel,
} from "./livingMemoryUtils";

export type BuildLivingHabitProfileInput = {
  calendarItems: CalendarItemRecord[];
  taskActivityEvents: TaskActivityEventRecord[];
  checkins: DailyCheckinRecord[];
};

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function topBucket(
  counts: Map<string, number>,
): { key: string; count: number } | null {
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  return sorted[0] ? { key: sorted[0][0], count: sorted[0][1] } : null;
}

export function buildLivingHabitProfile({
  calendarItems,
  taskActivityEvents,
  checkins,
}: BuildLivingHabitProfileInput): LivingHabitProfile {
  const profile: LivingHabitProfile = {};
  const completedEvents = taskActivityEvents.filter(
    (event) => event.event_type === "completed",
  );
  const cancelledEvents = taskActivityEvents.filter(
    (event) => event.event_type === "cancelled",
  );
  const movedEvents = taskActivityEvents.filter(
    (event) => event.event_type === "moved",
  );
  const shortenedEvents = taskActivityEvents.filter(
    (event) => event.event_type === "shortened",
  );

  const sportCompleted = completedEvents.filter((event) =>
    isSportEvent(event.metadata ?? {}),
  );
  const studyCompleted = completedEvents.filter((event) =>
    isStudyEvent(event.metadata ?? {}),
  );
  const coupleCompleted = completedEvents.filter((event) =>
    isCoupleEvent(event.metadata ?? {}),
  );
  const leisureCompleted = completedEvents.filter((event) =>
    isLeisureEvent(event.metadata ?? {}),
  );

  const studyBuckets = new Map<string, number>();
  for (const event of studyCompleted) {
    const bucket = hourBucket(event.occurred_at);
    studyBuckets.set(bucket, (studyBuckets.get(bucket) ?? 0) + 1);
  }
  const topStudy = topBucket(studyBuckets);
  if (topStudy && topStudy.count >= 2) {
    profile.preferredStudyTime = metric(
      topStudy.key as "morning" | "afternoon" | "evening",
      topStudy.count,
      50 + topStudy.count * 8,
    );
    profile.bestProductivityWindow = profile.preferredStudyTime;
  }

  const sportDurations: number[] = [];
  const sportHours: number[] = [];
  const sportByWeekday = new Map<string, number>();

  for (const item of calendarItems) {
    const classified = classifyCalendarItemActivity(item);
    if (!classified.isSport || item.details?.status !== "completed") continue;
    const start = new Date(item.starts_at).getTime();
    const end = new Date(item.ends_at).getTime();
    if (end > start) {
      sportDurations.push(Math.round((end - start) / 60_000));
    }
    sportHours.push(hourFromIso(item.starts_at));
    const day = weekdayLabel(item.starts_at);
    sportByWeekday.set(day, (sportByWeekday.get(day) ?? 0) + 1);
  }

  for (const event of sportCompleted) {
    const day = weekdayLabel(event.occurred_at);
    sportByWeekday.set(day, (sportByWeekday.get(day) ?? 0) + 1);
    sportHours.push(hourFromIso(event.occurred_at));
    const duration = Number(event.metadata?.durationMinutes);
    if (Number.isFinite(duration) && duration > 0) {
      sportDurations.push(duration);
    }
  }

  const avgSport = average(sportDurations);
  if (avgSport !== null && sportDurations.length >= 2) {
    const rounded = roundDuration(avgSport);
    profile.averageWorkoutDuration = metric(
      rounded,
      sportDurations.length,
      45 + sportDurations.length * 7,
    );
    profile.preferredWorkoutDuration = profile.averageWorkoutDuration;
  }

  const topSportDay = topBucket(sportByWeekday);
  if (topSportDay && topSportDay.count >= 2) {
    profile.preferredWorkoutDay = metric(
      topSportDay.key,
      topSportDay.count,
      55 + topSportDay.count * 8,
    );
  }

  const avgSportHour = average(sportHours);
  if (avgSportHour !== null && sportHours.length >= 2) {
    profile.preferredWorkoutHour = metric(
      Math.round(avgSportHour),
      sportHours.length,
      50 + sportHours.length * 6,
    );
  }

  const studyDurations: number[] = [];
  for (const item of calendarItems) {
    const classified = classifyCalendarItemActivity(item);
    if (classified.activityCategory !== "study") continue;
    if (item.details?.status !== "completed") continue;
    const start = new Date(item.starts_at).getTime();
    const end = new Date(item.ends_at).getTime();
    if (end > start) {
      studyDurations.push(Math.round((end - start) / 60_000));
    }
  }
  const avgStudy = average(studyDurations);
  if (avgStudy !== null && studyDurations.length >= 2) {
    profile.averageStudyDuration = metric(
      roundDuration(avgStudy),
      studyDurations.length,
      45 + studyDurations.length * 7,
    );
  }

  const totalActions =
    completedEvents.length + cancelledEvents.length + movedEvents.length;
  if (totalActions >= 3) {
    const rate = cancelledEvents.length / totalActions;
    profile.averageCancellationRate = metric(
      Math.round(rate * 100) / 100,
      totalActions,
      clampConfidence(40 + totalActions * 4),
    );
  }

  const coupleBuckets = new Map<string, number>();
  for (const event of coupleCompleted) {
    const bucket = hourBucket(event.occurred_at);
    coupleBuckets.set(bucket, (coupleBuckets.get(bucket) ?? 0) + 1);
  }
  const topCouple = topBucket(coupleBuckets);
  if (topCouple && topCouple.count >= 1) {
    profile.preferredCoupleTime = metric(
      topCouple.key as "morning" | "afternoon" | "evening",
      topCouple.count,
      45 + topCouple.count * 10,
    );
  }

  const leisureCounts = new Map<string, number>();
  for (const event of leisureCompleted) {
    const title = String(event.metadata?.title ?? "Loisir");
    leisureCounts.set(title, (leisureCounts.get(title) ?? 0) + 1);
  }
  const favoriteLeisure = [...leisureCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([title]) => title);
  if (favoriteLeisure.length > 0) {
    profile.favoriteLeisureActivities = metric(
      favoriteLeisure,
      leisureCompleted.length,
      40 + leisureCompleted.length * 8,
    );
  }

  const eveningCancelled = cancelledEvents.filter(
    (event) => hourBucket(event.occurred_at) === "evening",
  ).length;
  const socialTolerance =
    eveningCancelled >= 3 ? "low" : eveningCancelled >= 1 ? "medium" : "high";
  if (cancelledEvents.length >= 2) {
    profile.socialMediaTolerance = metric(
      socialTolerance,
      cancelledEvents.length,
      45 + cancelledEvents.length * 5,
    );
  }

  const calmAfterWork = completedEvents.filter((event) => {
    const hour = hourFromIso(event.occurred_at);
    return hour >= 17 && hour <= 20 && isCalmEvent(event.metadata ?? {});
  }).length;
  if (calmAfterWork >= 1) {
    profile.preferredFreeTimeBlocks = metric(
      ["17h-20h"],
      calmAfterWork,
      45 + calmAfterWork * 10,
    );
  }

  const tiredCheckins = checkins.filter(
    (checkin) => checkin.mood === "tired" || checkin.mood === "exhausted",
  ).length;
  const goodCheckins = checkins.filter(
    (checkin) => checkin.mood === "great" || checkin.mood === "good",
  ).length;
  if (checkins.length >= 3) {
    const recovery =
      goodCheckins >= tiredCheckins + 2
        ? "fast"
        : goodCheckins >= tiredCheckins
          ? "medium"
          : "slow";
    profile.fatigueRecoverySpeed = metric(
      recovery,
      checkins.length,
      40 + checkins.length * 5,
    );
  }

  const eveningCompleted = completedEvents.filter(
    (event) => hourBucket(event.occurred_at) === "evening",
  ).length;
  if (eveningCompleted >= 2) {
    profile.preferredSleepTime = metric(
      22,
      eveningCompleted,
      35 + eveningCompleted * 5,
    );
  }

  if (shortenedEvents.length >= 2) {
    const current = profile.preferredWorkoutDuration;
    if (current) {
      profile.preferredWorkoutDuration = {
        ...current,
        confidence: clampConfidence(current.confidence - 5),
      };
    }
  }

  return profile;
}
