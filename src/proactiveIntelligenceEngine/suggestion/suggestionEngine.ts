/**
 * EPIC 6B — Suggestion Engine.
 */

import type {
  PreparedActionType,
  ProactiveExplainability,
  ProactiveIntelligenceInput,
  ProactiveSuggestion,
  SuggestionKind,
} from "../types/proactiveTypes";
import { frequencyMultiplier } from "../learning/proactiveLearningEngine";
import { getAllSuggestions, upsertSuggestion } from "./suggestionStore";

function createExplainability(input: {
  why: string;
  observations: readonly string[];
  habits: readonly string[];
  goalName?: string;
  goalId?: string;
  whyNow: string;
  whyNotLater: string;
  confidence: number;
}): ProactiveExplainability {
  return {
    why: input.why,
    observations: input.observations,
    habits: input.habits,
    goalId: input.goalId,
    goalName: input.goalName,
    whyNow: input.whyNow,
    whyNotLater: input.whyNotLater,
    confidenceLevel: input.confidence,
    formula: "confidence = contextMatch * 0.6 + habitMatch * 0.25 + goalMatch * 0.15",
  };
}

function baseSuggestion(input: {
  kind: SuggestionKind;
  title: string;
  description: string;
  reason: string;
  impact: string;
  urgency: number;
  confidence: number;
  priority: number;
  explainability: ProactiveExplainability;
  preparedAction?: PreparedActionType;
  expiresInHours?: number;
}): Omit<ProactiveSuggestion, "id" | "status" | "score" | "createdAt" | "updatedAt"> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + (input.expiresInHours ?? 24) * 3600_000);

  return {
    kind: input.kind,
    title: input.title,
    description: input.description,
    reason: input.reason,
    impact: input.impact,
    urgency: input.urgency,
    confidence: input.confidence,
    priority: input.priority,
    explainability: input.explainability,
    preparedAction: input.preparedAction,
    expiresAt: expiresAt.toISOString(),
  };
}

