/**
 * EPIC 4A/4B — Read-only structured response builder.
 * EPIC 4B : fatigue, motivation, charge — uniquement via HumanModel.
 */

import type { HumanModel } from "../../humanModelFoundation";
import type { AssistantConversationContext } from "../types/assistantContext";
import type { AssistantResponse, ProposedAssistantAction } from "../types/responseContract";
import type { ConversationIntent, IntentClassification } from "../types/intents";
import { buildAssistantExplanation } from "../explainability/buildExplanation";

function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)} %`;
}

function placeholderActions(intent: ConversationIntent): ProposedAssistantAction[] {
  const mapping: Partial<Record<ConversationIntent, ProposedAssistantAction[]>> = {
    planning: [
      {
        type: "reschedule",
        label: "Replanifier un bloc",
        description: "Futur : proposer un déplacement via le moteur planning.",
        payload: {},
        executable: false,
        status: "not_implemented",
      },
    ],
    goals: [
      {
        type: "updateGoal",
        label: "Mettre à jour un objectif",
        description: "Futur : synchroniser avec le moteur objectifs.",
        payload: {},
        executable: false,
        status: "not_implemented",
      },
    ],
    organization: [
      {
        type: "createTask",
        label: "Créer une tâche",
        description: "Futur : création guidée via Action Engine.",
        payload: {},
        executable: false,
        status: "not_implemented",
      },
    ],
    family: [
      {
        type: "notifyHousehold",
        label: "Informer le foyer",
        description: "Futur : proposition collaborative EPIC3.",
        payload: {},
        executable: false,
        status: "not_implemented",
      },
    ],
  };

  return mapping[intent] ?? [];
}

function buildIntentResponse(
  context: AssistantConversationContext,
  humanModel: HumanModel,
  classification: IntentClassification,
): Pick<AssistantResponse, "text" | "suggestions" | "warning"> {
  const name = context.user.firstName;

  switch (classification.intent) {
    case "planning":
      if (!context.planning.hasLoadedPlan) {
        return {
          text: `${name}, je n'ai pas encore de planning fiable pour aujourd'hui. Je peux t'aider à clarifier tes priorités une fois le planning chargé.`,
          suggestions: [
            { id: "open-planning", label: "Ouvrir le planning" },
          ],
          warning: "Planning du jour non disponible — aucune donnée inventée.",
        };
      }
      {
        const availability = humanModel.availability.value;
        const availabilityHint = availability
          ? ` Ta disponibilité estimée est « ${availability} » (${formatConfidence(humanModel.availability.confidence)}).`
          : "";
        return {
          text: `${name}, ton planning contient ${context.planning.blockCount} bloc(s) aujourd'hui.${availabilityHint} Je peux t'aider à prioriser sans modifier quoi que ce soit pour l'instant.`,
          suggestions: [
            { id: "review-blocks", label: "Passer en revue les blocs du jour" },
          ],
        };
      }

    case "goals":
      if (!context.goals.enabled) {
        return {
          text: "La fonctionnalité Objectifs n'est pas activée dans ton environnement actuel.",
          suggestions: [],
          warning: "Feature flag objectifs désactivé.",
        };
      }
      if (context.goals.activeCount === 0) {
        return {
          text: `${name}, je ne vois aucun objectif actif enregistré. Je ne peux pas en suggérer un fictif.`,
          suggestions: [{ id: "create-goal", label: "Créer un premier objectif (UI)" }],
        };
      }
      {
        const dominant = humanModel.dominantGoal.value;
        const goalLabel = dominant?.name ?? context.goals.goals[0]?.name ?? "—";
        return {
          text: `${name}, tu as ${context.goals.activeCount} objectif(s) actif(s). Objectif dominant : « ${goalLabel} ». Je peux t'aider à avancer étape par étape en lecture seule.`,
          suggestions: [{ id: "goal-progress", label: "Voir la progression" }],
        };
      }

    case "fatigue": {
      const energy = humanModel.energy;
      if (!energy.value) {
        return {
          text: `${name}, je comprends que tu sois fatigué(e), mais je n'ai pas encore assez de données pour estimer ton niveau d'énergie.`,
          suggestions: [{ id: "checkin", label: "Faire le check-in du jour" }],
          warning: energy.explanation,
        };
      }
      return {
        text: `${name}, ton niveau d'énergie est « ${energy.value} » (${formatConfidence(energy.confidence)} de confiance). ${energy.explanation} Sans toucher à ton planning, je te suggère d'adapter l'intensité si besoin.`,
        suggestions: [
          { id: "light-slot", label: "Identifier un créneau calme" },
          { id: "defer-task", label: "Reporter une tâche secondaire" },
          { id: "ai-profile", label: "Voir mon profil IA" },
        ],
      };
    }

    case "motivation": {
      const motivation = humanModel.motivation;
      if (!motivation.value) {
        return {
          text: `${name}, on avance étape par étape. Je n'ai pas encore assez de signaux pour estimer ta motivation aujourd'hui.`,
          suggestions: [{ id: "checkin", label: "Faire le check-in du jour" }],
          warning: motivation.explanation,
        };
      }
      return {
        text: `${name}, ta motivation est « ${motivation.value} » (${formatConfidence(motivation.confidence)}). ${motivation.explanation}`,
        suggestions: [
          { id: "small-win", label: "Choisir une petite victoire" },
          { id: "ai-profile", label: "Voir mon profil IA" },
        ],
      };
    }

    case "daily_brief":
      if (!context.dailyBrief.brief) {
        return {
          text: "Le Daily Brief n'est pas disponible pour le moment (données insuffisantes ou fonctionnalité inactive).",
          suggestions: [],
          warning: "Daily Brief indisponible.",
        };
      }
      return {
        text: `${context.dailyBrief.brief.greeting} ${context.dailyBrief.brief.synthesis}`,
        suggestions: [{ id: "open-brief", label: "Relire le Daily Brief" }],
      };

    case "family":
    case "household":
      {
        const pressure = humanModel.familyPressure.value;
        const pressureHint = pressure
          ? ` Pression familiale estimée : « ${pressure} ».`
          : "";
        return {
          text: `${name}, ton foyer compte ${context.household.members.length} membre(s) et ${context.household.childrenCount} enfant(s) enregistré(s).${pressureHint} Je peux t'aider à coordonner sans action automatique.`,
          suggestions: [{ id: "household-view", label: "Consulter la vue Foyer" }],
        };
      }

    case "organization":
      {
        const load = humanModel.mentalLoad.value;
        const loadHint = load ? ` Charge mentale : « ${load} ».` : "";
        return {
          text: `${name}, tu as ${context.tasks.todo} tâche(s) à organiser.${loadHint} ${context.tasks.topTitles.length > 0 ? `Priorité visible : « ${context.tasks.topTitles[0]} ».` : ""}`.trim(),
          suggestions: [{ id: "prioritize", label: "Clarifier les priorités" }],
        };
      }

    default:
      {
        const stateLabel = humanModel.currentState.value?.label;
        const stateHint = stateLabel ? ` État actuel : ${stateLabel}.` : "";
        return {
          text: `${name}, je suis là pour t'aider à y voir clair dans ton organisation, ton énergie et tes objectifs — toujours en mode conseil, sans modification automatique.${stateHint}`,
          suggestions: [
            { id: "planning", label: "Parler du planning" },
            { id: "tasks", label: "Parler des tâches" },
            { id: "ai-profile", label: "Voir mon profil IA" },
          ],
        };
      }
  }
}

