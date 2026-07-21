/**
 * EPIC 4C — Action Builders (analyse, valide structure, preview — ne modifie rien).
 */

import { shouldProposeReorganizeDay } from "../../../semanticPlanningEngine";
import { actionConfidenceFromState } from "../../../dailyStateEngine";
import type { ActionBuilder, ActionBuilderContext } from "../types/actionBuilder";
import type { SecureActionDraft, ActionPreview, ActionExplainability } from "../types/secureAction";
import {
  buildPlanningCalendarTarget,
  buildScopePreviewHint,
  resolveDefaultCalendarScope,
  resolvePlanningOperation,
} from "../planning/planningCalendarContract";

function basePreview(
  title: string,
  before: string[],
  after: string[],
  impact: string,
  affected: string[],
  confidence: number,
  risk: SecureActionDraft["riskLevel"],
): ActionPreview {
  return { title, before, after, impact, affectedItems: affected, confidence, risk, why: [] };
}

function baseExplainability(
  summary: string,
  whyAction: string[],
  whyTarget: string[] = [],
  whyTiming: string[] = [],
): ActionExplainability {
  return { summary, whyAction, whyTarget, whyTiming };
}

function topTaskTitle(context: ActionBuilderContext): string | null {
  return context.context.tasks.topTitles[0] ?? null;
}

/** Replanification d'événement / créneau — distincte du déplacement de tâche. */
function isEventRescheduleRequest(ctx: ActionBuilderContext): boolean {
  return /événement|créneau|replanifier/i.test(ctx.message);
}

const NON_EXECUTABLE_TYPES = new Set<SecureActionDraft["type"]>([
  "rescheduleEvent",
  "notifyHousehold",
]);

export function enrichDraftMetadata(draft: SecureActionDraft): SecureActionDraft {
  const calendarScope = resolveDefaultCalendarScope(draft.type);
  const operation = resolvePlanningOperation(draft.type);
  const scopeHint = buildScopePreviewHint(calendarScope);
  const executionAvailable = !NON_EXECUTABLE_TYPES.has(draft.type);

  const planningTarget = operation
    ? buildPlanningCalendarTarget({
        operation,
        scope: calendarScope,
        date: String(draft.payload.date ?? draft.payload.sourceDate ?? ""),
        entryId: draft.payload.entryId ? String(draft.payload.entryId) : undefined,
        summary: draft.summary,
      })
    : undefined;

  const preview: ActionPreview = {
    ...draft.preview,
    impact: planningTarget
      ? `${draft.preview.impact} ${scopeHint.userMessage}`
      : draft.preview.impact,
  };

  return {
    ...draft,
    calendarScope,
    planningTarget,
    executionAvailable,
    preview,
  };
}

export const createTaskBuilder: ActionBuilder = {
  type: "createTask",
  canBuild(ctx) {
    return (
      ctx.classification.intent === "organization" ||
      /créer|ajouter|nouvelle tâche/i.test(ctx.message)
    );
  },
  build(ctx) {
    const title =
      topTaskTitle(ctx) ??
      (ctx.message.replace(/créer|ajouter|une tâche|task/gi, "").trim().slice(0, 80) ||
        "Nouvelle tâche");

    return {
      type: "createTask",
      description: "Créer une nouvelle tâche",
      summary: `Créer la tâche « ${title} »`,
      target: "tasks",
      payload: {
        userId: ctx.userId,
        title,
        category: "personal",
        estimatedMinutes: 30,
        priority: 3,
        splittable: false,
      },
      riskLevel: "low",
      requiresConfirmation: true,
      estimatedImpact: "Ajout d'une tâche dans votre liste.",
      sourceIntent: ctx.classification.intent,
      origin: "assistant",
      preview: basePreview(
        "Créer une tâche",
        ["Aucune tâche avec ce titre"],
        [`Tâche « ${title} » en statut à faire`],
        "Une nouvelle entrée apparaîtra dans vos tâches.",
        [title],
        0.75,
        "low",
      ),
      explainability: baseExplainability(
        "Organisation demandée — création de tâche proposée.",
        [
          `Intention détectée : ${ctx.classification.intent}`,
          `${ctx.context.tasks.todo} tâche(s) déjà ouvertes`,
        ],
        [`Titre proposé : « ${title} »`],
      ),
    };
  },
};

