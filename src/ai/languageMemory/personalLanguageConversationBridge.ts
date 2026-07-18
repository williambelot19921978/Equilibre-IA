import { resolveActions, formatAssistantReply } from "../nlp/actionResolver";
import {
  classifyLanguageConfirmationResponse,
  confirmPersonalExpression,
  createLanguageConfirmationRequest,
  extractCorrectedMeaning,
  isLanguageConfirmationExpired,
  learnPersonalExpression,
  normalizeExpressionParts,
  rejectPersonalExpression,
  resolvePersonalExpression,
  buildNeutralUncertaintyPrompt,
} from "../languageMemory";
import type { LanguageExpressionMemory, LanguageHypothesis } from "../languageMemory/types";
import type {
  ConversationState,
  ConversationTurnResult,
  NlpParseResult,
  NlpRuntimeContext,
} from "../../types/nlp";
import type { ExecuteActionsFn } from "../nlp/conversationEngine";
import { parseUserMessage } from "../nlp/intentEngine";

type MessageFactory = (
  role: "user" | "assistant",
  text: string,
) => import("../../types/nlp").ConversationMessage;

type AppendMessageFn = (
  state: ConversationState,
  message: import("../../types/nlp").ConversationMessage,
) => ConversationState;

export type PersonalLanguagePersistence = {
  saveExpression: (memory: LanguageExpressionMemory) => Promise<LanguageExpressionMemory>;
  recordEvent: (
    eventType: import("../languageMemory/types").LanguageLearningEventType,
    expressionId: string | null,
    payload?: Record<string, unknown>,
  ) => Promise<void>;
};

function findExistingMemory(
  memories: LanguageExpressionMemory[],
  hypothesis: LanguageHypothesis,
): LanguageExpressionMemory | null {
  if (hypothesis.expressionMemoryId) {
    return memories.find((memory) => memory.id === hypothesis.expressionMemoryId) ?? null;
  }
  return (
    memories.find(
      (memory) => memory.normalizedExpression === hypothesis.normalizedExpression,
    ) ?? null
  );
}

function overrideParseWithHypothesis(
  parseResult: NlpParseResult,
  hypothesis: LanguageHypothesis,
): NlpParseResult {
  return {
    ...parseResult,
    intent: hypothesis.resolvedIntent,
    confidence: Math.max(parseResult.confidence, hypothesis.confidence),
    rawText: parseResult.rawText,
  };
}

export async function handlePendingLanguageConfirmation({
  text,
  state,
  runtimeContext,
  executeActions,
  persistence,
  appendMessage,
  createMessage,
}: {
  text: string;
  state: ConversationState;
  runtimeContext: NlpRuntimeContext;
  executeActions: ExecuteActionsFn;
  persistence: PersonalLanguagePersistence;
  appendMessage: AppendMessageFn;
  createMessage: MessageFactory;
}): Promise<ConversationTurnResult | null> {
  const pending = state.pending;
  if (pending?.kind !== "language_confirmation") return null;

  if (isLanguageConfirmationExpired(pending.expiresAt)) {
    const assistantMessage =
      "La demande de confirmation a expiré. Tu peux reformuler ton expression.";
    const nextState = appendMessage(
      { ...state, pending: undefined },
      createMessage("assistant", assistantMessage),
    );
    return {
      state: nextState,
      actionsExecuted: [],
      replanDates: [],
      assistantMessage,
      explanation: ["language_confirmation_expired"],
    };
  }

  const responseKind = classifyLanguageConfirmationResponse(text);
  const hypothesis = pending.hypothesis;
  const memories = runtimeContext.personalLanguageExpressions ?? [];
  const existing = findExistingMemory(memories, hypothesis);

  if (responseKind === "confirm") {
    const learned = learnPersonalExpression(
      {
        userId: runtimeContext.userId,
        originalText: pending.originalText,
        normalizedExpression: pending.normalizedExpression,
        resolvedIntent: hypothesis.resolvedIntent,
        resolvedMeaning: hypothesis.resolvedMeaning,
        context: pending.contextFingerprint,
        existing,
      },
      runtimeContext.referenceDate,
    );
    const confirmed = confirmPersonalExpression(learned, runtimeContext.referenceDate);
    const saved = await persistence.saveExpression(confirmed);
    await persistence.recordEvent("confirm", saved.id, {
      normalizedExpression: saved.normalizedExpression,
    });

    const parseResult = overrideParseWithHypothesis(
      parseUserMessage({
        text: pending.originalText,
        referenceDate: runtimeContext.referenceDate,
        childNames: runtimeContext.childNames,
      }),
      hypothesis,
    );

    const resolved = resolveActions({
      parseResult,
      referenceDate: runtimeContext.referenceDate,
    });
    const result = await executeActions(resolved.actions);
    const assistantMessage = formatAssistantReply({
      intent: parseResult.intent,
      actions: resolved.actions,
      executionSummaries: result.summaries,
      executionResult: result,
    });

    const nextState = appendMessage(
      { ...state, pending: undefined },
      createMessage("assistant", assistantMessage),
    );

    return {
      state: nextState,
      actionsExecuted: resolved.actions,
      replanDates: result.replanDates,
      assistantMessage,
      explanation: ["language_expression_confirmed", saved.normalizedExpression],
    };
  }

  if (responseKind === "reject" || responseKind === "correction") {
    const base = existing ??
      learnPersonalExpression(
        {
          userId: runtimeContext.userId,
          originalText: pending.originalText,
          normalizedExpression: pending.normalizedExpression,
          resolvedIntent: hypothesis.resolvedIntent,
          resolvedMeaning: hypothesis.resolvedMeaning,
          context: pending.contextFingerprint,
          existing: null,
        },
        runtimeContext.referenceDate,
      );

    const correctedMeaning = extractCorrectedMeaning(text);
    const rejected = rejectPersonalExpression(base, runtimeContext.referenceDate);
    const saved = await persistence.saveExpression(rejected);
    await persistence.recordEvent("reject", saved.id, {
      correctedMeaning,
    });

    const assistantMessage = correctedMeaning
      ? `Merci pour la précision — je retiens que « ${pending.normalizedExpression} » ne signifie pas ${hypothesis.resolvedMeaning} pour toi.`
      : "D'accord, je n'applique pas cette interprétation.";

    const nextState = appendMessage(
      { ...state, pending: undefined },
      createMessage("assistant", assistantMessage),
    );

    return {
      state: nextState,
      actionsExecuted: [],
      replanDates: [],
      assistantMessage,
      explanation: ["language_expression_rejected"],
    };
  }

  const reprompt = "Peux-tu confirmer avec « oui » ou « non » ?";
  const nextState = appendMessage(state, createMessage("assistant", reprompt));
  return {
    state: nextState,
    actionsExecuted: [],
    replanDates: [],
    assistantMessage: reprompt,
    explanation: ["language_confirmation_unclear"],
  };
}

