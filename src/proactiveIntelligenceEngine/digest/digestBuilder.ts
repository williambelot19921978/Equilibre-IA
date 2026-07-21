/**
 * EPIC 6B — Digest Builder.
 */

import type { ProactiveDigest, ProactiveSuggestion } from "../types/proactiveTypes";

export function buildDigest(input: {
  readonly suggestions: readonly ProactiveSuggestion[];
  readonly scheduledFor?: string;
}): ProactiveDigest | null {
  const eligible = input.suggestions.filter(
    (suggestion) =>
      suggestion.status === "scheduled" || suggestion.status === "generated",
  );

  if (eligible.length < 2) return null;

  const ids = eligible.slice(0, 5).map((suggestion) => suggestion.id);
  const count = ids.length;

  return {
    id: `digest-${Date.now()}`,
    title: `${count} recommandation${count > 1 ? "s" : ""} pour demain`,
    summary: eligible
      .slice(0, 3)
      .map((suggestion) => suggestion.title)
      .join(" · "),
    suggestionIds: ids,
    scheduledFor: input.scheduledFor,
    createdAt: new Date().toISOString(),
  };
}

export class DigestBuilder {
  build(input: Parameters<typeof buildDigest>[0]): ProactiveDigest | null {
    return buildDigest(input);
  }
}

export const defaultDigestBuilder = new DigestBuilder();
