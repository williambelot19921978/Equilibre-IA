import type { CalendarItemRecord } from "../../types/database";
import type { DailyCheckinRecord } from "../../types/dailyCheckin";
import type { TaskActivityEventRecord } from "../../types/taskActivity";
import type {
  HabitTrend,
  LivingHabitProfile,
  LivingInsight,
  LivingInsightStatus,
} from "../../types/livingMemory";
import { buildHabitProfileFromHistory } from "../habits/buildHabitProfile";
import {
  hourBucket,
  hourFromIso,
  isSportEvent,
  isStudyEvent,
  weekdayLabel,
} from "./livingMemoryUtils";

export type GenerateLivingInsightsInput = {
  userId: string;
  calendarItems: CalendarItemRecord[];
  taskActivityEvents: TaskActivityEventRecord[];
  checkins: DailyCheckinRecord[];
  habitProfile: LivingHabitProfile;
  trends: HabitTrend[];
  userCorrections?: Record<string, LivingInsightStatus>;
  insightMeta?: Record<string, { firstSeen?: string; lastConfirmed?: string }>;
};

function oldestIso(dates: string[]): string {
  if (dates.length === 0) return new Date().toISOString();
  return dates.sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime(),
  )[0]!;
}

function mapLegacyStatus(
  status: "learned" | "confirmed" | "rejected" | "deferred",
): LivingInsightStatus {
  return status;
}

