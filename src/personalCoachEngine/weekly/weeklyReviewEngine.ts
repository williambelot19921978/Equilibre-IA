/**
 * EPIC 6D — Weekly Review Engine (~1 minute summary).
 */

import type { CoachAdvice, PersonalCoachInput } from "../types/personalCoachTypes";

export function buildWeeklyReview(input: PersonalCoachInput, isWeeklyWindow: boolean): CoachAdvice | null {
  if (!isWeeklyWindow) return null;

  const energyTrend = input.trendEnergy7d ?? 0;
  const stressTrend = input.trendStress7d ?? 0;
  const goals = input.activeGoals ?? [];

  const successes: string[] = [];
  if (energyTrend >= 6) successes.push("Énergie globalement stable cette semaine.");
  if ((input.validatedHabits ?? []).length > 0) {
    successes.push("Tes habitudes validées restent actives.");
  }
  if (successes.length === 0) successes.push("Tu as traversé la semaine — c'est déjà beaucoup.");

  const difficulties: string[] = [];
  if (stressTrend >= 6) difficulties.push("Stress un peu élevé en moyenne.");
  if (energyTrend > 0 && energyTrend < 5) difficulties.push("Fatigue récurrente observée.");

  const balance =
    energyTrend >= 6 && stressTrend <= 5
      ? "Équilibre globalement préservé."
      : "Quelques ajustements pourraient aider la semaine prochaine.";

  const recommendations: string[] = [];
  if (goals[0]) {
    recommendations.push(`Continuer « ${goals[0].name} » par petits pas.`);
  }
  recommendations.push("Préserver un créneau de récupération.");

  const body = [
    successes[0],
    difficulties[0] ?? "Pas de difficulté majeure signalée.",
    balance,
    recommendations.slice(0, 2).join(" "),
  ]
    .filter(Boolean)
    .join(" ");

  return {
    id: `weekly-${input.date}`,
    domain: "wellbeing",
    kind: "weekly_review",
    title: "Revue hebdomadaire",
    message: body,
    explainability: {
      why: "Synthèse bienveillante de la semaine écoulée.",
      whyToday: "Fenêtre hebdomadaire (dimanche ou fin de semaine).",
      goalName: goals[0]?.name,
      expectedImpact: "Prendre du recul sans culpabilité.",
      confidence: 0.7,
    },
    estimatedSeconds: 60,
  };
}

export function isWeeklyReviewWindow(date: string, now?: string): boolean {
  const reference = new Date(now ?? `${date}T12:00:00.000Z`);
  const day = reference.getDay();
  return day === 0 || day === 6;
}
