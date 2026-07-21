/**
 * EPIC 4A — Conversation Engine (read-only foundation).
 * Independent from UI — orchestrates context, routing, prompt, response.
 */

import { buildHumanModel } from "../../humanModelFoundation";
import type { HumanModel } from "../../humanModelFoundation";
import { buildAssistantContext } from "../context/contextEngine";
import type { ContextEngineDependencies } from "../context/contextEngineDependencies";
import { classifyIntent } from "../intent/intentRouter";
import type { IntentRouterRegistry } from "../intent/intentRouter";
import type { AssistantConversationContext } from "../types/assistantContext";
import type {
  ActiveConversation,
  ConversationMessage,
} from "../types/conversationHistory";
import type { AssistantResponse } from "../types/responseContract";
import {
  appendConversationMessage,
  buildConversationSummary,
  loadConversationStore,
  patchConversationActionStatus,
  saveConversationStore,
  trimConversationMessages,
} from "./historyManager";
import { buildAssistantPrompt } from "./promptBuilder";
import { buildReadOnlyAssistantResponse } from "./responseBuilder";
import {
  buildActionBuilderContext,
  mergeSecureActionsIntoResponse,
} from "../../actionEngine";
import type { SecureActionEngine } from "../../actionEngine/engine/actionEngine";
import { secureActionEngine as defaultSecureActionEngine } from "../../actionEngine/engine/actionEngine";
import type { ConfirmActionResult } from "../../actionEngine";

export type ProcessAssistantMessageInput = {
  readonly userId: string;
  readonly firstName?: string;
  readonly message: string;
  readonly date?: string;
};

export type ProcessAssistantMessageOutput = {
  readonly response: AssistantResponse;
  readonly context: AssistantConversationContext;
  readonly humanModel: HumanModel;
  readonly promptPreview: ReturnType<typeof buildAssistantPrompt>;
  readonly conversation: ActiveConversation;
};

export type ConfirmAssistantActionOutput = {
  readonly conversation: ActiveConversation;
  readonly result: ConfirmActionResult;
};

export type CancelAssistantActionOutput = {
  readonly conversation: ActiveConversation;
  readonly actionId: string;
};

export type ConversationEngineOptions = {
  readonly maxHistoryMessages?: number;
  readonly contextDeps?: ContextEngineDependencies;
  readonly intentRegistry?: IntentRouterRegistry;
  readonly actionEngine?: SecureActionEngine;
};

const DEFAULT_MAX_HISTORY = 24;

export class AssistantConversationEngine {
  private readonly maxHistoryMessages: number;
  private readonly contextDeps?: ContextEngineDependencies;
  private readonly intentRegistry?: IntentRouterRegistry;
  private readonly actionEngine: SecureActionEngine;

  constructor(options: ConversationEngineOptions = {}) {
    this.maxHistoryMessages = options.maxHistoryMessages ?? DEFAULT_MAX_HISTORY;
    this.contextDeps = options.contextDeps;
    this.intentRegistry = options.intentRegistry;
    this.actionEngine = options.actionEngine ?? defaultSecureActionEngine;
  }

  async processMessage(
    input: ProcessAssistantMessageInput,
  ): Promise<ProcessAssistantMessageOutput> {
    const trimmed = input.message.trim();
    if (!trimmed) {
      throw new Error("Message vide.");
    }

    const store = loadConversationStore(input.userId);
    const active = store.active ?? {
      id: `conv-${Date.now()}`,
      userId: input.userId,
      title: "Conversation",
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      archived: false as const,
    };

    const context = await buildAssistantContext(
      {
        userId: input.userId,
        firstName: input.firstName,
        date: input.date,
      },
      this.contextDeps,
    );

    const humanModel = buildHumanModel(context);

    const classification = classifyIntent(trimmed, this.intentRegistry);
    const promptPreview = buildAssistantPrompt({
      context,
      humanModel,
      message: trimmed,
      history: active.messages,
      classification,
    });

    let response = buildReadOnlyAssistantResponse({
      context,
      humanModel,
      classification,
    });

    if (this.actionEngine.isEnabled()) {
      const builderCtx = buildActionBuilderContext({
        userId: input.userId,
        firstName: input.firstName ?? context.user.firstName,
        message: trimmed,
        date: input.date,
        context,
        humanModel,
        classification,
      });
      const prepared = await this.actionEngine.prepareActions(builderCtx);
      response = mergeSecureActionsIntoResponse(response, prepared.actions);
    }

    let conversation = appendConversationMessage({
      conversation: active,
      role: "user",
      content: trimmed,
    });

    conversation = appendConversationMessage({
      conversation,
      role: "assistant",
      content: response.text,
      response,
    });

    conversation = trimConversationMessages(conversation, this.maxHistoryMessages);

    const summary = buildConversationSummary(conversation);
    conversation = { ...conversation, summary };

    saveConversationStore(input.userId, {
      active: conversation,
      archives: store.archives,
    });

    return {
      response,
      context,
      humanModel,
      promptPreview,
      conversation,
    };
  }

  getConversation(userId: string): ActiveConversation | null {
    return loadConversationStore(userId).active;
  }

  getRecentMessages(userId: string, limit = 8): readonly ConversationMessage[] {
    const active = this.getConversation(userId);
    if (!active) return [];
    return active.messages.slice(-limit);
  }

  async confirmAction(
    userId: string,
    actionId: string,
  ): Promise<ConfirmAssistantActionOutput> {
    const store = loadConversationStore(userId);
    const active = store.active;
    if (!active) {
      throw new Error("Aucune conversation active.");
    }

    const result = await this.actionEngine.confirmAction(userId, actionId);
    const status = result.report.success ? "executed" : "failed";
    let conversation = patchConversationActionStatus(active, actionId, status);

    const feedback = result.report.success
      ? `Action réalisée. ${result.report.message}`
      : `Erreur. ${result.report.message}`;

    conversation = appendConversationMessage({
      conversation,
      role: "assistant",
      content: feedback,
    });

    conversation = trimConversationMessages(conversation, this.maxHistoryMessages);
    conversation = {
      ...conversation,
      summary: buildConversationSummary(conversation),
    };

    saveConversationStore(userId, { active: conversation, archives: store.archives });
    return { conversation, result };
  }

  cancelAction(userId: string, actionId: string): CancelAssistantActionOutput {
    const store = loadConversationStore(userId);
    const active = store.active;
    if (!active) {
      throw new Error("Aucune conversation active.");
    }

    this.actionEngine.cancelAction(userId, actionId);
    let conversation = patchConversationActionStatus(active, actionId, "cancelled");

    conversation = appendConversationMessage({
      conversation,
      role: "assistant",
      content: "Action abandonnée.",
    });

    conversation = trimConversationMessages(conversation, this.maxHistoryMessages);
    conversation = {
      ...conversation,
      summary: buildConversationSummary(conversation),
    };

    saveConversationStore(userId, { active: conversation, archives: store.archives });
    return { conversation, actionId };
  }
}

export const assistantConversationEngine = new AssistantConversationEngine();