export function generateLivingInsights(
  input: GenerateLivingInsightsInput,
): LivingInsight[] {
  const {
    userId,
    calendarItems,
    taskActivityEvents,
    checkins,
    habitProfile,
    trends,
    userCorrections = {},
    insightMeta = {},
  } = input;

  const legacyProfile = buildHabitProfileFromHistory({
    userId,
    calendarItems,
    taskActivityEvents,
    userCorrections: Object.fromEntries(
      Object.entries(userCorrections).filter(
        ([, status]) => status === "confirmed" || status === "rejected",
      ),
    ) as Record<string, "learned" | "confirmed" | "rejected">,
  });

  const insights: LivingInsight[] = legacyProfile.insights.map((insight) => {
    const status =
      userCorrections[insight.id] ?? mapLegacyStatus(insight.status);
    const meta = insightMeta[insight.id];
    const trend = trends.find((item) =>
      item.label.toLowerCase().includes(insight.label.split(" ")[0] ?? ""),
    );

    return {
      id: insight.id,
      category: insight.kind,
      label: insight.label,
      detail: insight.detail,
      reasoning: `Basé sur ${insight.evidenceCount} observation(s) récente(s) dans ton historique.`,
      evidence: [
        `${insight.evidenceCount} événements analysés`,
        `Confiance initiale : ${Math.round(insight.confidence)} %`,
      ],
      confidence:
        status === "rejected"
          ? Math.max(5, Math.round(insight.confidence * 0.15))
          : status === "confirmed"
            ? Math.min(98, insight.confidence + 10)
            : insight.confidence,
      firstSeen: meta?.firstSeen ?? insight.lastUpdated,
      lastConfirmed:
        status === "confirmed"
          ? meta?.lastConfirmed ?? new Date().toISOString()
          : meta?.lastConfirmed ?? insight.lastUpdated,
      evidenceCount: insight.evidenceCount,
      status,
      trend: trend?.direction,
    };
  });

  const completedEvents = taskActivityEvents.filter(
    (event) => event.event_type === "completed",
  );
  const sportCompleted = completedEvents.filter((event) =>
    isSportEvent(event.metadata ?? {}),
  );
  const studyCompleted = completedEvents.filter((event) =>
    isStudyEvent(event.metadata ?? {}),
  );

  if (habitProfile.preferredWorkoutDuration && sportCompleted.length >= 2) {
    const duration = habitProfile.preferredWorkoutDuration.value;
    const completionTrend = trends.find((trend) =>
      trend.id.startsWith("trend-sport-duration"),
    );
    if (completionTrend) {
      insights.push({
        id: "insight-sport-completion-rate",
        category: "sport_completion",
        label: `séances de ${duration} minutes`,
        detail: completionTrend.detail,
        reasoning:
          "Je compare tes séances terminées et annulées sur cette durée.",
        evidence: completionTrend.evidence,
        confidence: completionTrend.confidence,
        firstSeen: oldestIso(sportCompleted.map((event) => event.occurred_at)),
        lastConfirmed: new Date().toISOString(),
        evidenceCount: sportCompleted.length,
        status: userCorrections["insight-sport-completion-rate"] ?? "learned",
        trend: completionTrend.direction,
      });
    }
  }

  const adminTrend = trends.find((trend) => trend.id === "trend-admin-postpone");
  if (adminTrend) {
    insights.push({
      id: "insight-admin-postpone",
      category: "organization",
      label: "reports sur l'administratif",
      detail: adminTrend.detail,
      reasoning: "Les tâches admin sont souvent décalées dans ton historique.",
      evidence: adminTrend.evidence,
      confidence: adminTrend.confidence,
      firstSeen: new Date().toISOString(),
      lastConfirmed: new Date().toISOString(),
      evidenceCount: 2,
      status: userCorrections["insight-admin-postpone"] ?? "learned",
      trend: adminTrend.direction,
    });
  }

  const sportDays = new Set(
    sportCompleted.map((event) => event.occurred_at.slice(0, 10)),
  );
  const goodSleepDays = checkins.filter(
    (checkin) => checkin.mood === "great" || checkin.mood === "good",
  );
  const sportAndGoodSleep = goodSleepDays.filter((checkin) =>
    sportDays.has(checkin.checkin_date),
  ).length;
  if (sportCompleted.length >= 2 && goodSleepDays.length >= 3) {
    const ratio = sportAndGoodSleep / Math.max(goodSleepDays.length, 1);
    if (ratio >= 0.45) {
      insights.push({
        id: "insight-sport-sleep",
        category: "wellbeing",
        label: "meilleur sommeil après le sport",
        detail: "Tu dors mieux les jours où tu fais du sport.",
        reasoning:
          "Je croise tes check-ins de forme et tes séances terminées.",
        evidence: [
          `${sportAndGoodSleep} journées sport + bonne forme`,
          `${goodSleepDays.length} check-ins positifs analysés`,
        ],
        confidence: Math.min(88, 50 + sportAndGoodSleep * 8),
        firstSeen: oldestIso(checkins.map((checkin) => checkin.created_at)),
        lastConfirmed: new Date().toISOString(),
        evidenceCount: sportAndGoodSleep,
        status: userCorrections["insight-sport-sleep"] ?? "learned",
        trend: "improving",
      });
    }
  }

  const studyBeforeDinner = studyCompleted.filter((event) => {
    const hour = hourFromIso(event.occurred_at);
    return hour >= 16 && hour <= 19;
  }).length;
  if (studyCompleted.length >= 2 && studyBeforeDinner / studyCompleted.length >= 0.4) {
    insights.push({
      id: "insight-study-before-dinner",
      category: "study_timing",
      label: "réviser avant le dîner",
      detail: "Tu sembles préférer réviser avant le dîner.",
      reasoning: "Tes révisions terminées se concentrent en fin d'après-midi.",
      evidence: [
        `${studyBeforeDinner} révisions entre 16 h et 19 h`,
        `${studyCompleted.length} sessions analysées`,
      ],
      confidence: Math.min(85, 48 + studyBeforeDinner * 10),
      firstSeen: oldestIso(studyCompleted.map((event) => event.occurred_at)),
      lastConfirmed: new Date().toISOString(),
      evidenceCount: studyBeforeDinner,
      status: userCorrections["insight-study-before-dinner"] ?? "learned",
      trend: "stable",
    });
  }

  const eveningStudy = studyCompleted.filter(
    (event) => hourBucket(event.occurred_at) === "evening",
  ).length;
  if (
    habitProfile.preferredStudyTime?.value === "morning" &&
    eveningStudy >= 2
  ) {
    insights.push({
      id: "insight-study-evening-struggle",
      category: "study_timing",
      label: "révisions du soir plus difficiles",
      detail: "Les révisions tardives sont moins souvent terminées.",
      reasoning:
        "Ton profil matinal contraste avec des abandons en soirée.",
      evidence: [
        `${eveningStudy} tentatives en soirée`,
        `Fenêtre préférée : ${habitProfile.preferredStudyTime.value}`,
      ],
      confidence: 62,
      firstSeen: oldestIso(studyCompleted.map((event) => event.occurred_at)),
      lastConfirmed: new Date().toISOString(),
      evidenceCount: eveningStudy,
      status: userCorrections["insight-study-evening-struggle"] ?? "learned",
      trend: "degrading",
    });
  }

  const topSportDay = habitProfile.preferredWorkoutDay?.value;
  if (topSportDay) {
    insights.push({
      id: `insight-best-day-${topSportDay}`,
      category: "sport_day",
      label: `sport le ${topSportDay}`,
      detail: `Le ${topSportDay} revient souvent pour ton activité physique.`,
      reasoning: "J'observe la répartition de tes séances terminées.",
      evidence: [
        `${habitProfile.preferredWorkoutDay?.sampleSize ?? 0} séances ce jour-là`,
      ],
      confidence: habitProfile.preferredWorkoutDay?.confidence ?? 60,
      firstSeen: oldestIso(
        sportCompleted
          .filter((event) => weekdayLabel(event.occurred_at) === topSportDay)
          .map((event) => event.occurred_at),
      ),
      lastConfirmed: new Date().toISOString(),
      evidenceCount: habitProfile.preferredWorkoutDay?.sampleSize ?? 0,
      status: userCorrections[`insight-best-day-${topSportDay}`] ?? "learned",
      trend: "stable",
    });
  }

  const deduped = new Map<string, LivingInsight>();
  for (const insight of insights) {
    if (insight.status === "rejected") continue;
    deduped.set(insight.id, insight);
  }

  return [...deduped.values()].sort((a, b) => b.confidence - a.confidence);
}

