/**
 * EPIC 6B — Suggestion store (localStorage).
 */

import type { ProactiveSuggestion, SuggestionLifecycleState } from "../types/proactiveTypes";

const STORAGE_PREFIX = "proactive-suggestions-";

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

function read(userId: string): ProactiveSuggestion[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    return JSON.parse(raw) as ProactiveSuggestion[];
  } catch {
    return [];
  }
}

function write(userId: string, suggestions: ProactiveSuggestion[]): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(storageKey(userId), JSON.stringify(suggestions.slice(0, 100)));
}

export function getAllSuggestions(userId: string): ProactiveSuggestion[] {
  return read(userId);
}

export function upsertSuggestion(userId: string, suggestion: ProactiveSuggestion): void {
  const list = read(userId);
  const index = list.findIndex((item) => item.id === suggestion.id);
  if (index >= 0) {
    list[index] = suggestion;
  } else {
    list.unshift(suggestion);
  }
  write(userId, list);
}

export function updateSuggestionStatus(
  userId: string,
  suggestionId: string,
  status: SuggestionLifecycleState,
): ProactiveSuggestion | null {
  const list = read(userId);
  const index = list.findIndex((item) => item.id === suggestionId);
  if (index < 0) return null;

  const updated: ProactiveSuggestion = {
    ...list[index]!,
    status,
    updatedAt: new Date().toISOString(),
  };
  list[index] = updated;
  write(userId, list);
  return updated;
}

export function acceptSuggestion(userId: string, suggestionId: string): ProactiveSuggestion | null {
  return updateSuggestionStatus(userId, suggestionId, "accepted");
}

export function dismissSuggestion(userId: string, suggestionId: string): ProactiveSuggestion | null {
  return updateSuggestionStatus(userId, suggestionId, "dismissed");
}

export function clearSuggestions(userId: string): void {
  write(userId, []);
}
