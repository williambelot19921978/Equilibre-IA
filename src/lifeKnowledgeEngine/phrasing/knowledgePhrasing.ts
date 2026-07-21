/**
 * EPIC 6E — Knowledge phrasing for Conversation Engine.
 * Only confirmed preferences.
 */

import type { LifeKnowledgeItem } from "../types/lifeKnowledgeTypes";
import { getConfirmedKnowledge } from "../guards/knowledgeGuards";

export function buildKnowledgePhrasingHints(items: readonly LifeKnowledgeItem[]): string[] {
  const confirmed = getConfirmedKnowledge(items);
  const hints: string[] = [];

  const morningPref = confirmed.find((item) =>
    /matin|morning|lever/i.test(`${item.label} ${item.value}`),
  );
  if (morningPref) {
    hints.push(`Comme tu préfères généralement le matin pour ${morningPref.label.toLowerCase()}…`);
  }

  const sportPref = confirmed.find((item) => /sport|courir|marche|workout/i.test(item.value));
  if (sportPref) {
    hints.push(`Comme tu préfères généralement ${sportPref.value.toLowerCase()}…`);
  }

  const sleepPref = confirmed.find((item) => /sommeil|coucher|lever|sleep/i.test(`${item.label} ${item.value}`));
  if (sleepPref && hints.length === 0) {
    hints.push(`En tenant compte de ton rythme (${sleepPref.value})…`);
  }

  return hints.slice(0, 2);
}