export function buildReadOnlyAssistantResponse({
  context,
  humanModel,
  classification,
}: {
  context: AssistantConversationContext;
  humanModel: HumanModel;
  classification: IntentClassification;
}): AssistantResponse {
  const body = buildIntentResponse(context, humanModel, classification);
  const adaptiveSuffix =
    context.adaptiveIntelligence.enabled && context.adaptiveIntelligence.phrasingHints.length > 0
      ? ` ${context.adaptiveIntelligence.phrasingHints[0]}`
      : "";
  const proactiveSuffix =
    context.proactiveIntelligence.enabled &&
    context.proactiveIntelligence.phrasingHints.length > 0
      ? ` ${context.proactiveIntelligence.phrasingHints[0]}`
      : "";
  const dailyStateSuffix =
    context.dailyState.enabled && context.dailyState.phrasingHints.length > 0
      ? ` ${context.dailyState.phrasingHints[0]}`
      : "";
  const coachSuffix =
    context.personalCoach.enabled && context.personalCoach.phrasingHints.length > 0
      ? ` ${context.personalCoach.phrasingHints[0]}`
      : "";
  const knowledgeSuffix =
    context.lifeKnowledge.enabled && context.lifeKnowledge.phrasingHints.length > 0
      ? ` ${context.lifeKnowledge.phrasingHints[0]}`
      : "";
  const usedSources = context.sources
    .filter((source) => source.available)
    .map((source) => source.id);

  return {
    text: `${body.text}${adaptiveSuffix}${proactiveSuffix}${dailyStateSuffix}${coachSuffix}${knowledgeSuffix}`,
    confidence: Math.max(classification.confidence, humanModel.confidence * 0.5),
    intent: classification.intent,
    reasoning: classification.reason,
    suggestions: body.suggestions,
    proposedActions: placeholderActions(classification.intent),
    warning: body.warning,
    explanation: buildAssistantExplanation({
      context,
      humanModel,
      classification,
      usedSourceIds: usedSources,
    }),
    readOnly: true,
  };
}
