/**
 * EPIC 6D — Recovery Engine.
 */

import type { CoachAdvice, PersonalCoachInput } from "../types/personalCoachTypes";

export function detectRecoveryNeeds(input: PersonalCoachInput): CoachAdvice[] {
  const recovery: CoachAdvice[] = [];
  const energy = input.dailyEnergy ?? 5;
  const stress = input.dailyStress ?? 5;
  const mentalLoad = input.mentalLoad ?? 50;
  const skipStreak = input.skipStreak ?? 0;
  const mood = input.dailyMood ?? "";

  const isFatigued =
    energy <= 4 ||
    mood === "tired" ||
    mood === "very_tired" ||
    (input.trendEnergy7d ?? 10) <= 4;

  const isOverloaded = mentalLoad >= 75 || stress >= 8 || (input.conflictCount ?? 0) >= 2;

  if (isFatigued) {
    recovery.push({
      id: `recovery-fatigue-${input.date}`,
      domain: "sleep_recovery",
      kind: "recovery",
      title: "Fatigue détectée",
      message: "Ta journée mérite d'être allégée — je te propose de simplifier.",
      suggestion: "Reporter une tâche non urgente ou prévoir une pause.",
      explainability: {
        why: "Fatigue déclarée ou tendance basse.",
        whyToday: `Énergie ${energy}/10${skipStreak >= 3 ? ", plusieurs jours difficiles" : ""}.`,
        expectedImpact: "Prévenir l'accumulation.",
        confidence: 0.85,
      },
      estimatedSeconds: 25,
    });
  }

  if (isOverloaded) {
    recovery.push({
      id: `recovery-overload-${input.date}`,
      domain: "mental_load",
      kind: "recovery",
      title: "Surcharge perçue",
      message: "Tu sembles sous pression — alléger serait une bonne option.",
      suggestion: "Choisis une chose à reporter ou à déléguer.",
      explainability: {
        why: "Charge mentale ou stress élevés.",
        whyToday: `Charge ${mentalLoad}%, stress ${stress}/10.`,
        expectedImpact: "Retrouver de l'espace mental.",
        confidence: 0.82,
      },
      estimatedSeconds: 25,
    });
  }

  if (skipStreak >= 3 && !isFatigued) {
    recovery.push({
      id: `recovery-checkin-${input.date}`,
      domain: "wellbeing",
      kind: "recovery",
      title: "Prendre un instant",
      message: "Quelques jours intenses — un check-in rapide peut aider à recalibrer.",
      suggestion: "30 secondes pour partager ton ressenti, si tu veux.",
      explainability: {
        why: "Absence récente de check-in.",
        whyToday: `${skipStreak} jours sans ressenti enregistré.`,
        expectedImpact: "Mieux adapter les conseils.",
        confidence: 0.65,
      },
      estimatedSeconds: 20,
    });
  }

  return recovery.slice(0, 3);
}
