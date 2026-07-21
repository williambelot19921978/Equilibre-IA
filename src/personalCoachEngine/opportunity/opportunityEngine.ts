/**
 * EPIC 6D — Opportunity Engine.
 * Detects good moments — never auto-plans.
 */

import type { CoachAdvice, CoachExplainability, PersonalCoachInput } from "../types/personalCoachTypes";

function explain(input: Omit<CoachExplainability, "goalId"> & { goalId?: string }): CoachExplainability {
  return input;
}

export function detectOpportunities(input: PersonalCoachInput): CoachAdvice[] {
  const opportunities: CoachAdvice[] = [];
  const energy = input.dailyEnergy ?? 5;
  const freeMinutes = input.freeMinutes ?? 0;
  const mentalLoad = input.mentalLoad ?? 50;
  const goals = input.activeGoals ?? [];
  const habits = input.validatedHabits ?? [];

  if (freeMinutes >= 60 && mentalLoad < 50) {
    opportunities.push({
      id: `opp-free-slot-${input.date}`,
      domain: "wellbeing",
      kind: "opportunity",
      title: "Créneau libre",
      message: "C'est un bon moment pour avancer sur ce qui compte pour toi.",
      suggestion: "Choisis une seule action légère — tu restes aux commandes.",
      explainability: explain({
        why: "Journée légère avec temps disponible.",
        whyToday: `${freeMinutes} min libres, charge ${mentalLoad}%.`,
        expectedImpact: "Progresser sans surcharge.",
        confidence: 0.75,
      }),
      estimatedSeconds: 20,
    });
  }

  if (energy >= 8 && freeMinutes >= 20) {
    opportunities.push({
      id: `opp-high-energy-${input.date}`,
      domain: "physical_activity",
      kind: "opportunity",
      title: "Énergie au top",
      message: "C'est un bon moment pour une action qui demande un peu d'élan.",
      suggestion: goals[0]
        ? `Tu pourrais avancer sur « ${goals[0].name} ».`
        : "Sport, projet ou tâche importante — à toi de choisir.",
      explainability: explain({
        why: "Énergie élevée déclarée.",
        whyToday: `Énergie ${energy}/10.`,
        goalName: goals[0]?.name,
        expectedImpact: "Capitaliser sur la forme du jour.",
        confidence: 0.8,
      }),
      estimatedSeconds: 20,
    });
  }

  if (goals.length > 0 && freeMinutes >= 30) {
    const nearGoal = goals[0]!;
    opportunities.push({
      id: `opp-goal-near-${nearGoal.id}`,
      domain: "personal_goals",
      kind: "opportunity",
      title: "Objectif à portée",
      message: `Tu as de la marge pour « ${nearGoal.name} ».`,
      suggestion: "Même 15 minutes peuvent faire la différence.",
      explainability: explain({
        why: "Objectif actif + temps disponible.",
        whyToday: "Convergence opportunité sans urgence.",
        goalId: nearGoal.id,
        goalName: nearGoal.name,
        expectedImpact: "Renforcer la progression.",
        confidence: 0.7,
      }),
      estimatedSeconds: 15,
    });
  }

  if (habits.length >= 2 && energy >= 5) {
    opportunities.push({
      id: `opp-habits-${input.date}`,
      domain: "wellbeing",
      kind: "opportunity",
      title: "Habitudes solides",
      message: "C'est un bon moment pour t'appuyer sur tes routines qui fonctionnent.",
      explainability: explain({
        why: "Habitudes validées disponibles.",
        whyToday: `${habits.length} habitudes reconnues.`,
        expectedImpact: "Consolider ce qui marche.",
        confidence: 0.72,
      }),
      estimatedSeconds: 15,
    });
  }

  return opportunities.slice(0, 4);
}
