/**
 * EPIC 6D — Coaching domain engine (7 independent domains).
 */

import type {
  CoachAdvice,
  CoachExplainability,
  CoachingDomain,
  DomainInsights,
  LifePriority,
  PersonalCoachInput,
} from "../types/personalCoachTypes";
import { COACHING_DOMAIN_LABELS } from "../types/personalCoachTypes";

function explain(input: {
  why: string;
  whyToday: string;
  goalId?: string;
  goalName?: string;
  expectedImpact: string;
  confidence: number;
}): CoachExplainability {
  return {
    why: input.why,
    whyToday: input.whyToday,
    goalId: input.goalId,
    goalName: input.goalName,
    expectedImpact: input.expectedImpact,
    confidence: input.confidence,
  };
}

function advice(
  id: string,
  domain: CoachingDomain,
  kind: CoachAdvice["kind"],
  title: string,
  message: string,
  explainability: CoachExplainability,
  suggestion?: string,
): CoachAdvice {
  return {
    id,
    domain,
    kind,
    title,
    message,
    suggestion,
    explainability,
    estimatedSeconds: 15,
  };
}

function priorityBoost(priority: LifePriority, domain: CoachingDomain): number {
  const map: Partial<Record<LifePriority, CoachingDomain>> = {
    family: "family_life",
    wellbeing: "wellbeing",
    sport: "physical_activity",
    study: "study_learning",
    personal_goals: "personal_goals",
  };
  return map[priority] === domain ? 0.15 : 0;
}

export function buildDomainInsights(
  input: PersonalCoachInput,
  priority: LifePriority,
): DomainInsights[] {
  const energy = input.dailyEnergy ?? 5;
  const stress = input.dailyStress ?? 5;
  const mentalLoad = input.mentalLoad ?? 50;
  const freeMinutes = input.freeMinutes ?? 60;
  const goals = input.activeGoals ?? [];
  const habits = input.validatedHabits ?? input.topHabits ?? [];

  return [
    buildPhysicalDomain(input, priority, energy, freeMinutes, habits),
    buildSleepDomain(input, priority, energy, stress),
    buildMentalLoadDomain(input, priority, mentalLoad, stress),
    buildWellbeingDomain(input, priority, energy, stress),
    buildFamilyDomain(input, priority),
    buildStudyDomain(input, priority, freeMinutes, goals),
    buildGoalsDomain(input, priority, goals),
  ];
}

function buildPhysicalDomain(
  input: PersonalCoachInput,
  priority: LifePriority,
  energy: number,
  freeMinutes: number,
  habits: readonly string[],
): DomainInsights {
  const domain: CoachingDomain = "physical_activity";
  const conf = 0.65 + priorityBoost(priority, domain);
  const observations: string[] = [];
  const opportunities: CoachAdvice[] = [];
  const tips: CoachAdvice[] = [];
  const encouragements: CoachAdvice[] = [];

  if (energy >= 7 && freeMinutes >= 30) {
    observations.push("Énergie élevée et créneau disponible.");
    opportunities.push(
      advice(
        `opp-physical-${input.date}`,
        domain,
        "opportunity",
        "Bon moment pour bouger",
        "C'est un bon moment pour une activité physique légère.",
        explain({
          why: "Énergie et disponibilité convergent.",
          whyToday: `Énergie ${energy}/10, ${freeMinutes} min libres.`,
          expectedImpact: "Maintenir l'élan sans surcharge.",
          confidence: conf,
        }),
        "Une marche ou une séance courte pourrait te faire du bien.",
      ),
    );
  }

  if (habits.some((habit) => /sport|marche|course/i.test(habit))) {
    encouragements.push(
      advice(
        `enc-physical-habit-${input.date}`,
        domain,
        "encouragement",
        "Habitude sportive reconnue",
        "Ta régularité sportive est un atout — continue à ton rythme.",
        explain({
          why: "Habitudes validées observées.",
          whyToday: "Aligné avec tes préférences apprises.",
          expectedImpact: "Renforcer la constance.",
          confidence: 0.78,
        }),
      ),
    );
  }

  if (energy <= 4) {
    tips.push(
      advice(
        `tip-physical-low-${input.date}`,
        domain,
        "tip",
        "Activité douce",
        "Aujourd'hui, privilégie une activité très légère ou du repos actif.",
        explain({
          why: "Énergie déclarée basse.",
          whyToday: `Énergie ${energy}/10.`,
          expectedImpact: "Éviter la sur-sollicitation.",
          confidence: 0.82,
        }),
      ),
    );
  }

  return {
    domain,
    label: COACHING_DOMAIN_LABELS[domain],
    observations,
    opportunities,
    tips,
    encouragements,
  };
}

function buildSleepDomain(
  input: PersonalCoachInput,
  priority: LifePriority,
  energy: number,
  stress: number,
): DomainInsights {
  const domain: CoachingDomain = "sleep_recovery";
  const observations: string[] = [];
  const tips: CoachAdvice[] = [];

  if (energy <= 4 || stress >= 7) {
    observations.push("Signaux de fatigue ou stress élevé.");
    tips.push(
      advice(
        `tip-sleep-${input.date}`,
        domain,
        "tip",
        "Récupération prioritaire",
        "Accorde-toi une pause ou une soirée plus calme si possible.",
        explain({
          why: "Fatigue ou stress déclarés.",
          whyToday: `Énergie ${energy}/10, stress ${stress}/10.`,
          expectedImpact: "Faciliter la récupération.",
          confidence: 0.8 + priorityBoost(priority, "wellbeing"),
        }),
      ),
    );
  }

  if ((input.trendEnergy7d ?? 0) > 0 && (input.trendEnergy7d ?? 0) < 5) {
    observations.push("Tendance énergie basse sur la semaine.");
  }

  return {
    domain,
    label: COACHING_DOMAIN_LABELS[domain],
    observations,
    opportunities: [],
    tips,
    encouragements: [],
  };
}

