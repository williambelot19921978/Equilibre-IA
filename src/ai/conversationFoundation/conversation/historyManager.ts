/**
 * EPIC 4A — Conversation history manager (local persistence foundation).
 */

import type {
  ActiveConversation,
  ConversationMessage,
  ConversationStoreState,
  ConversationSummary,
} from "../types/conversationHistory";
import type { AssistantResponse } from "../types/responseContract";
import type { ProposedAssistantActionStatus } from "../types/responseContract";
import { summarizeHistory } from "./promptBuilder";

const STORAGE_PREFIX = "equilibre-assistant-conversation:";

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createEmptyConversation(userId: string): ActiveConversation {
  const now = new Date().toISOString();
  return {
    id: createId("conv"),
    userId,
    title: "Conversation actuelle",
    messages: [],
    createdAt: now,
    updatedAt: now,
    archived: false,
  };
}

export function loadConversationStore(userId: string): ConversationStoreState {
  if (typeof localStorage === "undefined") {
    return { active: createEmptyConversation(userId), archives: [] };
  }

  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) {
      return { active: createEmptyConversation(userId), archives: [] };
    }

    const parsed = JSON.parse(raw) as ConversationStoreState;
    return {
      active: parsed.active ?? createEmptyConversation(userId),
      archives: parsed.archives ?? [],
    };
  } catch {
    return { active: createEmptyConversation(userId), archives: [] };
  }
}

export function saveConversationStore(
  userId: string,
  state: ConversationStoreState,
): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(storageKey(userId), JSON.stringify(state));
}

export function appendConversationMessage({
  conversation,
  role,
  content,
  response,
}: {
  conversation: ActiveConversation;
  role: ConversationMessage["role"];
  content: string;
  response?: AssistantResponse;
}): ActiveConversation {
  const message: ConversationMessage = {
    id: createId("msg"),
    role,
    content,
    createdAt: new Date().toISOString(),
    response,
  };

  return {
    ...conversation,
    messages: [...conversation.messages, message],
    updatedAt: message.createdAt,
    title:
      conversation.messages.length === 0 && role === "user"
        ? content.slice(0, 48)
        : conversation.title,
  };
}

export function buildConversationSummary(
  conversation: ActiveConversation,
): ConversationSummary {
  return {
    conversationId: conversation.id,
    summary: summarizeHistory(conversation.messages),
    updatedAt: conversation.updatedAt,
    messageCount: conversation.messages.length,
  };
}

export function clearActiveConversation(userId: string): ConversationStoreState {
  return { active: createEmptyConversation(userId), archives: [] };
}

/** Future: archive active conversation — architecture only. */
export function archiveActiveConversation(
  state: ConversationStoreState,
): ConversationStoreState {
  if (!state.active || state.active.messages.length === 0) {
    return state;
  }

  const summary = buildConversationSummary(state.active);

  return {
    active: createEmptyConversation(state.active.userId),
    archives: [
      ...state.archives,
      {
        id: state.active.id,
        userId: state.active.userId,
        title: state.active.title,
        summary,
        archivedAt: new Date().toISOString(),
        archived: true,
      },
    ],
  };
}

export function trimConversationMessages(
  conversation: ActiveConversation,
  maxMessages: number,
): ActiveConversation {
  if (conversation.messages.length <= maxMessages) return conversation;
  return {
    ...conversation,
    messages: conversation.messages.slice(-maxMessages),
  };
}

export function patchConversationActionStatus(
  conversation: ActiveConversation,
  actionId: string,
  status: ProposedAssistantActionStatus,
): ActiveConversation {
  return {
    ...conversation,
    updatedAt: new Date().toISOString(),
    messages: conversation.messages.map((message) => {
      if (!message.response) return message;
      const hasAction = message.response.proposedActions.some(
        (action) => action.actionId === actionId,
      );
      if (!hasAction) return message;

      const response: AssistantResponse = {
        ...message.response,
        proposedActions: message.response.proposedActions.map((action) =>
          action.actionId === actionId
            ? { ...action, status, executable: false }
            : action,
        ),
      };

      return { ...message, response };
    }),
  };
}
