/**
 * EPIC 6B — Conversation phrasing (propose, never act alone).
 */

import type { ProactiveSuggestion } from "../types/proactiveTypes";

const FORBIDDEN = [/j'ai fait/i, /c'est fait/i, /j'ai appliqué/i, /j'ai déplacé/i, /j'ai créé/i];

export function buildProactivePhrasingHints(input: {
  readonly displayable: readonly ProactiveSuggestion[];
}): string[] {
  const hints: string[] = [];

  if (input.displayable.length === 0) {
    hints.push("Aucune intervention proactive pour le moment — j'attends le bon moment.");
    return hints.filter((hint) => !FORBIDDEN.some((pattern) => pattern.test(hint)));
  }

  const top = input.displayable[0]!;
  hints.push(`Je pourrais vous suggérer : ${top.title}.`);
  hints.push(`Raison : ${top.reason}`);
  hints.push("Souhaitez-vous que je prépare cette action ? (Aucune exécution sans votre confirmation.)");

  return hints.filter((hint) => !FORBIDDEN.some((pattern) => pattern.test(hint)));
}

export function sanitizeProactivePhrase(phrase: string): string {
  if (FORBIDDEN.some((pattern) => pattern.test(phrase))) {
    return "Souhaitez-vous que je prépare cette suggestion ?";
  }
  return phrase;
}
