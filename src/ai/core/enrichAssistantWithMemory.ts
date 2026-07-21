import type { NlpIntent } from "../../types/nlp";
import type { LanguageMemoryContext } from "./buildLanguageMemoryContext";
import {
  formatLanguageMemoryPrefix,
  selectLanguageMemoryHints,
} from "./selectLanguageMemoryHints";

const ENRICHABLE_INTENTS = new Set<NlpIntent>([
  "ask_question",
  "request_suggestion",
]);

export function shouldEnrichWithLanguageMemory(intent: NlpIntent): boolean {
  return ENRICHABLE_INTENTS.has(intent);
}

export function enrichAssistantWithLanguageMemory({
  message,
  intent,
  languageMemory,
  shownInsightIds = [],
  skipProactiveHints = false,
}: {
  message: string;
  intent: NlpIntent;
  languageMemory?: LanguageMemoryContext | null;
  shownInsightIds?: string[];
  skipProactiveHints?: boolean;
}): string {
  if (skipProactiveHints || !shouldEnrichWithLanguageMemory(intent)) {
    return message;
  }

  if (/je n'ai pas reconnu cette demande/i.test(message)) {
    return message;
  }

  const hints = selectLanguageMemoryHints(languageMemory, shownInsightIds);
  const prefix = formatLanguageMemoryPrefix(hints);
  if (!prefix) return message;

  if (message.trim().length === 0) {
    return prefix;
  }

  return `${prefix}\n\n${message}`;
}

export function collectNewInsightIds(
  languageMemory: LanguageMemoryContext | null | undefined,
  shownInsightIds: string[] = [],
): string[] {
  const hints = selectLanguageMemoryHints(languageMemory, shownInsightIds);
  return [...shownInsightIds, ...hints.map((hint) => hint.id)];
}
