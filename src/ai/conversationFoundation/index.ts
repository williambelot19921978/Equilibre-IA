/** EPIC 4A — Conversation Foundation public API. */

export { buildAssistantContext } from "./context/contextEngine";
export type { BuildAssistantContextInput } from "./context/contextEngine";
export type { ContextEngineDependencies } from "./context/contextEngineDependencies";
export { defaultContextEngineDependencies } from "./context/contextEngineDependencies";

export {
  classifyIntent,
  createIntentRouterRegistry,
  defaultIntentRouterRegistry,
} from "./intent/intentRouter";
export type { IntentRule, IntentRouterRegistry } from "./intent/intentRouter";

export {
  AssistantConversationEngine,
  assistantConversationEngine,
} from "./conversation/conversationEngine";
export type {
  ConversationEngineOptions,
  ProcessAssistantMessageInput,
  ProcessAssistantMessageOutput,
  ConfirmAssistantActionOutput,
  CancelAssistantActionOutput,
} from "./conversation/conversationEngine";

export { buildAssistantPrompt, buildHumanModelBlock, summarizeHistory } from "./conversation/promptBuilder";
export { buildReadOnlyAssistantResponse } from "./conversation/responseBuilder";
export { buildHumanModel } from "../humanModelFoundation";
export {
  appendConversationMessage,
  archiveActiveConversation,
  clearActiveConversation,
  createEmptyConversation,
  loadConversationStore,
  saveConversationStore,
} from "./conversation/historyManager";

export { buildAssistantExplanation } from "./explainability/buildExplanation";

export {
  CONVERSATION_ACTION_PLACEHOLDERS,
  executePlaceholderAction,
  getActionPlaceholder,
} from "./types/actionPlaceholders";

export type { AssistantConversationContext } from "./types/assistantContext";
export type { AssistantResponse, ProposedAssistantAction } from "./types/responseContract";
export type { ConversationIntent, IntentClassification } from "./types/intents";
export type {
  ActiveConversation,
  ConversationMessage,
  ConversationStoreState,
} from "./types/conversationHistory";
