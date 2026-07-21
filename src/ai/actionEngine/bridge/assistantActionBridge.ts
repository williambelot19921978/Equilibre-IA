/**
 * EPIC 4C — Bridge Conversation Engine ↔ Action Engine.
 * Le Conversation Engine ne touche jamais aux services métier directement.
 */

import type { AssistantConversationContext } from "../../conversationFoundation/types/assistantContext";
import type { IntentClassification } from "../../conversationFoundation/types/intents";
import type {
  AssistantResponse,
  ProposedAssistantAction,
  ProposedAssistantActionStatus,
} from "../../conversationFoundation/types/responseContract";
import type { HumanModel } from "../../humanModelFoundation";
import type { ActionBuilderContext } from "../types/actionBuilder";
import type { SecureAction, SecureActionStatus } from "../types/secureAction";

export function buildActionBuilderContext(input: {
  readonly userId: string;
  readonly firstName: string;
  readonly message: string;
  readonly date?: string;
  readonly context: AssistantConversationContext;
  readonly humanModel: HumanModel;
  readonly classification: IntentClassification;
}): ActionBuilderContext {
  return {
    userId: input.userId,
    firstName: input.firstName,
    date: input.date ?? input.context.date,
    message: input.message,
    context: input.context,
    humanModel: input.humanModel,
    classification: input.classification,
  };
}

function mapActionStatus(status: SecureActionStatus): ProposedAssistantActionStatus {
  switch (status) {
    case "pending_confirmation":
      return "pending_confirmation";
    case "confirmed":
      return "confirmed";
    case "executed":
      return "executed";
    case "cancelled":
      return "cancelled";
    case "failed":
      return "failed";
    case "expired":
      return "expired";
    default:
      return "pending_confirmation";
  }
}

export function secureActionToProposed(action: SecureAction): ProposedAssistantAction {
  const status = mapActionStatus(action.status);
  const executable =
    action.validation.valid &&
    action.executionAvailable &&
    status === "pending_confirmation" &&
    action.requiresConfirmation;

  return {
    type: action.type,
    label: action.summary,
    description: action.description,
    payload: action.payload,
    executable,
    status,
    actionId: action.id,
    preview: action.preview,
    explainability: action.explainability,
    riskLevel: action.riskLevel,
    estimatedImpact: action.estimatedImpact,
    validationValid: action.validation.valid,
    validationIssues: action.validation.issues,
    executionAvailable: action.executionAvailable,
    calendarScope: action.calendarScope,
  };
}

export function mergeSecureActionsIntoResponse(
  response: AssistantResponse,
  actions: readonly SecureAction[],
): AssistantResponse {
  if (actions.length === 0) return response;

  const proposedActions = actions.map(secureActionToProposed);
  const validCount = actions.filter((action) => action.validation.valid).length;
  const actionHint =
    validCount > 0
      ? `\n\nJe peux préparer ${validCount} action(s) — confirme avant toute modification.`
      : "\n\nUne action a été détectée mais nécessite des corrections avant confirmation.";

  return {
    ...response,
    text: `${response.text}${actionHint}`.trim(),
    proposedActions,
  };
}

export function updateProposedActionStatus(
  response: AssistantResponse,
  actionId: string,
  status: ProposedAssistantActionStatus,
): AssistantResponse {
  return {
    ...response,
    proposedActions: response.proposedActions.map((action) =>
      action.actionId === actionId
        ? { ...action, status, executable: false }
        : action,
    ),
  };
}
