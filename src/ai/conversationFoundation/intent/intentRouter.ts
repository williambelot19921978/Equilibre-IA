/**
 * EPIC 4A — Extensible intent router (registry pattern, no if/else chains).
 */

import type { ConversationIntent, IntentClassification } from "../types/intents";

export type IntentRule = {
  readonly intent: ConversationIntent;
  readonly keywords: readonly string[];
  readonly weight?: number;
};

const INTENT_RULES: readonly IntentRule[] = [
  {
    intent: "planning",
    keywords: ["planning", "planifier", "agenda", "journée", "journee", "bloc", "horaire"],
    weight: 10,
  },
  {
    intent: "goals",
    keywords: ["objectif", "objectifs", "goal", "progression", "étape", "etape"],
    weight: 10,
  },
  {
    intent: "organization",
    keywords: ["organiser", "organisation", "prioriser", "priorité", "priorite", "ordre"],
    weight: 9,
  },
  {
    intent: "fatigue",
    keywords: ["fatigue", "fatigué", "fatiguee", "épuisé", "epuise", "crevé", "creve"],
    weight: 11,
  },
  {
    intent: "motivation",
    keywords: ["motivation", "motivé", "motiver", "encouragement", "moral"],
    weight: 9,
  },
  {
    intent: "family",
    keywords: ["famille", "enfant", "enfants", "foyer", "conjoint", "partenaire"],
    weight: 10,
  },
  {
    intent: "household",
    keywords: ["foyer", "membre", "collaboration", "charge", "disponibilité"],
    weight: 8,
  },
  {
    intent: "work",
    keywords: ["travail", "boulot", "pro", "professionnel", "bureau", "réunion"],
    weight: 9,
  },
  {
    intent: "studies",
    keywords: ["étude", "etude", "études", "etudes", "révision", "revision", "cours", "exam"],
    weight: 9,
  },
  {
    intent: "finances",
    keywords: ["finance", "finances", "budget", "argent", "dépense", "depense"],
    weight: 7,
  },
  {
    intent: "daily_brief",
    keywords: ["brief", "daily brief", "résumé du jour", "resume du jour", "synthèse"],
    weight: 10,
  },
];

export type IntentRouterRegistry = {
  readonly rules: readonly IntentRule[];
  register(rule: IntentRule): IntentRouterRegistry;
};

export function createIntentRouterRegistry(
  rules: readonly IntentRule[] = INTENT_RULES,
): IntentRouterRegistry {
  let currentRules = [...rules];

  return {
    get rules() {
      return currentRules;
    },
    register(rule: IntentRule) {
      currentRules = [...currentRules, rule];
      return this;
    },
  };
}

export const defaultIntentRouterRegistry = createIntentRouterRegistry();

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

export function classifyIntent(
  message: string,
  registry: IntentRouterRegistry = defaultIntentRouterRegistry,
): IntentClassification {
  const normalized = normalize(message);
  const scores = new Map<ConversationIntent, { score: number; keywords: string[] }>();

  for (const rule of registry.rules) {
    const matched = rule.keywords.filter((keyword) =>
      normalized.includes(normalize(keyword)),
    );
    if (matched.length === 0) continue;

    const increment = (rule.weight ?? 1) * matched.length;
    const existing = scores.get(rule.intent) ?? { score: 0, keywords: [] };
    scores.set(rule.intent, {
      score: existing.score + increment,
      keywords: [...existing.keywords, ...matched],
    });
  }

  if (scores.size === 0) {
    return {
      intent: "free_conversation",
      confidence: 0.55,
      matchedKeywords: [],
      reason: "Aucune intention métier détectée — conversation libre.",
    };
  }

  const [intent, data] = [...scores.entries()].sort((a, b) => b[1].score - a[1].score)[0];

  const confidence = Math.min(0.95, 0.55 + data.score * 0.04);

  return {
    intent,
    confidence,
    matchedKeywords: data.keywords,
    reason: `Mots-clés : ${data.keywords.join(", ")}`,
  };
}
