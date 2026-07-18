/** Seuils de résolution */
export const LANGUAGE_CONFIDENCE_THRESHOLDS = {
  directUseMin: 0.85,
  confirmationMin: 0.6,
  neutralMax: 0.6,
  archiveBelow: 0.4,
  reactivationMin: 0.35,
} as const;

/** Formule de confiance — documentée dans Docs/AI_CORE_LANGUAGE_MEMORY_V1.md */
export const LANGUAGE_CONFIDENCE_FORMULA = {
  base: 0.28,
  perConfirmation: 0.14,
  maxFromConfirmations: 0.88,
  perRejection: 0.18,
  perUsageBonus: 0.008,
  maxUsageBonus: 0.06,
  decayPer30Days: 0.04,
  contextMismatchPenalty: 0.12,
  minConfidence: 0,
  maxConfidence: 0.9,
} as const;

export const LANGUAGE_CONFIRMATION_TTL_MINUTES = 30;

export const LANGUAGE_ARCHIVE_AFTER_DAYS = 90;

export const LANGUAGE_MAX_ORIGINAL_EXAMPLES = 5;

export const LANGUAGE_MAX_CONTEXTS = 8;
