import type { PeriodStatistics } from "./getStatisticsForPeriod";
import type { BalanceScore } from "../../types/balanceScore";

export type StatisticsTrends = {
  completionTrend: "up" | "down" | "stable";
  studyTrend: "up" | "down" | "stable";
  sportTrend: "up" | "down" | "stable";
  regularityScore: number;
  bestDayLabel: string;
  worstDayLabel: string;
  timeGainedMinutes: number;
  timeLostMinutes: number;
  postponementCount: number;
  cancellationCount: number;
  accomplishmentCount: number;
  goalsReachedCount: number;
};

export function computeStatisticsTrends(
  stats: PeriodStatistics,
): StatisticsTrends {
  const realization = stats.completion.realizationRate;
  const studyProgress = stats.study.progressPercent;
  const sportSessions = stats.workout.completedSessions;

  return {
    completionTrend:
      realization >= 70 ? "up" : realization >= 40 ? "stable" : "down",
    studyTrend:
      studyProgress >= 70 ? "up" : studyProgress >= 35 ? "stable" : "down",
    sportTrend:
      sportSessions >= 3 ? "up" : sportSessions >= 1 ? "stable" : "down",
    regularityScore: Math.min(
      100,
      Math.round(realization * 0.6 + Math.min(sportSessions, 5) * 6),
    ),
    bestDayLabel:
      sportSessions + stats.study.sessionCount > 0
        ? "Jour avec le plus d'activités terminées"
        : "—",
    worstDayLabel:
      stats.completion.cancelledCount > 0 ? "Jour avec le plus d'annulations" : "—",
    timeGainedMinutes: stats.completion.completedEarlyCount * 15,
    timeLostMinutes: stats.completion.cancelledCount * 20,
    postponementCount: stats.study.postponedSessions + stats.completion.postponedCount,
    cancellationCount:
      stats.completion.cancelledCount + stats.workout.cancelledSessions,
    accomplishmentCount: stats.completion.completedCount,
    goalsReachedCount:
      (stats.study.progressPercent >= 100 ? 1 : 0) +
      (stats.workout.completedSessions >= 2 ? 1 : 0),
  };
}

export function computeBalanceScore(stats: PeriodStatistics): BalanceScore {
  const sport = Math.min(
    100,
    stats.workout.completedSessions * 18 + stats.workout.totalMinutes / 5,
  );
  const study = Math.min(100, stats.study.progressPercent);
  const spiritual = Math.min(100, stats.spiritual.momentCount * 25);
  const leisure = Math.min(100, stats.leisure.totalMinutes / 3);
  const rest = Math.min(
    100,
    stats.wellness.checkinDays * 12 +
      (stats.wellness.averageEnergy ?? 3) * 12,
  );
  const family = Math.min(100, stats.leisure.walkMinutes / 2);
  const couple = Math.min(100, stats.leisure.otherMinutes / 4);
  const admin = Math.min(100, stats.completion.completedCount * 4);
  const sleep = Math.min(100, stats.wellness.checkinDays * 10);

  const categories = [
    {
      category: "sport" as const,
      label: "Sport",
      score: Math.round(sport),
      summary:
        stats.workout.completedSessions > 0
          ? `${stats.workout.completedSessions} séance(s) cette période`
          : "Peu de mouvement enregistré",
    },
    {
      category: "sleep" as const,
      label: "Sommeil & ressenti",
      score: Math.round(sleep),
      summary: `${stats.wellness.checkinDays} check-in(s)`,
    },
    {
      category: "study" as const,
      label: "Études",
      score: Math.round(study),
      summary: `${stats.study.progressPercent} % de l'objectif`,
    },
    {
      category: "family" as const,
      label: "Famille",
      score: Math.round(family),
      summary: `${stats.leisure.walkMinutes} min de promenades`,
    },
    {
      category: "couple" as const,
      label: "Couple",
      score: Math.round(couple),
      summary: `${stats.leisure.otherMinutes} min d'activités diverses`,
    },
    {
      category: "spiritual" as const,
      label: "Spiritualité",
      score: Math.round(spiritual),
      summary: `${stats.spiritual.momentCount} moment(s)`,
    },
    {
      category: "rest" as const,
      label: "Repos",
      score: Math.round(rest),
      summary: "Basé sur calme et humeur",
    },
    {
      category: "admin" as const,
      label: "Administration",
      score: Math.round(admin),
      summary: `${stats.completion.completedCount} activité(s) terminée(s)`,
    },
    {
      category: "leisure" as const,
      label: "Loisirs",
      score: Math.round(leisure),
      summary: `${stats.leisure.totalMinutes} min`,
    },
  ];

  const globalScore = Math.round(
    categories.reduce((sum, item) => sum + item.score, 0) / categories.length,
  );

  return {
    globalScore,
    categories,
    computedAt: new Date().toISOString(),
  };
}