export async function tryPersonalLanguageResolution({
  text,
  state,
  runtimeContext,
  parseResult,
  executeActions,
  persistence,
  appendMessage,
  createMessage,
}: {
  text: string;
  state: ConversationState;
  runtimeContext: NlpRuntimeContext;
  parseResult: NlpParseResult;
  executeActions: ExecuteActionsFn;
  persistence: PersonalLanguagePersistence;
  appendMessage: AppendMessageFn;
  createMessage: MessageFactory;
}): Promise<ConversationTurnResult | null> {
  const memories = runtimeContext.personalLanguageExpressions ?? [];
  const resolution = resolvePersonalExpression({
    message: text,
    userId: runtimeContext.userId,
    memories,
    nlpParse: parseResult,
    languageMemory: runtimeContext.languageMemory,
    referenceDate: runtimeContext.referenceDate,
  });

  if (resolution.mode === "no_match" || resolution.mode === "neutral_question") {
    if (resolution.mode === "neutral_question" && resolution.hypothesis) {
      const assistantMessage = buildNeutralUncertaintyPrompt();
      const nextState = appendMessage(state, createMessage("assistant", assistantMessage));
      return {
        state: nextState,
        actionsExecuted: [],
        replanDates: [],
        assistantMessage,
        explanation: [resolution.explanation],
      };
    }
    return null;
  }

  if (!resolution.hypothesis) return null;

  if (resolution.mode === "needs_confirmation") {
    const request = createLanguageConfirmationRequest(resolution.hypothesis);
    const nextState = appendMessage(
      {
        ...state,
        pending: {
          kind: "language_confirmation",
          hypothesis: resolution.hypothesis,
          prompt: request.prompt,
          expiresAt: request.expiresAt,
          normalizedExpression: request.normalizedExpression,
          originalText: request.originalText,
          contextFingerprint: resolution.contextFingerprint,
        },
      },
      createMessage("assistant", request.prompt),
    );

    const candidate = learnPersonalExpression(
      {
        userId: runtimeContext.userId,
        originalText: text,
        normalizedExpression: resolution.normalizedExpression,
        resolvedIntent: resolution.hypothesis.resolvedIntent,
        resolvedMeaning: resolution.hypothesis.resolvedMeaning,
        context: resolution.contextFingerprint,
        existing: resolution.matchedMemory,
      },
      runtimeContext.referenceDate,
    );

    if (!resolution.matchedMemory) {
      await persistence.saveExpression(candidate);
      await persistence.recordEvent("hypothesis", null, {
        normalizedExpression: candidate.normalizedExpression,
      });
    }

    return {
      state: nextState,
      actionsExecuted: [],
      replanDates: [],
      assistantMessage: request.prompt,
      explanation: [resolution.explanation],
    };
  }

  if (resolution.mode === "direct") {
    const existing = resolution.matchedMemory;
    if (existing) {
      const used = learnPersonalExpression(
        {
          userId: runtimeContext.userId,
          originalText: text,
          normalizedExpression: resolution.normalizedExpression,
          resolvedIntent: resolution.hypothesis.resolvedIntent,
          resolvedMeaning: resolution.hypothesis.resolvedMeaning,
          context: resolution.contextFingerprint,
          existing,
        },
        runtimeContext.referenceDate,
      );
      await persistence.saveExpression(used);
      await persistence.recordEvent("usage", used.id, {
        normalizedExpression: used.normalizedExpression,
      });
    }

    const enrichedParse = overrideParseWithHypothesis(parseResult, resolution.hypothesis);
    const resolved = resolveActions({
      parseResult: enrichedParse,
      referenceDate: runtimeContext.referenceDate,
    });
    const result = await executeActions(resolved.actions);
    const assistantMessage = formatAssistantReply({
      intent: enrichedParse.intent,
      actions: resolved.actions,
      executionSummaries: result.summaries,
      executionResult: result,
    });

    const nextState = appendMessage(
      state,
      createMessage("assistant", assistantMessage),
    );

    return {
      state: nextState,
      actionsExecuted: resolved.actions,
      replanDates: result.replanDates,
      assistantMessage,
      explanation: [resolution.explanation],
    };
  }

  return null;
}

export function shouldAttemptPersonalLanguageResolution(
  parseResult: NlpParseResult,
): boolean {
  if (parseResult.intent === "declare_fatigue") return false;
  if (parseResult.intent === "confirm" || parseResult.intent === "cancel") return false;
  return parseResult.intent === "unknown" || parseResult.confidence < 0.75;
}

export { normalizeExpressionParts };
