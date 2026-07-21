/**
 * EPIC 8A — Granular data deletion with confirmation tokens.
 */

import { clearObservations } from "../adaptiveIntelligenceEngine/observation/observationStore";
import { clearPreferences } from "../adaptiveIntelligenceEngine/preference/preferenceStore";
import { clearLearningTimeline } from "../adaptiveIntelligenceEngine/timeline/learningTimeline";
import { clearDailyStates } from "../dailyStateEngine/store/dailyStateStore";
import { resetAllKnowledge } from "../lifeKnowledgeEngine";
import { listGoals, deleteGoal } from "../lib/goals/goalsStorage";
import { clearPrivacyPreferences } from "./privacyPreferencesStore";
import type { DataDeletionScope } from "./types";

export type DeletionResult = {
  readonly scope: DataDeletionScope;
  readonly deletedAt: string;
  readonly details: readonly string[];
};

export function deleteHabitsData(userId: string): DeletionResult {
  clearObservations(userId);
  clearPreferences(userId);
  clearLearningTimeline(userId);
  return {
    scope: "habits",
    deletedAt: new Date().toISOString(),
    details: ["Observations", "Préférences apprises", "Historique d'apprentissage"],
  };
}

export function deleteCheckinsData(userId: string): DeletionResult {
  clearDailyStates(userId);
  return {
    scope: "checkins",
    deletedAt: new Date().toISOString(),
    details: ["Historique check-in local"],
  };
}

export function deleteGoalsData(userId: string): DeletionResult {
  const goals = listGoals(userId);
  for (const goal of goals) {
    deleteGoal(userId, goal.id);
  }
  return {
    scope: "goals",
    deletedAt: new Date().toISOString(),
    details: [`${goals.length} objectif(s) supprimé(s)`],
  };
}

export function deleteAuraMemory(userId: string): DeletionResult {
  resetAllKnowledge(userId);
  return {
    scope: "auraMemory",
    deletedAt: new Date().toISOString(),
    details: ["Mémoire Aura", "Confirmations", "Chronologie"],
  };
}

export function deleteAllUserData(userId: string): DeletionResult {
  const parts = [
    deleteHabitsData(userId),
    deleteCheckinsData(userId),
    deleteGoalsData(userId),
    deleteAuraMemory(userId),
  ];
  clearPrivacyPreferences(userId);
  return {
    scope: "all",
    deletedAt: new Date().toISOString(),
    details: parts.flatMap((part) => part.details),
  };
}

export function executeDeletion(userId: string, scope: DataDeletionScope): DeletionResult {
  switch (scope) {
    case "habits":
      return deleteHabitsData(userId);
    case "checkins":
      return deleteCheckinsData(userId);
    case "goals":
      return deleteGoalsData(userId);
    case "auraMemory":
      return deleteAuraMemory(userId);
    case "all":
      return deleteAllUserData(userId);
    default:
      return deleteAllUserData(userId);
  }
}

export const DELETION_SCOPE_LABELS: Record<DataDeletionScope, string> = {
  habits: "Habitudes apprises",
  checkins: "Check-ins",
  goals: "Objectifs",
  auraMemory: "Mémoire Aura",
  all: "Toutes mes données locales Aura",
};

export function requiresDeletionConfirmation(scope: DataDeletionScope): string {
  return `CONFIRMER-${scope.toUpperCase()}`;
}
