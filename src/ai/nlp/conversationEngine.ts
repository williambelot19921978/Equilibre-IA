import { enrichAssistantWithLanguageMemory } from "../core/enrichAssistantWithMemory";
import {
  handlePendingLanguageConfirmation,
  shouldAttemptPersonalLanguageResolution,
  tryPersonalLanguageResolution,
} from "../languageMemory/personalLanguageConversationBridge";
import { parseUserMessage } from "./intentEngine";
import {
  buildConfirmationPrompt,
  formatAssistantReply,
  resolveActions,
} from "./actionResolver";
import { detectClarificationNeeded } from "./nlpClarification";
import { normalizeNlpText } from "./entityExtractor";
import { enrichWorkEntities } from "../../lib/nlp/enrichWorkEntities";
import {
  createPendingConversationAction,
  computeMissingWorkEntities,
  isPendingActionExpired,
  isPendingCancellationPhrase,
} from "../../lib/nlp/pendingConversationAction";
import { resolvePendingClarificationResponse } from "./resolvePendingClarificationResponse";
import type {
  ConversationMessage,
  ConversationState,
  ConversationTurnResult,
  NlpAction,
  NlpParseResult,
  NlpRuntimeContext,
} from "../../types/nlp";

function createMessage(role: ConversationMessage["role"], text: string): ConversationMessage {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    text,
    timestamp: new Date().toISOString(),
  };
}

function appendMessage(
  state: ConversationState,
  message: ConversationMessage,
): ConversationState {
  return {
    ...state,
    messages: [...state.messages, message],
  };
}

export function createInitialConversationState(): ConversationState {
  return { messages: [] };
}

export type ExecuteActionsFn = (actions: NlpAction[]) => Promise<import("../../types/nlp").NlpExecutionResult>;

async function finalizeExecutedTurn({
  nextState,
  parseResult,
  resolvedActions,
  result,
  explanation,
  runtimeContext,
}: {
  nextState: ConversationState;
  parseResult: NlpParseResult;
  resolvedActions: NlpAction[];
  result: Awaited<ReturnType<ExecuteActionsFn>>;
  explanation: string[];
  runtimeContext: NlpRuntimeContext;
}): Promise<ConversationTurnResult> {
  const executionFailed =
    !result.persistSucceeded ||
    result.summaries.some(
      (summary) =>
        summary.toLowerCase().includes("échec") ||
        summary.toLowerCase().includes("impossible"),
    );
  const rawAssistantMessage = formatAssistantReply({
    intent: parseResult.intent,
    actions: resolvedActions,
    executionSummaries: result.summaries,
    executionFailed,
    executionResult: result,
  });
  const assistantMessage = enrichAssistantWithLanguageMemory({
    message: rawAssistantMessage,
    intent: parseResult.intent,
    languageMemory: runtimeContext.languageMemory,
  });

  const stateWithReply = appendMessage(
    { ...nextState, pending: undefined },
    createMessage("assistant", assistantMessage),
  );

  return {
    state: stateWithReply,
    actionsExecuted: resolvedActions,
    replanDates: result.replanDates,
    assistantMessage,
    explanation: [
      ...explanation,
      ...result.explanation,
      ...resolvedActions.map((action) => action.reason),
    ],
    debug: import.meta.env.DEV
      ? {
          normalizedText: normalizeNlpText(parseResult.rawText),
          detectedIntent: parseResult.intent,
          confidence: parseResult.confidence,
          entities: parseResult.entities,
          resolvedActionTypes: resolvedActions.map((action) => action.type),
          serviceResult: result.summaries,
          error: result.persistError,
        }
      : undefined,
  };
}

export function processConversationTurn({
  text,
  state,
  runtimeContext,
  executeActions,
}: {
  text: string;
  state: ConversationState;
  runtimeContext: NlpRuntimeContext;
  executeActions: ExecuteActionsFn;
}): Promise<ConversationTurnResult> {
  return processConversationTurnAsync({
    text,
    state,
    runtimeContext,
    executeActions,
  });
}

