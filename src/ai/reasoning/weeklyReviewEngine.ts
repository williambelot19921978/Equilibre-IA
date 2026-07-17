import type { PeriodStatistics } from "../../lib/statistics/getStatisticsForPeriod";
import type { WeeklyReview } from "../../types/weeklyReview";
import { computeBalanceScore } from "../../lib/statistics/computeBalanceAndTrends";
import { formatStudyMinutesLabel } from "../../lib/planning/getWeeklyStudyProgress";

export function generateWeeklyReview(stats: PeriodStatistics): WeeklyReview {
  const balance = computeBalanceScore(stats);
  const goalsReached: string[] = [];
  const goalsMissed: string[] = [];

  if (stats.study.progressPercent >= 100) {
    goalsReached.push("Objectif de révision atteint");
  } else if (stats.study.weeklyGoalMinutes > 0) {
    goalsMissed.push(
      `Révision : ${stats.study.progressPercent} % de l'objectif (${formatStudyMinutesLabel(stats.study.completedMinutes)} effectués)`,
    );
  }

  if (stats.workout.completedSessions >= 2) {
    goalsReached.push(`${stats.workout.completedSessions} séances sport terminées`);
  } else if (stats.workout.sessionCount > 0) {
    goalsMissed.push("Peu de séances sport cette semaine");
  }

  if (stats.completion.completedCount >= 3) {
    goalsReached.push(`${stats.completion.completedCount} activités terminées`);
  }

  const fatigueSummary =
    stats.wellness.stressedDays > 0
      ? `${stats.wellness.stressedDays} jour(s) stressé(s) signalé(s) — prévoir plus de marge.`
      : stats.wellness.hasEnoughData
        ? "Énergie globalement stable cette semaine."
        : "Peu de check-ins — difficile d'évaluer la fatigue.";

  const progressSummary = [
    stats.study.sessionCount > 0
      ? `${formatStudyMinutesLabel(stats.study.completedMinutes)} de révision`
      : null,
    stats.workout.completedSessions > 0
      ? `${stats.workout.completedSessions} séance(s) sport`
      : null,
    stats.spiritual.momentCount > 0
      ? `${stats.spiritual.momentCount} moment(s) spirituel(s)`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const successes = [
    stats.completion.completedCount > 0
      ? `Tu as terminé ${stats.completion.completedCount} activité(s) planifiée(s).`
      : "Tu as gardé de la marge dans ton planning — parfois c'est la bonne décision.",
    stats.study.completedMinutes > 0
      ? `Tu as avancé sur tes études (${formatStudyMinutesLabel(stats.study.completedMinutes)}).`
      : "Tu as protégé du temps pour toi.",
    stats.workout.completedSessions > 0
      ? "Tu as bougé plusieurs fois — bravo pour la régularité."
      : "Tu as su ajuster quand une activité ne passait pas.",
  ].slice(0, 3);

  const advice = [
    stats.study.progressPercent < 70 && stats.study.weeklyGoalMinutes > 0
      ? "Bloquer un petit créneau de révision en matinée pourrait t'aider."
      : "Continue à garder des créneaux calmes sans les remplir par obligation.",
    stats.workout.completedSessions < 2
      ? "Une micro-séance de 15 minutes suffit pour relancer le sport."
      : "Alterne séances courtes et récupération pour tenir sur la durée.",
    balance.globalScore < 55
      ? "Choisis une seule priorité cette semaine plutôt que tout améliorer d'un coup."
      : "Ton équilibre progresse — garde ce qui fonctionne.",
  ].slice(0, 3);

  const priority =
    stats.study.progressPercent < 60 && stats.study.weeklyGoalMinutes > 0
      ? "Priorité : une révision courte mais régulière."
      : stats.workout.completedSessions < 1
        ? "Priorité : une séance sport légère."
        : "Priorité : préserver du repos réel en fin de journée.";

  return {
    weekLabel: stats.label,
    startDate: stats.start.slice(0, 10),
    endDate: stats.end.slice(0, 10),
    goalsReached,
    goalsMissed,
    fatigueSummary,
    progressSummary: progressSummary || "Semaine encore légère en données.",
    balanceSummary: `Score d'équilibre : ${balance.globalScore}/100`,
    successes,
    advice,
    priority,
    tone: "encouraging",
  };
}

export function isWeeklyReviewDay(referenceDate: string): boolean {
  return new Date(`${referenceDate}T12:00:00`).getDay() === 0;
}
