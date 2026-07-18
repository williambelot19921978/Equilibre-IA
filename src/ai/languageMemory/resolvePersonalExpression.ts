import { LANGUAGE_CONFIDENCE_THRESHOLDS } from "./constants";
import {
  adjustConfidenceForContext,
  buildLanguageContextFingerprint,
} from "./buildLanguageContextFingerprint";
import { findColloquialPatternMatches } from "./colloquialPatternRegistry";
import {
  expressionsMatch,
  normalizeExpressionParts,
} from "./normalizeUserExpression";
import type {
  LanguageExpressionMemory,
  LanguageHypothesis,
  LanguageResolution,
} from "./types";
import type { LanguageMemoryContext } from "../core/buildLanguageMemoryContext";
import type { NlpParseResult } from "../../types/nlp";
import { updateExpressionConfidence } from "./updateExpressionConfidence";

const USABLE_STATUSES = new Set<LanguageExpressionMemory["status"]>([
  "candidate",
  "learning",
  "confirmed",
]);

function findMatchingMemory(
  memories: LanguageExpressionMemory[],
  userId: string,
  parts: ReturnType<typeof normalizeExpressionParts>,
): LanguageExpressionMemory | null {
  return (
    memories.find(
      (memory) =>
        memory.userId === userId &&
        USABLE_STATUSES.has(memory.status) &&
        expressionsMatch(memory.normalizedExpression, parts),
    ) ?? null
  );
}

function buildHypothesisFromMemory(
  memory: LanguageExpressionMemory,
  originalText: string,
  confidence: number,
): LanguageHypothesis {
  return {
    id: `memory-${memory.id}`,
    normalizedExpression: memory.normalizedExpression,
    originalText,
    resolvedIntent: memory.resolvedIntent,
    resolvedMeaning: memory.resolvedMeaning,
    confidence,
    source: "personal_memory",
    expressionMemoryId: memory.id,
  };
}

function buildHypothesisFromPattern(
  pattern: ReturnType<typeof findColloquialPatternMatches>[number],
  parts: ReturnType<typeof normalizeExpressionParts>,
  originalText: string,
): LanguageHypothesis {
  return {
    id: `bootstrap-${pattern.id}`,
    normalizedExpression: parts.core,
    originalText,
    resolvedIntent: pattern.resolvedIntent,
    resolvedMeaning: pattern.resolvedMeaning,
    confidence: pattern.bootstrapConfidence,
    source: "bootstrap_pattern",
    expressionMemoryId: null,
  };
}

function resolveMode(confidence: number): LanguageResolution["mode"] {
  if (confidence >= LANGUAGE_CONFIDENCE_THRESHOLDS.directUseMin) {
    return "direct";
  }
  if (confidence >= LANGUAGE_CONFIDENCE_THRESHOLDS.confirmationMin) {
    return "needs_confirmation";
  }
  if (confidence >= 0.35) {
    return "needs_confirmation";
  }
  return "neutral_question";
}

export function resolvePersonalExpression({
  message,
  userId,
  memories,
  nlpParse,
  languageMemory,
  referenceDate,
  lastUserTopic,
}: {
  message: string;
  userId: string;
  memories: LanguageExpressionMemory[];
  nlpParse: NlpParseResult;
  languageMemory?: LanguageMemoryContext | null;
  referenceDate: string;
  lastUserTopic?: string | null;
}): LanguageResolution {
  const parts = normalizeExpressionParts(message);
  const contextFingerprint = buildLanguageContextFingerprint({
    referenceDate,
    nlpParse,
    languageMemory,
    lastUserTopic,
  });

  const matchedMemory = findMatchingMemory(memories, userId, parts);

  if (matchedMemory) {
    const confidence = adjustConfidenceForContext({
      confidence: updateExpressionConfidence({
        confirmationCount: matchedMemory.confirmationCount,
        rejectionCount: matchedMemory.rejectionCount,
        usageCount: matchedMemory.usageCount,
        lastUsedAt: matchedMemory.lastUsedAt,
        referenceDate,
      }),
      fingerprint: contextFingerprint,
      resolvedIntent: matchedMemory.resolvedIntent,
    });

    const hypothesis = buildHypothesisFromMemory(matchedMemory, message, confidence);
    const mode =
      matchedMemory.status === "confirmed" && confidence >= LANGUAGE_CONFIDENCE_THRESHOLDS.directUseMin
        ? "direct"
        : resolveMode(confidence);

    return {
      mode,
      normalizedExpression: matchedMemory.normalizedExpression,
      originalText: message,
      hypothesis,
      hypotheses: [hypothesis],
      matchedMemory,
      contextFingerprint,
      confidence,
      explanation: `Mémoire personnelle trouvée (${matchedMemory.status}, confiance ${confidence}).`,
    };
  }

  const bootstrapMatches = findColloquialPatternMatches(parts.core);
  const hypotheses: LanguageHypothesis[] = bootstrapMatches.map((pattern) => {
    return buildHypothesisFromPattern(pattern, parts, message);
  }).map((hypothesis) => ({
    ...hypothesis,
    confidence: adjustConfidenceForContext({
      confidence: hypothesis.confidence,
      fingerprint: contextFingerprint,
      resolvedIntent: hypothesis.resolvedIntent,
    }),
  }));

  if (hypotheses.length === 0) {
    return {
      mode: "no_match",
      normalizedExpression: parts.core,
      originalText: message,
      hypothesis: null,
      hypotheses: [],
      matchedMemory: null,
      contextFingerprint,
      confidence: 0,
      explanation: "Aucune expression personnelle ni pattern bootstrap correspondant.",
    };
  }

  const primary = [...hypotheses].sort((a, b) => b.confidence - a.confidence)[0];
  const mode = resolveMode(primary.confidence);

  return {
    mode,
    normalizedExpression: primary.normalizedExpression,
    originalText: message,
    hypothesis: primary,
    hypotheses,
    matchedMemory: null,
    contextFingerprint,
    confidence: primary.confidence,
    explanation: `Hypothèse bootstrap (${primary.resolvedMeaning}, confiance ${primary.confidence}).`,
  };
}

export function buildLanguageConfirmationPrompt(hypothesis: LanguageHypothesis): string {
  return `Je pense que tu veux dire que tu es ${hypothesis.resolvedMeaning}. Est-ce bien cela ?`;
}

export function buildNeutralUncertaintyPrompt(): string {
  return "Je ne suis pas certain de comprendre cette expression. Peux-tu préciser ce que tu veux dire ?";
}