export const createReminderBuilder: ActionBuilder = {
  type: "createReminder",
  canBuild(ctx) {
    return /rappel|reminder|pense à/i.test(ctx.message);
  },
  build(ctx) {
    const title =
      ctx.message.replace(/rappel|reminder|créer|un/gi, "").trim().slice(0, 80) ||
      "Rappel personnel";

    return {
      type: "createReminder",
      description: "Créer un rappel",
      summary: `Créer le rappel « ${title} »`,
      target: "tasks",
      payload: {
        userId: ctx.userId,
        title,
        category: "reminder",
        estimatedMinutes: 15,
        priority: 4,
        splittable: false,
      },
      riskLevel: "low",
      requiresConfirmation: true,
      estimatedImpact: "Rappel ajouté comme tâche légère.",
      sourceIntent: ctx.classification.intent,
      origin: "assistant",
      preview: basePreview(
        "Créer un rappel",
        ["Pas de rappel existant"],
        [`Rappel « ${title} »`],
        "Un rappel sera visible dans vos tâches.",
        [title],
        0.7,
        "low",
      ),
      explainability: baseExplainability(
        "Demande explicite de rappel.",
        ["Mot-clé rappel détecté dans le message."],
        [`Libellé : « ${title} »`],
      ),
    };
  },
};

export const modifyTaskBuilder: ActionBuilder = {
  type: "modifyTask",
  canBuild(ctx) {
    return (
      ctx.classification.intent === "organization" &&
      ctx.context.tasks.todo > 0 &&
      /modifier|changer|mettre à jour/i.test(ctx.message)
    );
  },
  build(ctx) {
    const title = topTaskTitle(ctx) ?? "Tâche";
    return {
      type: "modifyTask",
      description: "Modifier une tâche existante",
      summary: `Modifier « ${title} »`,
      target: "tasks",
      payload: {
        userId: ctx.userId,
        taskId: "",
        title,
        status: "done",
      },
      riskLevel: "medium",
      requiresConfirmation: true,
      estimatedImpact: "Statut ou propriété de la tâche modifiée.",
      sourceIntent: ctx.classification.intent,
      origin: "assistant",
      preview: basePreview(
        "Modifier une tâche",
        [`Tâche « ${title} » — statut actuel : à faire`],
        [`Tâche « ${title} » — statut : terminée`],
        "La tâche sera marquée terminée après confirmation.",
        [title],
        0.65,
        "medium",
      ),
      explainability: baseExplainability(
        "Modification de tâche demandée.",
        ["Tâche prioritaire visible dans le contexte."],
        [`Cible : « ${title} »`],
      ),
    };
  },
};

export const deleteTaskBuilder: ActionBuilder = {
  type: "deleteTask",
  canBuild(ctx) {
    return /supprimer|effacer|retirer.*tâche/i.test(ctx.message);
  },
  build(ctx) {
    const title = topTaskTitle(ctx) ?? "Tâche";
    return {
      type: "deleteTask",
      description: "Supprimer une tâche",
      summary: `Supprimer « ${title} »`,
      target: "tasks",
      payload: { userId: ctx.userId, taskId: "", title },
      riskLevel: "high",
      requiresConfirmation: true,
      estimatedImpact: "La tâche sera annulée (soft delete).",
      sourceIntent: ctx.classification.intent,
      origin: "assistant",
      preview: basePreview(
        "Supprimer une tâche",
        [`Tâche « ${title} » active`],
        ["Tâche retirée de la liste active"],
        "Action irréversible sans Undo (EPIC futur).",
        [title],
        0.6,
        "high",
      ),
      explainability: baseExplainability(
        "Suppression demandée explicitement.",
        ["Demande de retrait d'une tâche."],
        [`Cible proposée : « ${title} »`],
      ),
    };
  },
};

