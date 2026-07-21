/**
 * EPIC 6B — Action guards (prepare only — never execute).
 */

import type { PreparedActionType, ProactiveSuggestion } from "../types/proactiveTypes";

export function getActionPreparation(
  suggestion: ProactiveSuggestion,
): PreparedActionType | null {
  if (suggestion.status !== "displayed" && suggestion.status !== "scheduled") {
    return null;
  }
  return suggestion.preparedAction ?? null;
}

export function canPrepareAction(suggestion: ProactiveSuggestion): boolean {
  return (
    Boolean(suggestion.preparedAction) &&
    suggestion.status !== "dismissed" &&
    suggestion.status !== "expired" &&
    suggestion.status !== "cancelled"
  );
}

export function suggestionsForActionEngine(
  suggestions: readonly ProactiveSuggestion[],
): ProactiveSuggestion[] {
  return suggestions.filter(
    (suggestion) =>
      suggestion.status === "displayed" &&
      suggestion.preparedAction &&
      suggestion.confidence >= 0.5,
  );
}