async function processConversationTurnAsync({
  text,
  state,
  runtimeContext,
  executeActions,
}: {
  text: string;
  state: ConversationState;
  runtimeContext: NlpRuntimeContext;
  executeActions: ExecuteActionsFn;
}): Promise<ConversationTurnResult> {
  let nextState = appendMessage(state, createMessage("user", text.trim()));
  const explanation: string[] = [];
  const persistence = runtimeContext.personalLanguagePersistence;

  if (state.pending?.kind === "language_confirmation" && persistence) {
    const languageResult = await handlePendingLanguageConfirmation({
      text,
      state: { ...state, messages: nextState.messages },
      runtimeContext,
      executeActions,
      persistence,
      appendMessage,
      createMessage,
    });
    if (languageResult) {
      return languageResult;
    }
  }

  if (state.pending?.kind === "confirmation") {
    const parse = parseUserMessage({
      text,
      referenceDate: runtimeContext.referenceDate,
      childNames: runtimeContext.childNames,
    });

    if (parse.intent === "confirm") {
      const result = await executeActions(state.pending.actions);
      const assistantMessage = formatAssistantReply({
        intent: "modify_tasks",
        actions: state.pending.actions,
        executionSummaries: result.summaries,
      });

      nextState = appendMessage(
        { ...nextState, pending: undefined },
        createMessage("assistant", assistantMessage),
      );

      return {
        state: nextState,
        actionsExecuted: state.pending.actions,
        replanDates: result.replanDates,
        assistantMessage,
        explanation: [...explanation, ...result.explanation],
      };
    }

    if (parse.intent === "cancel") {
      const assistantMessage = "D'accord, je n'ai rien modifié.";
      nextState = appendMessage(
        { ...nextState, pending: undefined },
        createMessage("assistant", assistantMessage),
      );

      return {
        state: nextState,
        actionsExecuted: [],
        replanDates: [],
        assistantMessage,
        explanation,
      };
    }

    const reprompt =
      "Tu as une confirmation en attente. Réponds « oui » pour confirmer ou « non » pour annuler.";
    nextState = appendMessage(nextState, createMessage("assistant", reprompt));
    return {
      state: nextState,
      actionsExecuted: [],
      replanDates: [],
      assistantMessage: reprompt,
      explanation,
    };
  }

  if (state.pending?.kind === "memory_proposal") {
    const parse = parseUserMessage({
      text,
      referenceDate: runtimeContext.referenceDate,
      childNames: runtimeContext.childNames,
    });

    if (parse.intent === "confirm") {
      const result = await executeActions(state.pending.actions);
      const assistantMessage = formatAssistantReply({
        intent: "modify_work",
        actions: state.pending.actions,
        executionSummaries: result.summaries,
      });

      nextState = appendMessage(
        { ...nextState, pending: undefined },
        createMessage("assistant", assistantMessage),
      );

      return {
        state: nextState,
        actionsExecuted: state.pending.actions,
        replanDates: result.replanDates,
        assistantMessage,
        explanation: [...explanation, ...result.explanation],
      };
    }

    if (parse.intent === "cancel") {
      const assistantMessage = "OK — ton rythme habituel reste inchangé.";
      nextState = appendMessage(
        { ...nextState, pending: undefined },
        createMessage("assistant", assistantMessage),
      );

      return {
        state: nextState,
        actionsExecuted: [],
        replanDates: [],
        assistantMessage,
        explanation,
      };
    }

    const reprompt =
      "Veux-tu modifier ton rythme habituel ? Réponds « oui » ou « non ».";
    nextState = appendMessage(nextState, createMessage("assistant", reprompt));
    return {
      state: nextState,
      actionsExecuted: [],
      replanDates: [],
      assistantMessage: reprompt,
      explanation,
    };
  }

  if (state.pending?.kind === "clarification") {
    const pending = state.pending;

    if (isPendingActionExpired(pending.action)) {
      nextState = { ...nextState, pending: undefined };
    } else if (isPendingCancellationPhrase(text)) {
      const assistantMessage =
        "D'accord, je n'applique pas cette modification.";
      nextState = appendMessage(
        { ...nextState, pending: undefined },
        createMessage("assistant", assistantMessage),
      );
      return {
        state: nextState,
        actionsExecuted: [],
        replanDates: [],
        assistantMessage,
        explanation,
      };
    } else {
      const quickParse = parseUserMessage({
        text,
        referenceDate: runtimeContext.referenceDate,
        childNames: runtimeContext.childNames,
      });
      const looksLikeNewRequest =
        quickParse.intent !== "unknown" &&
        quickParse.intent !== pending.action.intent &&
        quickParse.intent !== "confirm" &&
        quickParse.intent !== "cancel" &&
        !/^\d/.test(text.trim()) &&
        !/\d\s*h/.test(text.toLowerCase());

      if (looksLikeNewRequest) {
        const assistantMessage =
          "Tu as une demande en cours. Veux-tu l'abandonner pour cette nouvelle demande ? Réponds « annule » ou complète ta réponse précédente.";
        nextState = appendMessage(
          nextState,
          createMessage("assistant", assistantMessage),
        );
        return {
          state: nextState,
          actionsExecuted: [],
          replanDates: [],
          assistantMessage,
          explanation,
        };
      }

      const completion = resolvePendingClarificationResponse({
        text,
        pending: pending.action,
      });

      if (completion.stillMissing.length > 0 && completion.followUpMessage) {
        const updatedPending = {
          ...pending,
          action: {
            ...pending.action,
            collectedEntities: completion.mergedEntities,
            missingEntities: completion.stillMissing,
          },
          message: completion.followUpMessage,
        };
        nextState = appendMessage(
          { ...nextState, pending: updatedPending },
          createMessage("assistant", completion.followUpMessage),
        );
        return {
          state: nextState,
          actionsExecuted: [],
          replanDates: [],
          assistantMessage: completion.followUpMessage,
          explanation,
        };
      }

      const enrichedEntities = enrichWorkEntities(
        completion.mergedEntities,
        runtimeContext,
      );
      const enrichedParseResult: NlpParseResult = {
        intent: pending.action.intent,
        confidence: 0.95,
        entities: enrichedEntities,
        rawText: pending.action.originalText,
      };

      const resolved = resolveActions({
        parseResult: enrichedParseResult,
        referenceDate: runtimeContext.referenceDate,
      });

      const result = await executeActions(resolved.actions);
      return finalizeExecutedTurn({
        nextState,
        parseResult: enrichedParseResult,
        resolvedActions: resolved.actions,
        result,
        explanation,
        runtimeContext,
      });
    }
  }

  const parseResult = parseUserMessage({
    text,
    referenceDate: runtimeContext.referenceDate,
    childNames: runtimeContext.childNames,
  });

  const enrichedEntities = enrichWorkEntities(
    parseResult.entities,
    runtimeContext,
  );
  const enrichedParseResult = {
    ...parseResult,
    entities: enrichedEntities,
  };

  if (import.meta.env.DEV && parseResult.intent === "modify_work") {
    console.log("[NLP WORK TRACE]", {
      normalizedText: normalizeNlpText(text),
      detectedIntent: parseResult.intent,
      extractedDate: enrichedEntities.dates[0],
      workExceptionKind: enrichedEntities.workExceptionKind,
    });
  }

  if (persistence && shouldAttemptPersonalLanguageResolution(enrichedParseResult)) {
    const languageResult = await tryPersonalLanguageResolution({
      text,
      state: { ...state, messages: nextState.messages },
      runtimeContext,
      parseResult: enrichedParseResult,
      executeActions,
      persistence,
      appendMessage,
      createMessage,
    });
    if (languageResult) {
      return languageResult;
    }
  }

  const clarification = detectClarificationNeeded(enrichedParseResult);
  if (clarification.needsClarification && clarification.message) {
    const pendingAction = createPendingConversationAction({
      intent: parseResult.intent,
      originalText: text,
      missingEntities: computeMissingWorkEntities(enrichedEntities),
      collectedEntities: enrichedEntities,
      targetDate: enrichedEntities.dates[0],
    });

    nextState = {
      ...nextState,
      pending: {
        kind: "clarification",
        action: pendingAction,
        message: clarification.message,
      },
    };
    nextState = appendMessage(
      nextState,
      createMessage("assistant", clarification.message),
    );

    return {
      state: nextState,
      actionsExecuted: [],
      replanDates: [],
      assistantMessage: clarification.message,
      explanation: [],
      debug: import.meta.env.DEV
        ? {
            normalizedText: normalizeNlpText(text),
            detectedIntent: parseResult.intent,
            confidence: parseResult.confidence,
            entities: parseResult.entities,
            resolvedActionTypes: [],
          }
        : undefined,
    };
  }

  const resolved = resolveActions({
    parseResult: enrichedParseResult,
    referenceDate: runtimeContext.referenceDate,
  });

  if (import.meta.env.DEV && parseResult.intent === "modify_work") {
    console.log("[NLP WORK TRACE]", {
      resolvedActionTypes: resolved.actions.map((action) => action.type),
      payload: resolved.actions.find((action) => action.type === "MarkWorkDay")
        ?.payload,
    });
  }

  if (resolved.memoryProposal) {
    const assistantMessage = resolved.memoryProposal.prompt;
    nextState = {
      ...nextState,
      pending: {
        kind: "memory_proposal",
        actions: resolved.memoryProposal.actions,
        prompt: resolved.memoryProposal.prompt,
      },
    };
    nextState = appendMessage(nextState, createMessage("assistant", assistantMessage));

    return {
      state: nextState,
      actionsExecuted: [],
      replanDates: [],
      assistantMessage,
      explanation: resolved.memoryProposal.actions.map((action) => action.reason),
    };
  }

  const needsConfirmation = resolved.actions.some(
    (action) => action.requiresConfirmation,
  );

  if (needsConfirmation) {
    const prompt = buildConfirmationPrompt(resolved.actions);
    nextState = {
      ...nextState,
      pending: {
        kind: "confirmation",
        actions: resolved.actions,
        prompt,
      },
    };
    nextState = appendMessage(nextState, createMessage("assistant", prompt));

    return {
      state: nextState,
      actionsExecuted: [],
      replanDates: [],
      assistantMessage: prompt,
      explanation: resolved.actions.map((action) => action.reason),
    };
  }

  const result = await executeActions(resolved.actions);
  return finalizeExecutedTurn({
    nextState,
    parseResult: enrichedParseResult,
    resolvedActions: resolved.actions,
    result,
    explanation,
    runtimeContext,
  });
}
