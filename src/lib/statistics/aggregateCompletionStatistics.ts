import type { CalendarItemRecord } from "../../types/database";
import type { TaskActivityEventRecord } from "../../types/taskActivity";
import type { DailyCheckinRecord } from "../../types/dailyCheckin";

export type CompletionStatistics = {
  completedCount: number;
  completedEarlyCount: number;
  postponedCount: number;
  cancelledCount: number;
  realizationRate: number;
  plannedMinutes: number;
  completedMinutes: number;
  freeTimeKeptCount: number;
};

export type WellnessStatistics = {
  averageEnergy: number | null;
  averageFatigue: number | null;
  stressedDays: number;
  checkinDays: number;
  hasEnoughData: boolean;
};

export type SpiritualStatistics = {
  totalMinutes: number;
  momentCount: number;
  prayerCount: number;
  readingCount: number;
  gratitudeCount: number;
  calmCount: number;
};

export type LeisureStatistics = {
  readingMinutes: number;
  musicMinutes: number;
  walkMinutes: number;
  cinemaMinutes: number;
  gamesMinutes: number;
  otherMinutes: number;
  totalMinutes: number;
};

function itemPlannedMinutes(item: CalendarItemRecord): number {
  return Math.max(
    0,
    Math.round(
      (new Date(item.ends_at).getTime() - new Date(item.starts_at).getTime()) /
        60_000,
    ),
  );
}

function completedMinutesFromEvent(event: TaskActivityEventRecord): number {
  const metadata = event.metadata ?? {};
  if (typeof metadata.durationCompleted === "number") {
    return Math.round(metadata.durationCompleted);
  }
  return 0;
}

export function aggregateCompletionStatistics({
  calendarItems,
  events,
}: {
  calendarItems: CalendarItemRecord[];
  events: TaskActivityEventRecord[];
}): CompletionStatistics {
  const userAcceptedItems = calendarItems.filter(
    (item) => item.details?.userAccepted === true || item.source === "user",
  );

  const completedEvents = events.filter((event) => event.event_type === "completed");
  const cancelledEvents = events.filter((event) => event.event_type === "cancelled");
  const movedEvents = events.filter((event) => event.event_type === "moved");

  const completedEarlyCount = completedEvents.filter(
    (event) => event.metadata?.completedEarly === true,
  ).length;

  const plannedMinutes = userAcceptedItems.reduce(
    (total, item) => total + itemPlannedMinutes(item),
    0,
  );

  const completedCalendarIds = new Set(
    completedEvents.map((event) => event.calendar_item_id).filter(Boolean),
  );

  let completedMinutes = completedEvents.reduce(
    (total, event) => total + completedMinutesFromEvent(event),
    0,
  );

  for (const item of userAcceptedItems) {
    if (!completedCalendarIds.has(item.id)) continue;
    if (completedEvents.some((event) => event.calendar_item_id === item.id)) {
      continue;
    }
    completedMinutes += itemPlannedMinutes(item);
  }

  const denominator = userAcceptedItems.length + cancelledEvents.length;
  const realizationRate =
    denominator > 0
      ? Math.round((completedEvents.length / denominator) * 100)
      : 0;

  const freeTimeKeptCount = events.filter(
    (event) => event.metadata?.keptFreeSlot === true,
  ).length;

  return {
    completedCount: completedEvents.length,
    completedEarlyCount,
    postponedCount: movedEvents.length,
    cancelledCount: cancelledEvents.length,
    realizationRate,
    plannedMinutes,
    completedMinutes,
    freeTimeKeptCount,
  };
}

export function aggregateWellnessStatistics({
  checkins,
}: {
  checkins: DailyCheckinRecord[];
}): WellnessStatistics {
  if (checkins.length === 0) {
    return {
      averageEnergy: null,
      averageFatigue: null,
      stressedDays: 0,
      checkinDays: 0,
      hasEnoughData: false,
    };
  }

  const energyScores = checkins.map((item) => {
    if (typeof item.intensity === "number") return item.intensity;
    const moodScore: Record<string, number> = {
      great: 5,
      good: 4,
      okay: 3,
      tired: 2,
      exhausted: 1,
      stressed: 2,
      sick: 1,
    };
    return moodScore[item.mood] ?? 3;
  });

  const fatigueScores = checkins.map((item) => {
    const fatigueByMood: Record<string, number> = {
      great: 1,
      good: 1,
      okay: 2,
      tired: 4,
      exhausted: 5,
      stressed: 3,
      sick: 4,
    };
    return fatigueByMood[item.mood] ?? 2;
  });

  const stressedDays = checkins.filter((item) => item.mood === "stressed").length;

  return {
    averageEnergy:
      energyScores.length > 0
        ? Math.round(
            (energyScores.reduce((sum, value) => sum + value, 0) /
              energyScores.length) *
              10,
          ) / 10
        : null,
    averageFatigue:
      fatigueScores.length > 0
        ? Math.round(
            (fatigueScores.reduce((sum, value) => sum + value, 0) /
              fatigueScores.length) *
              10,
          ) / 10
        : null,
    stressedDays,
    checkinDays: checkins.length,
    hasEnoughData: checkins.length >= 3,
  };
}

export function aggregateSpiritualStatistics({
  events,
}: {
  events: TaskActivityEventRecord[];
}): SpiritualStatistics {
  const spiritual = events.filter(
    (event) =>
      event.event_type === "completed" &&
      (event.metadata?.activityCategory === "spiritual" ||
        event.metadata?.spiritualSession === true),
  );

  let prayerCount = 0;
  let readingCount = 0;
  let gratitudeCount = 0;
  let calmCount = 0;
  let totalMinutes = 0;

  for (const event of spiritual) {
    totalMinutes += completedMinutesFromEvent(event);
    const type = String(event.metadata?.spiritualType ?? "");
    if (/prier|prayer/.test(type)) prayerCount += 1;
    else if (/lecture|reading/.test(type)) readingCount += 1;
    else if (/gratitude/.test(type)) gratitudeCount += 1;
    else calmCount += 1;
  }

  return {
    totalMinutes,
    momentCount: spiritual.length,
    prayerCount,
    readingCount,
    gratitudeCount,
    calmCount,
  };
}

export function aggregateLeisureStatistics({
  events,
}: {
  events: TaskActivityEventRecord[];
}): LeisureStatistics {
  const leisure = events.filter(
    (event) =>
      event.event_type === "completed" &&
      (event.metadata?.activityCategory === "leisure" ||
        event.metadata?.leisureActivity === true),
  );

  const buckets = {
    readingMinutes: 0,
    musicMinutes: 0,
    walkMinutes: 0,
    cinemaMinutes: 0,
    gamesMinutes: 0,
    otherMinutes: 0,
  };

  for (const event of leisure) {
    const minutes = completedMinutesFromEvent(event);
    const label = String(event.metadata?.leisureLabel ?? event.metadata?.title ?? "");
    if (/lecture|lire|livre/.test(label)) buckets.readingMinutes += minutes;
    else if (/musique|spotify/.test(label)) buckets.musicMinutes += minutes;
    else if (/promenade|marche/.test(label)) buckets.walkMinutes += minutes;
    else if (/cinema|film/.test(label)) buckets.cinemaMinutes += minutes;
    else if (/jeux|jeu/.test(label)) buckets.gamesMinutes += minutes;
    else buckets.otherMinutes += minutes;
  }

  const totalMinutes = Object.values(buckets).reduce((sum, value) => sum + value, 0);
  return { ...buckets, totalMinutes };
}
