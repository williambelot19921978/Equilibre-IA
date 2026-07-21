/**
 * EPIC 6B — Proactive Timeline.
 */

import type {
  ProactiveSuggestion,
  ProactiveTimelineEntry,
  ProactiveTimelineEntryKind,
  ProactiveDigest,
  LifeTransitionSignal,
} from "../types/proactiveTypes";

const STORAGE_PREFIX = "proactive-timeline-";

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

function read(userId: string): ProactiveTimelineEntry[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    return JSON.parse(raw) as ProactiveTimelineEntry[];
  } catch {
    return [];
  }
}

function write(userId: string, entries: ProactiveTimelineEntry[]): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(storageKey(userId), JSON.stringify(entries.slice(0, 200)));
}

export function appendProactiveTimelineEntry(
  userId: string,
  entry: Omit<ProactiveTimelineEntry, "id" | "timestamp">,
): ProactiveTimelineEntry {
  const record: ProactiveTimelineEntry = {
    ...entry,
    id: `ptl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
  };
  const history = read(userId);
  history.unshift(record);
  write(userId, history);
  return record;
}

export function getProactiveTimeline(userId: string): ProactiveTimelineEntry[] {
  return read(userId);
}

export function recordSuggestionLifecycle(
  userId: string,
  suggestion: ProactiveSuggestion,
  kind: ProactiveTimelineEntryKind,
): ProactiveTimelineEntry {
  const messages: Partial<Record<ProactiveTimelineEntryKind, string>> = {
    suggestion_created: `Suggestion créée : ${suggestion.title}.`,
    suggestion_scheduled: `Suggestion planifiée : ${suggestion.title}.`,
    suggestion_displayed: `Suggestion affichée : ${suggestion.title}.`,
    suggestion_accepted: `Suggestion acceptée : ${suggestion.title}.`,
    suggestion_dismissed: `Suggestion ignorée : ${suggestion.title}.`,
    suggestion_expired: `Suggestion expirée : ${suggestion.title}.`,
    suggestion_cancelled: `Suggestion annulée : ${suggestion.title}.`,
  };

  return appendProactiveTimelineEntry(userId, {
    kind,
    message: messages[kind] ?? suggestion.title,
    relatedId: suggestion.id,
    metadata: { status: suggestion.status, kind: suggestion.kind },
  });
}

export function recordDigestCreated(userId: string, digest: ProactiveDigest): ProactiveTimelineEntry {
  return appendProactiveTimelineEntry(userId, {
    kind: "digest_created",
    message: `Digest créé : ${digest.title}.`,
    relatedId: digest.id,
    metadata: { suggestionCount: digest.suggestionIds.length },
  });
}

export function recordLifeTransition(
  userId: string,
  signal: LifeTransitionSignal,
): ProactiveTimelineEntry {
  return appendProactiveTimelineEntry(userId, {
    kind: "life_transition_detected",
    message: signal.message,
    relatedId: signal.id,
    metadata: { kind: signal.kind, confidence: signal.confidence },
  });
}

export function clearProactiveTimeline(userId: string): void {
  write(userId, []);
}

export type { ProactiveTimelineEntryKind };