function buildMentalLoadDomain(
  input: PersonalCoachInput,
  priority: LifePriority,
  mentalLoad: number,
  stress: number,
): DomainInsights {
  const domain: CoachingDomain = "mental_load";
  const observations: string[] = [];
  const tips: CoachAdvice[] = [];

  if (mentalLoad >= 70) {
    observations.push(`Charge mentale élevée (${mentalLoad}%).`);
    tips.push(
      advice(
        `tip-mental-${input.date}`,
        domain,
        "tip",
        "Alléger la charge",
        "Découpe une tâche ou reporte un élément non urgent.",
        explain({
          why: "Charge mentale au-dessus du confort.",
          whyToday: `Charge ${mentalLoad}%, stress ${stress}/10.`,
          expectedImpact: "Réduire la pression cognitive.",
          confidence: 0.76 + priorityBoost(priority, domain),
        }),
      ),
    );
  }

  return {
    domain,
    label: COACHING_DOMAIN_LABELS[domain],
    observations,
    opportunities: [],
    tips,
    encouragements: [],
  };
}

function buildWellbeingDomain(
  input: PersonalCoachInput,
  priority: LifePriority,
  energy: number,
  stress: number,
): DomainInsights {
  const domain: CoachingDomain = "wellbeing";
  const encouragements: CoachAdvice[] = [];

  if (energy >= 6 && stress <= 5) {
    encouragements.push(
      advice(
        `enc-wellbeing-${input.date}`,
        domain,
        "encouragement",
        "Journée équilibrée",
        "Tu sembles dans un bon équilibre aujourd'hui — profite-en sereinement.",
        explain({
          why: "Énergie et stress dans une zone confortable.",
          whyToday: "Check-in du jour favorable.",
          expectedImpact: "Renforcer le ressenti positif.",
          confidence: 0.7 + priorityBoost(priority, domain),
        }),
      ),
    );
  }

  return {
    domain,
    label: COACHING_DOMAIN_LABELS[domain],
    observations: [],
    opportunities: [],
    tips: [],
    encouragements,
  };
}

function buildFamilyDomain(
  input: PersonalCoachInput,
  priority: LifePriority,
): DomainInsights {
  const domain: CoachingDomain = "family_life";
  const opportunities: CoachAdvice[] = [];

  if ((input.childrenCount ?? 0) > 0 && priority === "family") {
    opportunities.push(
      advice(
        `opp-family-${input.date}`,
        domain,
        "opportunity",
        "Moment famille",
        "C'est un bon moment pour un geste simple envers ta famille.",
        explain({
          why: "Priorité vie familiale activée.",
          whyToday: "Aligné avec ta priorité actuelle.",
          expectedImpact: "Renforcer les liens sans pression.",
          confidence: 0.74,
        }),
        "Un message, un repas partagé ou 15 minutes de présence.",
      ),
    );
  }

  return {
    domain,
    label: COACHING_DOMAIN_LABELS[domain],
    observations: [],
    opportunities,
    tips: [],
    encouragements: [],
  };
}

function buildStudyDomain(
  input: PersonalCoachInput,
  priority: LifePriority,
  freeMinutes: number,
  goals: readonly { id: string; name: string }[],
): DomainInsights {
  const domain: CoachingDomain = "study_learning";
  const opportunities: CoachAdvice[] = [];
  const studyGoal = goals.find((goal) => /étud|apprent|cours|exam/i.test(goal.name));

  if (freeMinutes >= 45 && priority === "study") {
    opportunities.push(
      advice(
        `opp-study-${input.date}`,
        domain,
        "opportunity",
        "Créneau d'apprentissage",
        "C'est un bon moment pour une session d'étude courte.",
        explain({
          why: "Temps disponible et priorité études.",
          whyToday: `${freeMinutes} minutes libres.`,
          goalName: studyGoal?.name,
          expectedImpact: "Avancer sans marathon.",
          confidence: 0.72,
        }),
        "25 minutes concentrées suffisent pour progresser.",
      ),
    );
  }

  return {
    domain,
    label: COACHING_DOMAIN_LABELS[domain],
    observations: [],
    opportunities,
    tips: [],
    encouragements: [],
  };
}

function buildGoalsDomain(
  input: PersonalCoachInput,
  priority: LifePriority,
  goals: readonly { id: string; name: string }[],
): DomainInsights {
  const domain: CoachingDomain = "personal_goals";
  const tips: CoachAdvice[] = [];
  const goal = goals[0];

  if (goal) {
    tips.push(
      advice(
        `tip-goal-${goal.id}-${input.date}`,
        domain,
        "tip",
        `Objectif « ${goal.name} »`,
        "Un petit pas aujourd'hui compte autant qu'un grand sprint demain.",
        explain({
          why: "Objectif actif identifié.",
          whyToday: "Rappel bienveillant, jamais culpabilisant.",
          goalId: goal.id,
          goalName: goal.name,
          expectedImpact: "Maintenir l'élan vers l'objectif.",
          confidence: 0.68 + priorityBoost(priority, domain),
        }),
      ),
    );
  }

  return {
    domain,
    label: COACHING_DOMAIN_LABELS[domain],
    observations: [],
    opportunities: [],
    tips,
    encouragements: [],
  };
}
