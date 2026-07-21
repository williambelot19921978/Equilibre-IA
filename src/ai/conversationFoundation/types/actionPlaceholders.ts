/** EPIC 4A — Future action engine interfaces (read-only sprint). */

export type ActionExecutionResult = {
  readonly status: "not_implemented";
  readonly actionType: string;
  readonly message: string;
};

export type ConversationActionHandler = {
  readonly type: string;
  readonly label: string;
  execute: (
    payload: Readonly<Record<string, unknown>>,
  ) => Promise<ActionExecutionResult>;
};

const NOT_IMPLEMENTED_MESSAGE =
  "Action Engine EPIC 4B — exécution non disponible dans ce sprint (lecture seule).";

function createPlaceholder(type: string, label: string): ConversationActionHandler {
  return {
    type,
    label,
    async execute() {
      return {
        status: "not_implemented",
        actionType: type,
        message: NOT_IMPLEMENTED_MESSAGE,
      };
    },
  };
}

export const CONVERSATION_ACTION_PLACEHOLDERS: readonly ConversationActionHandler[] = [
  createPlaceholder("createTask", "Créer une tâche"),
  createPlaceholder("moveTask", "Déplacer une tâche"),
  createPlaceholder("updateGoal", "Mettre à jour un objectif"),
  createPlaceholder("reschedule", "Replanifier"),
  createPlaceholder("notifyHousehold", "Notifier le foyer"),
  createPlaceholder("updatePlanningBlock", "Modifier un bloc planning"),
  createPlaceholder("completeTask", "Terminer une tâche"),
];

export function getActionPlaceholder(
  type: string,
): ConversationActionHandler | undefined {
  return CONVERSATION_ACTION_PLACEHOLDERS.find((action) => action.type === type);
}

export async function executePlaceholderAction(
  type: string,
  payload: Readonly<Record<string, unknown>> = {},
): Promise<ActionExecutionResult> {
  const handler = getActionPlaceholder(type);
  if (!handler) {
    return {
      status: "not_implemented",
      actionType: type,
      message: `Action inconnue : ${type}`,
    };
  }
  return handler.execute(payload);
}
