/** EPIC 4A — Conversation persistence architecture (foundation). */

import type { AssistantResponse } from "./responseContract";

export type ConversationMessageRole = "user" | "assistant" | "system";

export type ConversationMessage = {
  readonly id: string;
  readonly role: ConversationMessageRole;
  readonly content: string;
  readonly createdAt: string;
  readonly response?: AssistantResponse;
};

export type ConversationSummary = {
  readonly conversationId: string;
  readonly summary: string;
  readonly updatedAt: string;
  readonly messageCount: number;
};

/** Active thread shown in the UI. */
export type ActiveConversation = {
  readonly id: string;
  readonly userId: string;
  readonly title: string;
  readonly messages: readonly ConversationMessage[];
  readonly summary?: ConversationSummary;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly archived: false;
};

/** Future archive slot — not implemented in UI yet. */
export type ArchivedConversation = {
  readonly id: string;
  readonly userId: string;
  readonly title: string;
  readonly summary: ConversationSummary;
  readonly archivedAt: string;
  readonly archived: true;
};

export type ConversationStoreState = {
  readonly active: ActiveConversation | null;
  readonly archives: readonly ArchivedConversation[];
};
