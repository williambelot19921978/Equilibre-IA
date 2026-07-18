import { LANGUAGE_ARCHIVE_AFTER_DAYS, LANGUAGE_MAX_CONTEXTS, LANGUAGE_MAX_ORIGINAL_EXAMPLES } from "./constants";
import {
  computeConfidenceFromCounts,
  resolveStatusFromConfidence,
  updateExpressionConfidence,
} from "./updateExpressionConfidence";
import type {
  LanguageContextFingerprint,
  LanguageExpressionMemory,
  PersonalLanguageLearningInput,
} from "./types";

function uniqueExamples(existing: string[], incoming: string): string[] {
  const next = [incoming, ...existing.filter((item) => item !== incoming)];
  return next.slice(0, LANGUAGE_MAX_ORIGINAL_EXAMPLES);
}

function mergeContexts(
  existing: LanguageContextFingerprint[],
  incoming: LanguageContextFingerprint,
): LanguageContextFingerprint[] {
  const serialized = JSON.stringify(incoming);
  const filtered = existing.filter((ctx) => JSON.stringify(ctx) !== serialized);
  return [incoming, ...filtered].slice(0, LANGUAGE_MAX_CONTEXTS);
}

function nowIso(): string {
  return new Date().toISOString();
}

export function learnPersonalExpression(
  input: PersonalLanguageLearningInput,
  referenceDate: string,
): LanguageExpressionMemory {
  const timestamp = nowIso();
  const existing = input.existing;

  if (!existing) {
    const confidence = computeConfidenceFromCounts({
      confirmationCount: 0,
      rejectionCount: 0,
      usageCount: 0,
    });

    return {
      id: `temp-${input.normalizedExpression}`,
      userId: input.userId,
      normalizedExpression: input.normalizedExpression,
      originalExamples: [input.originalText],
      resolvedIntent: input.resolvedIntent,
      resolvedMeaning: input.resolvedMeaning,
      confidence,
      confirmationCount: 0,
      rejectionCount: 0,
      usageCount: 0,
      contexts: [input.context],
      status: "candidate",
      createdAt: timestamp,
      lastUsedAt: timestamp,
      lastConfirmedAt: null,
      updatedAt: timestamp,
    };
  }

  return {
    ...existing,
    originalExamples: uniqueExamples(existing.originalExamples, input.originalText),
    usageCount: existing.usageCount + 1,
    contexts: mergeContexts(existing.contexts, input.context),
    lastUsedAt: timestamp,
    updatedAt: timestamp,
    confidence: updateExpressionConfidence({
      confirmationCount: existing.confirmationCount,
      rejectionCount: existing.rejectionCount,
      usageCount: existing.usageCount + 1,
      lastUsedAt: timestamp,
      referenceDate,
    }),
  };
}

export function confirmPersonalExpression(
  memory: LanguageExpressionMemory,
  _referenceDate: string,
): LanguageExpressionMemory {
  const confirmationCount = memory.confirmationCount + 1;
  const confidence = computeConfidenceFromCounts({
    confirmationCount,
    rejectionCount: memory.rejectionCount,
    usageCount: memory.usageCount,
  });
  const timestamp = nowIso();

  return {
    ...memory,
    confirmationCount,
    confidence,
    status: resolveStatusFromConfidence(confidence, confirmationCount, memory.rejectionCount),
    lastConfirmedAt: timestamp,
    updatedAt: timestamp,
  };
}

export function rejectPersonalExpression(
  memory: LanguageExpressionMemory,
  _referenceDate: string,
): LanguageExpressionMemory {
  const rejectionCount = memory.rejectionCount + 1;
  const confidence = computeConfidenceFromCounts({
    confirmationCount: memory.confirmationCount,
    rejectionCount,
    usageCount: memory.usageCount,
  });
  const timestamp = nowIso();

  return {
    ...memory,
    rejectionCount,
    confidence,
    status:
      memory.confirmationCount === 0 && rejectionCount >= 1
        ? "rejected"
        : resolveStatusFromConfidence(confidence, memory.confirmationCount, rejectionCount),
    updatedAt: timestamp,
  };
}

export function archiveStaleExpression(
  memory: LanguageExpressionMemory,
  referenceDate: string,
): LanguageExpressionMemory | null {
  if (memory.status === "archived") return memory;

  const lastUsed = memory.lastUsedAt ?? memory.updatedAt;
  const daysSince = Math.floor(
    (Date.parse(`${referenceDate}T12:00:00.000Z`) - Date.parse(lastUsed)) /
      (24 * 60 * 60 * 1000),
  );

  if (daysSince < LANGUAGE_ARCHIVE_AFTER_DAYS) return null;
  if (memory.confidence > 0.4) return null;

  return {
    ...memory,
    status: "archived",
    updatedAt: nowIso(),
  };
}

export function reactivateExpressionIfNeeded(
  memory: LanguageExpressionMemory,
): LanguageExpressionMemory {
  if (memory.status !== "archived" && memory.status !== "rejected") {
    return memory;
  }

  return {
    ...memory,
    status: memory.confirmationCount > 0 ? "learning" : "candidate",
    updatedAt: nowIso(),
  };
}
