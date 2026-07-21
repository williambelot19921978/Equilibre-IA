/**
 * EPIC 6D — Monthly Reflection Engine.
 */

import type { CoachAdvice, PersonalCoachInput } from "../types/personalCoachTypes";

export function buildMonthlyReflection(
  input: PersonalCoachInput,
  isMonthlyWindow: boolean,
): CoachAdvice | null {
  if (!isMonthlyWindow) return null;

  const habits = input.validatedHabits ?? input.topHabits ?? [];
  const goals = input.activeGoals ?? [];
  const energyTrend = input.trendEnergy7d ?? 0;

  const evolution =
    energyTrend >= 6
      ? "Ton énergie semble en progression."
      : energyTrend >= 4
        ? "Ton rythme reste globalement stable."
        : "Un mois exigeant — sois indulgent avec toi-même.";

  const consolidated =
    habits.length > 0
      ? `Habitudes consolidées : ${habits.slice(0, 3).join(", ")}.`
      : "De nouvelles habitudes peuvent émerger progressivement.";

  const progress =
    goals.length > 0
      ? `Progrès sur ${goals.length} objectif(s) actif(s).`
      : "Tu peux définir un objectif quand tu te sentiras prêt.";

  const improvement =
    energyTrend < 5
      ? "Axe doux : plus de récupération le mois prochain."
      : "Axe doux : maintenir l'équilibre actuel.";

  return {
    id: `monthly-${input.date.slice(0, 7)}`,
    domain: "wellbeing",
    kind: "monthly_reflection",
    title: "Réflexion mensuelle",
    message: [evolution, consolidated, progress, improvement].join(" "),
    explainability: {
      why: "Bilan mensuel non culpabilisant.",
      whyToday: "Début ou fin de mois — moment de recul.",
      expectedImpact: "Visualiser l'évolution sans jugement.",
      confidence: 0.68,
    },
    estimatedSeconds: 90,
  };
}

export function isMonthlyReflectionWindow(date: string): boolean {
  const day = Number(date.slice(8, 10));
  return day <= 3 || day >= 28;
}