export const moveTaskBuilder: ActionBuilder = {
  type: "moveTask",
  canBuild(ctx) {
    if (isEventRescheduleRequest(ctx)) return false;
    return (
      ctx.classification.intent === "planning" ||
      /déplacer|reporter|demain|plus tard/i.test(ctx.message)
    );
  },
  build(ctx) {
    const title = topTaskTitle(ctx) ?? "Tâche non urgente";
    const targetDate = ctx.date;
    const adaptiveConfidence =
      ctx.context.adaptiveIntelligence?.enabled &&
      ctx.context.adaptiveIntelligence.validatedPreferenceCount > 0
        ? ctx.context.adaptiveIntelligence.learningConfidence
        : ctx.humanModel.availability.confidence;
    const dailySignal = ctx.context.dailyState?.today ?? null;
    const confidence = actionConfidenceFromState(dailySignal, adaptiveConfidence);
    return {
      type: "moveTask",
      description: "Déplacer une tâche",
      summary: `Reporter « ${title} »`,
      target: "planning",
      payload: {
        userId: ctx.userId,
        taskId: "",
        title,
        sourceDate: ctx.date,
        targetDate,
      },
      riskLevel: "medium",
      requiresConfirmation: true,
      estimatedImpact: "La tâche sera déplacée sur un autre jour.",
      sourceIntent: ctx.classification.intent,
      origin: "assistant",
      preview: basePreview(
        "Déplacer une tâche",
        [`« ${title} » planifiée le ${ctx.date}`],
        [`« ${title} » reportée`],
        "Le planning du jour sera allégé.",
        [title],
        confidence,
        "medium",
      ),
      explainability: baseExplainability(
        "Charge ou fatigue — report proposé.",
        ctx.humanModel.availability.reasons.slice(0, 2),
        [`Tâche : « ${title} »`],
        [`Journée source : ${ctx.date}`],
      ),
    };
  },
};

export const updateGoalBuilder: ActionBuilder = {
  type: "updateGoal",
  canBuild(ctx) {
    return ctx.classification.intent === "goals" && ctx.context.goals.enabled;
  },
  build(ctx) {
    const goal = ctx.context.goals.goals[0];
    const name = goal?.name ?? "Objectif";
    return {
      type: "updateGoal",
      description: "Modifier un objectif",
      summary: `Mettre à jour « ${name} »`,
      target: "goals",
      payload: {
        userId: ctx.userId,
        goalId: goal?.id ?? "",
        name,
        importance: "high" as const,
      },
      riskLevel: "medium",
      requiresConfirmation: true,
      estimatedImpact: "Propriétés de l'objectif mises à jour.",
      sourceIntent: ctx.classification.intent,
      origin: "assistant",
      preview: basePreview(
        "Modifier un objectif",
        [`Objectif « ${name} »`],
        [`Objectif « ${name} » — importance renforcée`],
        "Priorisation de l'objectif ajustée.",
        [name],
        0.7,
        "medium",
      ),
      explainability: baseExplainability(
        "Discussion objectifs — mise à jour proposée.",
        ctx.humanModel.dominantGoal.reasons.slice(0, 2),
        [`Objectif dominant : « ${name} »`],
      ),
    };
  },
};

export const reorganizeDayBuilder: ActionBuilder = {
  type: "reorganizeDay",
  canBuild(ctx) {
    if (isEventRescheduleRequest(ctx)) return false;
    if (ctx.context.semanticPlanning?.enabled) {
      return (
        ctx.classification.intent === "planning" &&
        shouldProposeReorganizeDay({
          mentalLoad: ctx.context.semanticPlanning.mentalLoad,
          blockCount: ctx.context.planning.blockCount,
          eventCount: ctx.context.semanticPlanning.eventCount,
        })
      );
    }
    return (
      ctx.classification.intent === "planning" &&
      (ctx.context.planning.blockCount >= 5 || ctx.humanModel.mentalLoad.value === "Charge forte")
    );
  },
  build(ctx) {
    return {
      type: "reorganizeDay",
      description: "Réorganiser la journée",
      summary: `Alléger le planning du ${ctx.date}`,
      target: "planning",
      payload: { userId: ctx.userId, date: ctx.date },
      riskLevel: "medium",
      requiresConfirmation: true,
      estimatedImpact: "Tâches non urgentes reportées automatiquement.",
      sourceIntent: ctx.classification.intent,
      origin: "assistant",
      preview: basePreview(
        "Réorganiser la journée",
        [`${ctx.context.planning.blockCount} bloc(s) — charge ${ctx.humanModel.mentalLoad.value ?? "?"}`],
        ["Planning allégé — tâches secondaires décalées"],
        "Meilleure adéquation avec votre disponibilité.",
        [`Planning ${ctx.date}`],
        ctx.humanModel.confidence,
        "medium",
      ),
      explainability: baseExplainability(
        "Journée dense — réorganisation proposée.",
        ctx.humanModel.mentalLoad.reasons.slice(0, 3),
        ["Cible : planning du jour"],
        [`Date : ${ctx.date}`],
      ),
    };
  },
};

