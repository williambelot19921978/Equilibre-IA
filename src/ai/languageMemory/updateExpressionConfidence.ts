import { LANGUAGE_CONFIDENCE_FORMULA } from "./constants";

export function clampConfidence(value: number): number {
  return Math.max(
    LANGUAGE_CONFIDENCE_FORMULA.minConfidence,
    Math.min(LANGUAGE_CONFIDENCE_FORMULA.maxConfidence, Math.round(value * 1000) / 1000),
  );
}

export function computeConfidenceFromCounts({
  confirmationCount,
  rejectionCount,
  usageCount,
  daysSinceLastUsed = 0,
}: {
  confirmationCount: number;
  rejectionCount: number;
  usageCount: number;
  daysSinceLastUsed?: number;
}): number {
  const cappedConfirmations = Math.min(confirmationCount, 5);
  let confidence =
    LANGUAGE_CONFIDENCE_FORMULA.base +
    cappedConfirmations * LANGUAGE_CONFIDENCE_FORMULA.perConfirmation;

  confidence += Math.min(
    usageCount * LANGUAGE_CONFIDENCE_FORMULA.perUsageBonus,
    LANGUAGE_CONFIDENCE_FORMULA.maxUsageBonus,
  );

  confidence -= rejectionCount * LANGUAGE_CONFIDENCE_FORMULA.perRejection;

  const decaySteps = Math.floor(daysSinceLastUsed / 30);
  confidence -= decaySteps * LANGUAGE_CONFIDENCE_FORMULA.decayPer30Days;

  return clampConfidence(confidence);
}

export function resolveStatusFromConfidence(
  confidence: number,
  confirmationCount: number,
  rejectionCount: number,
): import("./types").LanguageExpressionStatus {
  if (rejectionCount > 0 && confirmationCount === 0) {
    return "rejected";
  }
  if (confidence >= 0.85 && confirmationCount >= 2) {
    return "confirmed";
  }
  if (confirmationCount >= 1) {
    return "learning";
  }
  return "candidate";
}

export function updateExpressionConfidence(memory: {
  confirmationCount: number;
  rejectionCount: number;
  usageCount: number;
  lastUsedAt: string | null;
  referenceDate: string;
}): number {
  const daysSinceLastUsed = memory.lastUsedAt
    ? Math.max(
        0,
        Math.floor(
          (Date.parse(`${memory.referenceDate}T12:00:00.000Z`) -
            Date.parse(memory.lastUsedAt)) /
            (24 * 60 * 60 * 1000),
        ),
      )
    : 0;

  return computeConfidenceFromCounts({
    confirmationCount: memory.confirmationCount,
    rejectionCount: memory.rejectionCount,
    usageCount: memory.usageCount,
    daysSinceLastUsed,
  });
}

export function decayExpressionConfidence(
  confidence: number,
  daysSinceLastUsed: number,
): number {
  const decaySteps = Math.floor(daysSinceLastUsed / 30);
  return clampConfidence(
    confidence - decaySteps * LANGUAGE_CONFIDENCE_FORMULA.decayPer30Days,
  );
}
