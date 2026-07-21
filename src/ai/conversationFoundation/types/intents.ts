/** EPIC 4A — Extensible conversation intents. */

export const CONVERSATION_INTENTS = [
  "planning",
  "goals",
  "organization",
  "fatigue",
  "motivation",
  "family",
  "work",
  "studies",
  "finances",
  "household",
  "daily_brief",
  "free_conversation",
] as const;

export type ConversationIntent = (typeof CONVERSATION_INTENTS)[number];

export type IntentClassification = {
  readonly intent: ConversationIntent;
  readonly confidence: number;
  readonly matchedKeywords: readonly string[];
  readonly reason: string;
};