export const rescheduleEventBuilder: ActionBuilder = {
  type: "rescheduleEvent",
  canBuild(ctx) {
    return /événement|bloc|créneau|replanifier/i.test(ctx.message);
  },
  build(ctx) {
    return {
      type: "rescheduleEvent",
      description: "Reporter un événement",
      summary: "Reporter un bloc du planning",
      target: "planning",
      payload: { userId: ctx.userId, date: ctx.date, entryId: "" },
      riskLevel: "medium",
      requiresConfirmation: true,
      estimatedImpact: "Un bloc horaire sera déplacé.",
      sourceIntent: ctx.classification.intent,
      origin: "assistant",
      preview: basePreview(
        "Reporter un événement",
        ["Bloc actuel sur le planning"],
        ["Bloc reporté"],
        "Agenda modifié après confirmation.",
        ["Bloc planning"],
        0.55,
        "medium",
      ),
      explainability: baseExplainability(
        "Demande de replanification.",
        ["Mot-clé replanifier / créneau détecté."],
        [],
        [`Journée : ${ctx.date}`],
      ),
    };
  },
};

export const notifyHouseholdBuilder: ActionBuilder = {
  type: "notifyHousehold",
  canBuild(ctx) {
    return ctx.classification.intent === "family" || ctx.classification.intent === "household";
  },
  build(ctx) {
    const message = `Info de ${ctx.firstName} — ${ctx.date}`;
    return {
      type: "notifyHousehold",
      description: "Notifier le foyer",
      summary: "Envoyer une notification au foyer",
      target: "household",
      payload: { userId: ctx.userId, message },
      riskLevel: "high",
      requiresConfirmation: true,
      estimatedImpact: "Les membres du foyer recevront un message.",
      sourceIntent: ctx.classification.intent,
      origin: "assistant",
      preview: basePreview(
        "Notifier le foyer",
        ["Aucune notification envoyée"],
        [`Message : « ${message} »`],
        "Communication collaborative déclenchée.",
        [`${ctx.context.household.members.length} membre(s)`],
        0.5,
        "high",
      ),
      explainability: baseExplainability(
        "Contexte familial — notification proposée.",
        ctx.humanModel.familyPressure.reasons.slice(0, 2),
        [`Foyer : ${ctx.context.household.childrenCount} enfant(s)`],
      ),
    };
  },
};

export const ACTION_BUILDERS: readonly ActionBuilder[] = [
  createTaskBuilder,
  createReminderBuilder,
  modifyTaskBuilder,
  deleteTaskBuilder,
  moveTaskBuilder,
  updateGoalBuilder,
  reorganizeDayBuilder,
  rescheduleEventBuilder,
  notifyHouseholdBuilder,
];

export function resolveActionBuilders(ctx: ActionBuilderContext): ActionBuilder[] {
  const matched = ACTION_BUILDERS.filter((builder) => builder.canBuild(ctx));
  if (isEventRescheduleRequest(ctx)) {
    const eventBuilders = matched.filter((builder) => builder.type === "rescheduleEvent");
    if (eventBuilders.length > 0) return eventBuilders;
  }
  return matched;
}

export async function enrichDraftWithTaskIds(
  draft: SecureActionDraft,
  ctx: ActionBuilderContext,
  getUserTasksFn: (userId: string) => Promise<Array<{ id: string; title: string }>>,
): Promise<SecureActionDraft> {
  const needsTaskId = ["modifyTask", "deleteTask", "moveTask"].includes(draft.type);
  if (!needsTaskId) return draft;

  const tasks = await getUserTasksFn(ctx.userId);
  const title = String(draft.payload.title ?? draft.payload.taskTitle ?? "");
  const match =
    tasks.find((task) => task.title === title) ??
    tasks.find((task) => title && task.title.includes(title));

  if (!match) return draft;

  return {
    ...draft,
    payload: {
      ...draft.payload,
      taskId: match.id,
      title: match.title,
    },
  };
}
