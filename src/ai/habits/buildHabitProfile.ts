import type { CalendarItemRecord } from "../../types/database";
import type { TaskActivityEventRecord } from "../../types/taskActivity";
import type { HabitInsight, HabitProfile } from "../../types/habitProfile";
import { classifyCalendarItemActivity } from "../../lib/planning/classifyCalendarItemActivity";

const WEEKDAY_LABELS = [
  "dimanche",
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
];

function hourBucket(iso: string): "morning" | "afternoon" | "evening" {
  const hour = new Date(iso).getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

function weekdayLabel(iso: string): string {
  return WEEKDAY_LABELS[new Date(iso).getDay()];
}

function pushInsight(
  insights: HabitInsight[],
  insight: Omit<HabitInsight, "lastUpdated">,
): void {
  insights.push({
    ...insight,
    lastUpdated: new Date().toISOString(),
  });
}

export function buildHabitProfileFromHistory({
  userId,
  calendarItems,
  taskActivityEvents,
  userCorrections = {},
}: {
  userId: string;
  calendarItems: CalendarItemRecord[];
  taskActivityEvents: TaskActivityEventRecord[];
  userCorrections?: Record<string, HabitInsight["status"]>;
}): HabitProfile {
  const insights: HabitInsight[] = [];
  const completedEvents = taskActivityEvents.filter(
    (event) => event.event_type === "completed",
  );
  const cancelledEvents = taskActivityEvents.filter(
    (event) => event.event_type === "cancelled",
  );

  const sportCompleted = completedEvents.filter((event) => {
    const meta = event.metadata ?? {};
    return meta.workoutCompleted === true || meta.category === "sport";
  });

  const studyCompleted = completedEvents.filter((event) => {
    const meta = event.metadata ?? {};
    return meta.businessType === "study" || /révis|étude/i.test(String(meta.title ?? ""));
  });

  const sportByWeekday = new Map<string, number>();
  for (const event of sportCompleted) {
    const day = weekdayLabel(event.occurred_at);
    sportByWeekday.set(day, (sportByWeekday.get(day) ?? 0) + 1);
  }

  const topSportDay = [...sportByWeekday.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topSportDay && topSportDay[1] >= 2) {
    const isWeekend = topSportDay[0] === "dimanche" || topSportDay[0] === "samedi";
    pushInsight(insights, {
      id: isWeekend ? "weekend-running" : `sport-${topSportDay[0]}`,
      kind: isWeekend ? "weekend_running" : "preferred_sport_type",
      label: isWeekend
        ? `courir le ${topSportDay[0]}`
        : `sport le ${topSportDay[0]}`,
      detail: isWeekend
        ? `Tu as souvent bougé le ${topSportDay[0]} ces dernières semaines.`
        : `Le ${topSportDay[0]} revient souvent pour ton activité physique.`,
      confidence: Math.min(95, 55 + topSportDay[1] * 8),
      status: userCorrections["weekend-running"] ?? "learned",
      evidenceCount: topSportDay[1],
    });
  }

  const studyMorning = studyCompleted.filter(
    (event) => hourBucket(event.occurred_at) === "morning",
  ).length;
  const studyTotal = studyCompleted.length;
  if (studyTotal >= 2 && studyMorning / studyTotal >= 0.5) {
    pushInsight(insights, {
      id: "revision-morning",
      kind: "revision_morning",
      label: "réviser le matin",
      detail: "Tes révisions se concentrent souvent en matinée.",
      confidence: Math.min(92, 50 + studyMorning * 10),
      status: userCorrections["revision-morning"] ?? "learned",
      evidenceCount: studyMorning,
    });
  }

  const sportDurations: number[] = [];
  for (const item of calendarItems) {
    const classified = classifyCalendarItemActivity(item);
    if (!classified.isSport) continue;
    if (item.details?.status !== "completed") continue;
    const start = new Date(item.starts_at).getTime();
    const end = new Date(item.ends_at).getTime();
    if (end > start) {
      sportDurations.push(Math.round((end - start) / 60_000));
    }
  }

  if (sportDurations.length >= 2) {
    const avg =
      sportDurations.reduce((sum, value) => sum + value, 0) / sportDurations.length;
    const rounded = Math.round(avg / 5) * 5;
    pushInsight(insights, {
      id: "typical-session-duration",
      kind: "typical_session_duration",
      label: `séances d'environ ${rounded} min`,
      detail: `Tes séances terminées durent en moyenne ${rounded} minutes.`,
      confidence: Math.min(90, 45 + sportDurations.length * 8),
      status: userCorrections["typical-session-duration"] ?? "learned",
      evidenceCount: sportDurations.length,
    });
  }

  const eveningCancelled = cancelledEvents.filter(
    (event) => hourBucket(event.occurred_at) === "evening",
  ).length;
  const eveningCompleted = completedEvents.filter(
    (event) => hourBucket(event.occurred_at) === "evening",
  ).length;

  if (eveningCancelled >= 2 && eveningCancelled > eveningCompleted) {
    pushInsight(insights, {
      id: "low-evening-activity",
      kind: "low_evening_activity",
      label: "peu d'activités le soir",
      detail: "Tu annules ou évites souvent les activités en soirée.",
      confidence: Math.min(88, 50 + eveningCancelled * 6),
      status: userCorrections["low-evening-activity"] ?? "learned",
      evidenceCount: eveningCancelled,
    });
  }

  const calmAfterWork = completedEvents.filter((event) => {
    const hour = new Date(event.occurred_at).getHours();
    const title = String(event.metadata?.title ?? "").toLowerCase();
    return hour >= 17 && hour <= 20 && /calme|respiration|pause/.test(title);
  }).length;

  if (calmAfterWork >= 2) {
    pushInsight(insights, {
      id: "calm-after-work",
      kind: "calm_after_work",
      label: "temps calme après le travail",
      detail: "Tu prends parfois un moment calme en fin de journée.",
      confidence: Math.min(85, 45 + calmAfterWork * 10),
      status: userCorrections["calm-after-work"] ?? "learned",
      evidenceCount: calmAfterWork,
    });
  }

  if (cancelledEvents.length >= 3) {
    pushInsight(insights, {
      id: "natural-rhythm",
      kind: "natural_rhythm",
      label: "ajuster quand ça ne passe pas",
      detail: "Tu préfères annuler ou décaler plutôt que forcer — c'est cohérent avec ton rythme.",
      confidence: 60,
      status: userCorrections["natural-rhythm"] ?? "learned",
      evidenceCount: cancelledEvents.length,
    });
  }

  return {
    userId,
    insights: insights
      .filter((insight) => insight.status !== "rejected")
      .sort((a, b) => b.confidence - a.confidence),
    updatedAt: new Date().toISOString(),
  };
}

export function applyHabitInsightCorrection(
  profile: HabitProfile,
  insightId: string,
  status: "confirmed" | "rejected" | "deferred",
): HabitProfile {
  return {
    ...profile,
    insights: profile.insights
      .map((insight) =>
        insight.id === insightId
          ? {
              ...insight,
              status,
              confidence:
                status === "confirmed"
                  ? Math.min(98, insight.confidence + 10)
                  : status === "rejected"
                    ? Math.max(5, Math.round(insight.confidence * 0.15))
                    : status === "deferred"
                      ? Math.max(10, insight.confidence - 8)
                      : insight.confidence,
              lastUpdated: new Date().toISOString(),
            }
          : insight,
      )
      .filter((insight) => insight.status !== "rejected"),
    updatedAt: new Date().toISOString(),
  };
}
