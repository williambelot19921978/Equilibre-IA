import type { NlpIntent } from "../../types/nlp";
import type { LanguageMemoryContext } from "./buildLanguageMemoryContext";
import {
  formatLanguageMemoryPrefix,
  selectLanguageMemoryHints,
} from "./selectLanguageMemoryHints";

const ENRICHABLE_INTENTS = new Set<NlpIntent>([
  "ask_question",
  "request_suggestion",
  "unknown",
  "declare_fatigue",
]);

export function shouldEnrichWithLanguageMemory(intent: NlpIntent): boolean {
  return ENRICHABLE_INTENTS.has(intent);
}

export function enrichAssistantWithLanguageMemory({
  message,
  intent,
  languageMemory,
}: {
  message: string;
  intent: NlpIntent;
  languageMemory?: LanguageMemoryContext | null;
}): string {
  if (!shouldEnrichWithLanguageMemory(intent)) {
    return message;
  }

  const hints = selectLanguageMemoryHints(languageMemory);
  const prefix = formatLanguageMemoryPrefix(hints);
  if (!prefix) return message;

  if (message.trim().length === 0) {
    return prefix;
  }

  return `${prefix}\n\n${message}`;
}