export function partitionInsights(insights: LivingInsight[]): {
  recentlyLearned: LivingInsight[];
  stillLearning: LivingInsight[];
  uncertain: LivingInsight[];
} {
  const recentlyLearned = insights.filter(
    (insight) => insight.confidence >= 75 && insight.status !== "deferred",
  );
  const uncertain = insights.filter(
    (insight) =>
      insight.confidence < 55 ||
      insight.status === "deferred" ||
      insight.status === "learned" && insight.evidenceCount <= 2,
  );
  const stillLearning = insights.filter(
    (insight) =>
      !recentlyLearned.includes(insight) && !uncertain.includes(insight),
  );

  return { recentlyLearned, stillLearning, uncertain };
}

export function applyLivingInsightFeedback(
  insights: LivingInsight[],
  insightId: string,
  status: LivingInsightStatus,
): LivingInsight[] {
  return insights
    .map((insight) => {
      if (insight.id !== insightId) return insight;
      const now = new Date().toISOString();
      if (status === "rejected") {
        return {
          ...insight,
          status,
          confidence: Math.max(5, Math.round(insight.confidence * 0.15)),
          lastConfirmed: now,
        };
      }
      if (status === "confirmed") {
        return {
          ...insight,
          status,
          confidence: Math.min(98, insight.confidence + 12),
          lastConfirmed: now,
        };
      }
      if (status === "deferred") {
        return {
          ...insight,
          status,
          confidence: Math.max(10, insight.confidence - 8),
          lastConfirmed: now,
        };
      }
      return { ...insight, status, lastConfirmed: now };
    })
    .filter((insight) => insight.status !== "rejected");
}
