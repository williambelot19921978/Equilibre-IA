/**
 * EPIC 6A — Conversation phrasing (never "J'ai changé...").
 */

import type { PreferenceProposal } from "../types/adaptiveTypes";

const FORBIDDEN_PHRASES = [/j'ai changé/i, /j'ai modifié/i, /c'est fait/i, /j'ai appliqué/i];

export function buildAdaptivePhrasingHints(input: {
  pendingProposals: readonly PreferenceProposal[];
  validatedCount: number;
}): string[] {
  const hints: string[] = [];

  if (input.pendingProposals.length > 0) {
    const top = input.pendingProposals[0]!;
    hints.push(`J'ai remarqué une habitude : ${top.label}.`);
    hints.push(`Je pense avoir identifié une préférence (${Math.round(top.confidence * 100)}% de confiance).`);
    hints.push(`Souhaites-tu que je retienne cette préférence ?`);
  }

  if (input.validatedCount > 0) {
    hints.push(`${input.validatedCount} préférence(s) validée(s) — utilisées pour les recommandations.`);
  }

  return hints.filter((hint) => !FORBIDDEN_PHRASES.some((pattern) => pattern.test(hint)));
}

export function sanitizeAdaptivePhrase(phrase: string): string {
  if (FORBIDDEN_PHRASES.some((pattern) => pattern.test(phrase))) {
    return "Souhaites-tu que je retienne cette préférence ?";
  }
  return phrase;
}
