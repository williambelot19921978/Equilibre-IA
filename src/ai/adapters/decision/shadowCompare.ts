/**
 * Shadow comparison — legacy vs contract DecisionEngine (Sprint A3).
 * Logs divergences without breaking production (legacy remains authority when flag off).
 */

import type { ShadowComparisonResult, ValidationResultLike } from "./types";

const shadowLog: ShadowComparisonResult[] = [];

export function getShadowComparisonLog(): readonly ShadowComparisonResult[] {
  return shadowLog;
}

export function clearShadowComparisonLog(): void {
  shadowLog.length = 0;
}

function explainDivergence(
  legacy: ValidationResultLike,
  candidate: ValidationResultLike,
): string {
  if (legacy.valid === candidate.valid && legacy.reason === candidate.reason) {
    return "Identical";
  }

  if (legacy.valid !== candidate.valid) {
    return `Approval mismatch — legacy=${String(legacy.valid)}, candidate=${String(candidate.valid)}`;
  }

  return `Reason mismatch — legacy="${legacy.reason}", candidate="${candidate.reason}"`;
}

export function compareValidationResults(
  operation: string,
  legacy: ValidationResultLike,
  candidate: ValidationResultLike,
): ShadowComparisonResult {
  const matched =
    legacy.valid === candidate.valid && legacy.reason === candidate.reason;
  const explanation = explainDivergence(legacy, candidate);

  const entry: ShadowComparisonResult = {
    operation,
    matched,
    legacy,
    candidate,
    explanation,
  };

  if (!matched) {
    shadowLog.push(entry);
    if (import.meta.env.DEV) {
      console.warn("[DecisionEngine shadow]", operation, explanation, {
        legacy,
        candidate,
      });
    }
  }

  return entry;
}
