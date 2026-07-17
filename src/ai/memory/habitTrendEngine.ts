import type { CalendarItemRecord } from "../../types/database";
import type { TaskActivityEventRecord } from "../../types/taskActivity";
import type { HabitTrend, LivingHabitProfile } from "../../types/livingMemory";
import { classifyCalendarItemActivity } from "../../lib/planning/classifyCalendarItemActivity";
import {
  clampConfidence,
  hourBucket,
  hourFromIso,
  isAdminEvent,
  isSportEvent,
  isStudyEvent,
  roundDuration,
  weekdayLabel,
} from "./livingMemoryUtils";

export type DetectHabitTrendsInput = {
  calendarItems: CalendarItemRecord[];
  taskActivityEvents: TaskActivityEventRecord[];
  habitProfile: LivingHabitProfile;
};

function splitByHalf<T extends { occurred_at?: string; starts_at?: string }>(
  events: T[],
  dateField: "occurred_at" | "starts_at",
): { recent: T[]; older: T[] } {
  if (events.length < 4) {
    return { recent: events, older: [] };
  }
  const sorted = [...events].sort(
    (a, b) =>
      new Date(String(a[dateField])).getTime() -
      new Date(String(b[dateField])).getTime(),
  );
  const midpoint = Math.floor(sorted.length / 2);
  return {
    older: sorted.slice(0, midpoint),
    recent: sorted.slice(midpoint),
  };
}

export function detectHabitTrends({
  calendarItems,
  taskActivityEvents,
  habitProfile,
}: DetectHabitTrendsInput): HabitTrend[] {
  const trends: HabitTrend[] = [];
  const completedEvents = taskActivityEvents.filter(
    (event) => event.event_type === "completed",
  );
  const cancelledEvents = taskActivityEvents.filter(
    (event) => event.event_type === "cancelled",
  );

  const studyCompleted = completedEvents.filter((event) =>
    isStudyEvent(event.metadata ?? {}),
  );
  const { recent: recentStudy, older: olderStudy } = splitByHalf(
    studyCompleted,
    "occurred_at",
  );
  const recentStudyMorning =
    recentStudy.filter((event) => hourBucket(event.occurred_at) === "morning")
      .length / Math.max(recentStudy.length, 1);
  const olderStudyMorning =
    olderStudy.filter((event) => hourBucket(event.occurred_at) === "morning")
      .length / Math.max(olderStudy.length, 1);

  if (studyCompleted.length >= 3) {
    if (recentStudyMorning >= 0.5 && recentStudyMorning >= olderStudyMorning) {
      trends.push({
        id: "trend-study-morning",
        direction: "improving",
        label: "Révisions du matin plus efficaces",
        detail: "Tes révisions se concentrent de plus en plus en matinée.",
        confidence: clampConfidence(55 + studyCompleted.length * 6),
        evidence: [
          `${Math.round(recentStudyMorning * 100)} % des récentes révisions le matin`,
          `${studyCompleted.length} sessions terminées analysées`,
        ],
      });
    }
  }

  const sportEveningCancelled = cancelledEvents.filter((event) => {
    if (!isSportEvent(event.metadata ?? {})) return false;
    const hour = hourFromIso(event.occurred_at);
    return hour >= 20;
  }).length;
  const sportEveningCompleted = completedEvents.filter((event) => {
    if (!isSportEvent(event.metadata ?? {})) return false;
    return hourFromIso(event.occurred_at) >= 20;
  }).length;

  if (sportEveningCancelled >= 2 && sportEveningCancelled > sportEveningCompleted) {
    trends.push({
      id: "trend-sport-late-evening",
      direction: "degrading",
      label: "Sport après 20 h rarement terminé",
      detail: "Les séances tardives sont souvent annulées ou décalées.",
      confidence: clampConfidence(58 + sportEveningCancelled * 8),
      evidence: [
        `${sportEveningCancelled} annulations après 20 h`,
        `${sportEveningCompleted} séances terminées après 20 h`,
      ],
    });
  }

  const sportByDay = new Map<string, number>();
  for (const event of completedEvents.filter((item) =>
    isSportEvent(item.metadata ?? {}),
  )) {
    const day = weekdayLabel(event.occurred_at);
    sportByDay.set(day, (sportByDay.get(day) ?? 0) + 1);
  }
  const topDay = [...sportByDay.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topDay && topDay[1] >= 2) {
    trends.push({
      id: `trend-best-day-${topDay[0]}`,
      direction: "stable",
      label: `Le ${topDay[0]} est ton meilleur jour`,
      detail: `Tu termines le plus souvent ton sport le ${topDay[0]}.`,
      confidence: clampConfidence(60 + topDay[1] * 7),
      evidence: [`${topDay[1]} séances terminées le ${topDay[0]}`],
    });
  }

  const sportDurations: number[] = [];
  for (const item of calendarItems) {
    const classified = classifyCalendarItemActivity(item);
    if (!classified.isSport) continue;
    const start = new Date(item.starts_at).getTime();
    const end = new Date(item.ends_at).getTime();
    if (end > start) {
      sportDurations.push(Math.round((end - start) / 60_000));
    }
  }
  const shortened = taskActivityEvents.filter(
    (event) => event.event_type === "shortened" && isSportEvent(event.metadata ?? {}),
  );
  if (sportDurations.length >= 3 && shortened.length >= 2) {
    const avg = roundDuration(
      sportDurations.reduce((sum, value) => sum + value, 0) / sportDurations.length,
    );
    trends.push({
      id: "trend-sport-shortened",
      direction: "degrading",
      label: `Les séances de ${avg + 15} minutes sont souvent raccourcies`,
      detail: `Tes séances longues finissent souvent plus tôt que prévu.`,
      confidence: clampConfidence(52 + shortened.length * 8),
      evidence: [
        `${shortened.length} raccourcissements enregistrés`,
        `Durée moyenne terminée : ${avg} min`,
      ],
    });
  }

  const adminMoved = taskActivityEvents.filter(
    (event) =>
      (event.event_type === "moved" || event.event_type === "cancelled") &&
      isAdminEvent(event.metadata ?? {}),
  ).length;
  if (adminMoved >= 2) {
    trends.push({
      id: "trend-admin-postpone",
      direction: "stable",
      label: "Tâches administratives souvent reportées",
      detail: "Les démarches admin reviennent souvent en report.",
      confidence: clampConfidence(50 + adminMoved * 8),
      evidence: [`${adminMoved} reports ou annulations admin`],
    });
  }

  if (habitProfile.preferredWorkoutDuration && habitProfile.averageWorkoutDuration) {
    const preferred = habitProfile.preferredWorkoutDuration.value;
    const completionRate =
      completedEvents.filter((event) => isSportEvent(event.metadata ?? {})).length /
      Math.max(
        completedEvents.filter((event) => isSportEvent(event.metadata ?? {})).length +
          cancelledEvents.filter((event) => isSportEvent(event.metadata ?? {})).length,
        1,
      );
    if (completionRate >= 0.7) {
      trends.push({
        id: "trend-sport-duration-stable",
        direction: "stable",
        label: `Tu réalises ${Math.round(completionRate * 100)} % de tes séances de ${preferred} minutes`,
        detail: "Cette durée semble bien calibrée pour toi.",
        confidence: clampConfidence(60 + completionRate * 30),
        evidence: [
          `${Math.round(completionRate * 100)} % de complétion`,
          `Durée typique : ${preferred} min`,
        ],
      });
    }
  }

  return trends.sort((a, b) => b.confidence - a.confidence);
}
