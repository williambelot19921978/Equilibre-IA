import { addMinutesToIso } from "../../lib/time/daySchedule";
import { LANGUAGE_CONFIRMATION_TTL_MINUTES } from "./constants";
import type { LanguageConfirmationRequest, LanguageHypothesis } from "./types";
import { buildLanguageConfirmationPrompt } from "./resolvePersonalExpression";

export function isLanguageConfirmationExpired(
  expiresAt: string,
  nowIso = new Date().toISOString(),
): boolean {
  return nowIso >= expiresAt;
}

export function createLanguageConfirmationRequest(
  hypothesis: LanguageHypothesis,
): LanguageConfirmationRequest {
  const createdAt = new Date().toISOString();
  return {
    hypothesis,
    prompt: buildLanguageConfirmationPrompt(hypothesis),
    expiresAt: addMinutesToIso(createdAt, LANGUAGE_CONFIRMATION_TTL_MINUTES),
    normalizedExpression: hypothesis.normalizedExpression,
    originalText: hypothesis.originalText,
  };
}

export type LanguageConfirmationResponseKind = "confirm" | "reject" | "correction" | "unclear";

export function classifyLanguageConfirmationResponse(text: string): LanguageConfirmationResponseKind {
  const normalized = text.trim().toLowerCase();

  if (
    /^(oui|ok|d'accord|daccord|exact|exactement|c'est ca|c'est ça|cest ca|cest ça|affirmatif)\.?$/u.test(
      normalized,
    ) ||
    /^oui,?/.test(normalized)
  ) {
    return "confirm";
  }

  if (
    /^(non|pas du tout|pas vraiment|nan|nope)\.?$/u.test(normalized) ||
    /^non,?/.test(normalized)
  ) {
    return "reject";
  }

  if (/je voulais dire|plutot|plutôt|en fait|pas fatigue|sans argent/u.test(normalized)) {
    return "correction";
  }

  return "unclear";
}

export function extractCorrectedMeaning(text: string): string | null {
  const normalized = text.toLowerCase();
  if (/sans argent|fauch|fauché|fauche|fauchée/u.test(normalized)) {
    return "sans argent";
  }
  if (/fatigue|epuise|épuis|creve|crève|ko|sec/u.test(normalized)) {
    return "fatigue";
  }
  return null;
}