export function generateSuggestions(input: ProactiveIntelligenceInput): ProactiveSuggestion[] {
  const suggestions: ProactiveSuggestion[] = [];
  const now = input.now ?? new Date().toISOString();
  const mentalLoad = (input.mentalLoad ?? 50) / 100;
  const habits = input.topHabits ?? [];
  const goals = input.activeGoals ?? [];
  const events = input.calendarEvents ?? [];

  if ((input.taskTodoCount ?? 0) >= 5 && (input.freeMinutes ?? 0) < 60) {
    const kind: SuggestionKind = "organization";
    const multiplier = frequencyMultiplier(input.userId, kind);
    if (multiplier >= 0.5) {
      const base = baseSuggestion({
        kind,
        title: "Réorganiser la journée",
        description: "Plusieurs tâches en attente et peu de créneaux libres.",
        reason: `${input.taskTodoCount} tâches — ${input.freeMinutes ?? 0} min libres.`,
        impact: "Alléger la charge et prioriser l'essentiel.",
        urgency: 0.65 * multiplier,
        confidence: 0.72,
        priority: 70,
        preparedAction: "reorganizeDay",
        explainability: createExplainability({
          why: "Charge de tâches élevée avec peu de disponibilité.",
          observations: [`${input.taskTodoCount} tâches en attente`],
          habits,
          whyNow: "Avant que la journée ne se remplisse davantage.",
          whyNotLater: "Reporter aggraverait la surcharge.",
          confidence: 0.72,
        }),
      });
      suggestions.push(toSuggestion(base, now, 0.68 * multiplier));
    }
  }

  if (mentalLoad > 0.7 || (input.dailyEnergy !== undefined && input.dailyEnergy <= 4)) {
    const kind: SuggestionKind = "prevention";
    const multiplier =
      frequencyMultiplier(input.userId, kind) *
      (input.dailyEnergy !== undefined && input.dailyEnergy <= 4 ? 0.5 : 1);
    if (multiplier >= 0.5) {
      const base = baseSuggestion({
        kind,
        title: "Pause recommandée",
        description: "Charge mentale élevée détectée.",
        reason: `Charge mentale ${Math.round(mentalLoad * 100)}%.`,
        impact: "Prévenir l'épuisement.",
        urgency: 0.55 * multiplier,
        confidence: 0.78,
        priority: 60,
        preparedAction: "startFocusSession",
        explainability: createExplainability({
          why: "Charge mentale au-dessus du seuil confortable.",
          observations: [`Charge mentale ${Math.round(mentalLoad * 100)}%`],
          habits,
          whyNow: "Avant une baisse de performance.",
          whyNotLater: "Attendre pourrait aggraver la fatigue.",
          confidence: 0.78,
        }),
      });
      suggestions.push(toSuggestion(base, now, 0.62 * multiplier));
    }
  }

  if (goals.length > 0 && (input.freeMinutes ?? 0) >= 45) {
    const goal = goals[0]!;
    const kind: SuggestionKind = "motivation";
    const multiplier = frequencyMultiplier(input.userId, kind);
    if (multiplier >= 0.5) {
      const base = baseSuggestion({
        kind,
        title: `Avancer sur « ${goal.name} »`,
        description: "Créneau libre compatible avec votre objectif.",
        reason: `${input.freeMinutes} min disponibles.`,
        impact: "Progression vers l'objectif.",
        urgency: 0.4 * multiplier,
        confidence: 0.7,
        priority: 55,
        preparedAction: "createTask",
        explainability: createExplainability({
          why: "Créneau libre aligné avec un objectif actif.",
          observations: [`${input.freeMinutes} min libres`],
          habits,
          goalId: goal.id,
          goalName: goal.name,
          whyNow: "Créneau disponible maintenant.",
          whyNotLater: "Le créneau pourrait être occupé plus tard.",
          confidence: 0.7,
        }),
      });
      suggestions.push(toSuggestion(base, now, 0.58 * multiplier));
    }
  }

  if ((input.conflictCount ?? 0) > 0) {
    const kind: SuggestionKind = "alert";
    suggestions.push(
      toSuggestion(
        baseSuggestion({
          kind,
          title: "Conflit de planning détecté",
          description: "Des événements se chevauchent.",
          reason: `${input.conflictCount} conflit(s).`,
          impact: "Éviter stress et double réservation.",
          urgency: 0.85,
          confidence: 0.9,
          priority: 90,
          preparedAction: "moveTask",
          explainability: createExplainability({
            why: "Conflits calendrier identifiés.",
            observations: events.slice(0, 3).map((event) => event.title),
            habits,
            whyNow: "Conflit actif sur la journée.",
            whyNotLater: "Les conflits peuvent s'accumuler.",
            confidence: 0.9,
          }),
        }),
        now,
        0.82,
      ),
    );
  }

  if (habits.length > 0 && (input.validatedPreferences ?? []).length > 0) {
    const kind: SuggestionKind = "anticipation";
    const multiplier = frequencyMultiplier(input.userId, kind);
    if (multiplier >= 0.5) {
      const base = baseSuggestion({
        kind,
        title: "Anticiper selon vos habitudes",
        description: `Basé sur : ${habits.slice(0, 2).join(", ")}.`,
        reason: "Préférences validées disponibles.",
        impact: "Meilleure adéquation avec votre rythme.",
        urgency: 0.35 * multiplier,
        confidence: 0.75,
        priority: 50,
        explainability: createExplainability({
          why: "Habitudes et préférences validées convergent.",
          observations: input.validatedPreferences ?? [],
          habits,
          whyNow: "Moment calme pour planifier.",
          whyNotLater: "Anticiper réduit le stress.",
          confidence: 0.75,
        }),
      });
      suggestions.push(toSuggestion(base, now, 0.55 * multiplier));
    }
  }

  if ((input.balanceScore ?? 50) < 40) {
    suggestions.push(
      toSuggestion(
        baseSuggestion({
          kind: "encouragement",
          title: "Rééquilibrer votre journée",
          description: "Score d'équilibre bas.",
          reason: `Équilibre ${input.balanceScore}/100.`,
          impact: "Retrouver un rythme sain.",
          urgency: 0.45,
          confidence: 0.65,
          priority: 45,
          explainability: createExplainability({
            why: "Déséquilibre vie détecté.",
            observations: [`Balance ${input.balanceScore}`],
            habits,
            whyNow: "Correction précoce plus facile.",
            whyNotLater: "Le déséquilibre peut persister.",
            confidence: 0.65,
          }),
        }),
        now,
        0.5,
      ),
    );
  }

  return suggestions.sort((left, right) => right.score - left.score);
}

function toSuggestion(
  base: Omit<ProactiveSuggestion, "id" | "status" | "score" | "createdAt" | "updatedAt">,
  now: string,
  score: number,
): ProactiveSuggestion {
  return {
    ...base,
    id: `sug-${base.kind}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    status: "generated",
    score,
    createdAt: now,
    updatedAt: now,
  };
}

export function persistNewSuggestions(
  userId: string,
  suggestions: readonly ProactiveSuggestion[],
): void {
  const existing = getAllSuggestions(userId);
  const existingTitles = new Set(existing.map((item) => `${item.kind}:${item.title}`));

  for (const suggestion of suggestions) {
    const key = `${suggestion.kind}:${suggestion.title}`;
    if (!existingTitles.has(key)) {
      upsertSuggestion(userId, suggestion);
    }
  }
}

export class SuggestionEngine {
  generate(input: ProactiveIntelligenceInput): ProactiveSuggestion[] {
    const suggestions = generateSuggestions(input);
    persistNewSuggestions(input.userId, suggestions);
    return suggestions;
  }
}

export const defaultSuggestionEngine = new SuggestionEngine();
