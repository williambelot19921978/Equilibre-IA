import type { LivingMemory } from "../../types/livingMemory";
import type { HabitProfile } from "../../types/habitProfile";
import type { LifeContext } from "../../types/lifeContext";
import type { WeeklyReview } from "../../types/weeklyReview";

export type ProactiveCoachMessage = {
  id: string;
  period: "morning" | "evening" | "weekly";
  greeting: string;
  body: string;
  suggestion?: string;
};

export function generateProactiveCoachMessage({
  firstName,
  referenceDate,
  hour,
  lifeContext,
  habitProfile,
  livingMemory,
  weeklyReview,
}: {
  firstName: string;
  referenceDate: string;
  hour: number;
  lifeContext?: LifeContext | null;
  habitProfile?: HabitProfile | null;
  livingMemory?: LivingMemory | null;
  weeklyReview?: WeeklyReview | null;
}): ProactiveCoachMessage | null {
  const personality =
    livingMemory?.coachPersonality ??
    "Je découvre encore ton fonctionnement.";
  const isSunday = new Date(`${referenceDate}T12:00:00`).getDay() === 0;

  if (isSunday && weeklyReview && hour >= 17) {
    return {
      id: `weekly-${referenceDate}`,
      period: "weekly",
      greeting: `Bon dimanche ${firstName}.`,
      body: [
        personality,
        weeklyReview.balanceSummary,
        weeklyReview.successes[0],
        weeklyReview.priority,
      ].join(" "),
      suggestion: weeklyReview.advice[0],
    };
  }

  if (hour >= 5 && hour < 11) {
    const dayHint = lifeContext?.dayTypeReason ?? "Journée à composer ensemble.";
    const energyHint =
      lifeContext?.energyPrediction === "low"
        ? "Ton énergie semble fragile — je privilégierai des propositions légères."
        : "Tu as de la marge pour avancer sur une priorité.";

    const habitHint = livingMemory?.recentlyLearned[0]
      ? `Récemment : ${livingMemory.recentlyLearned[0].detail}`
      : habitProfile?.insights[0]
        ? `Je me souviens que tu préfères ${habitProfile.insights[0].label}.`
        : "";

    const missionHint = livingMemory?.dailyMission
      ? `Mission du jour : ${livingMemory.dailyMission.description}`
      : "";

    return {
      id: `morning-${referenceDate}`,
      period: "morning",
      greeting: `Bonjour ${firstName}.`,
      body: [personality, dayHint, energyHint, habitHint, missionHint]
        .filter(Boolean)
        .join(" "),
      suggestion: lifeContext?.studyPossible
        ? "Si tu as un créneau calme, une courte révision pourrait bien passer."
        : "Dis-moi si quelque chose change pour ta journée.",
    };
  }

  if (hour >= 18 && hour <= 23) {
    const done = lifeContext?.workoutCompletedToday
      ? "Bravo pour ta séance sport aujourd'hui."
      : lifeContext?.activityCompletion?.studyDone
        ? "Tu as avancé sur tes études — bien joué."
        : "Ta journée mérite d'être refermée sans pression.";

    const adaptHint = livingMemory?.adaptiveSuggestions[0]?.message;

    return {
      id: `evening-${referenceDate}`,
      period: "evening",
      greeting: `Bonsoir ${firstName}.`,
      body: [personality, done, adaptHint].filter(Boolean).join(" "),
      suggestion:
        lifeContext?.freeEvening && !lifeContext.workoutCompletedToday
          ? "Demain je peux te proposer une micro-séance si tu veux."
          : "Demain matin je t'aiderai à ajuster la journée.",
    };
  }

  return null;
}
