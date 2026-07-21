/**
 * EPIC 4A/4B — Prompt preparation for future LLM integration.
 * EPIC 4B : inclut le HumanModel (seule source d'interprétation utilisateur).
 */

import type { HumanModel } from "../../humanModelFoundation";
import type { AssistantConversationContext } from "../types/assistantContext";
import type { ConversationMessage } from "../types/conversationHistory";
import type { IntentClassification } from "../types/intents";

export type AssistantPrompt = {
  readonly system: string;
  readonly contextBlock: string;
  readonly humanModelBlock: string;
  readonly historyBlock: string;
  readonly userMessage: string;
  readonly intent: IntentClassification;
  readonly readOnly: true;
};

const SYSTEM_PROMPT = [
  "Tu es l'assistant personnel d'Aura.",
  "Tu connais l'utilisateur via des données réelles fournies dans le contexte.",
  "Le Human Model est la SEULE source pour fatigue, charge mentale, stress, motivation, disponibilité et équilibre.",
  "Ne recalcule jamais ces dimensions toi-même — utilise uniquement le bloc HumanModel.",
  "Mode lecture seule : tu expliques, conseilles, orientes — tu ne modifies aucune donnée.",
  "Si une information manque, dis-le explicitement. N'invente jamais tâche, événement ou objectif.",
].join(" ");

function formatField(label: string, value: string | null, confidence: number): string {
  if (!value) return `${label} : inconnu`;
  return `${label} : ${value} (${Math.round(confidence * 100)} % confiance)`;
}

export function buildHumanModelBlock(humanModel: HumanModel): string {
  const state = humanModel.currentState.value;
  return [
    "=== Human Model (interprétation officielle) ===",
    state ? `État global : ${state.label}` : "État global : non déterminé",
    formatField("Énergie", humanModel.energy.value, humanModel.energy.confidence),
    formatField("Stress", humanModel.stress.value, humanModel.stress.confidence),
    formatField("Charge mentale", humanModel.mentalLoad.value, humanModel.mentalLoad.confidence),
    formatField("Motivation", humanModel.motivation.value, humanModel.motivation.confidence),
    formatField("Disponibilité", humanModel.availability.value, humanModel.availability.confidence),
    formatField("Focus", humanModel.focus.value, humanModel.focus.confidence),
    formatField("Sommeil", humanModel.sleep.value, humanModel.sleep.confidence),
    formatField(
      "Pression familiale",
      humanModel.familyPressure.value,
      humanModel.familyPressure.confidence,
    ),
    humanModel.dominantGoal.value
      ? `Objectif dominant : ${humanModel.dominantGoal.value.name}`
      : "Objectif dominant : aucun",
    humanModel.dominantConcern.value
      ? `Préoccupation : ${humanModel.dominantConcern.value.slice(0, 120)}`
      : "Préoccupation : non identifiée",
    `Confiance globale Human Model : ${Math.round(humanModel.confidence * 100)} %`,
    humanModel.missingData.length > 0
      ? `Données manquantes Human Model : ${humanModel.missingData.join("; ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildAssistantPrompt({
  context,
  humanModel,
  message,
  history,
  classification,
  maxHistoryMessages = 8,
}: {
  context: AssistantConversationContext;
  humanModel: HumanModel;
  message: string;
  history: readonly ConversationMessage[];
  classification: IntentClassification;
  maxHistoryMessages?: number;
}): AssistantPrompt {
  const recentHistory = history.slice(-maxHistoryMessages);

  const contextBlock = [
    `Utilisateur : ${context.user.firstName}`,
    `Date : ${context.date}`,
    `Foyer : ${context.household.householdId ?? "aucun"}`,
    `Enfants : ${context.household.childrenCount}`,
    `Planning : ${context.planning.blockCount} bloc(s)`,
    `Tâches : ${context.tasks.todo} à faire / ${context.tasks.total} total`,
    context.goals.enabled
      ? `Objectifs actifs : ${context.goals.activeCount}`
      : "Objectifs : fonctionnalité désactivée",
    context.dailyBrief.brief
      ? `Daily Brief : ${context.dailyBrief.brief.greeting}`
      : "Daily Brief : indisponible",
    context.gaps.length > 0 ? `Données manquantes contexte : ${context.gaps.join("; ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const humanModelBlock = buildHumanModelBlock(humanModel);

  const historyBlock =
    recentHistory.length === 0
      ? "(aucun historique)"
      : recentHistory
          .map((entry) => `${entry.role.toUpperCase()}: ${entry.content}`)
          .join("\n");

  return {
    system: SYSTEM_PROMPT,
    contextBlock,
    humanModelBlock,
    historyBlock,
    userMessage: message,
    intent: classification,
    readOnly: true,
  };
}

export function summarizeHistory(messages: readonly ConversationMessage[]): string {
  if (messages.length === 0) return "Conversation vide.";
  const last = messages.slice(-6);
  return last.map((message) => `${message.role}: ${message.content}`).join(" | ");
}
