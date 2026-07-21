/**
 * EPIC 6A — Learning Timeline (traçabilité complète).
 */

import type {
  DetectedHabit,
  LearningTimelineEntry,
  LearningTimelineEntryKind,
  PreferenceProposal,
} from "../types/adaptiveTypes";

const STORAGE_PREFIX = "adaptive-timeline-";

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

function read(userId: string): LearningTimelineEntry[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    return JSON.parse(raw) as LearningTimelineEntry[];
  } catch {
    return [];
  }
}

function write(userId: string, entries: LearningTimelineEntry[]): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(storageKey(userId), JSON.stringify(entries.slice(0, 200)));
}

export function appendTimelineEntry(
  userId: string,
  entry: Omit<LearningTimelineEntry, "id" | "timestamp">,
): LearningTimelineEntry {
  const record: LearningTimelineEntry = {
    ...entry,
    id: `tl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
  };
  const history = read(userId);
  history.unshift(record);
  write(userId, history);
  return record;
}

export function getLearningTimeline(userId: string): LearningTimelineEntry[] {
  return read(userId);
}

export function recordHabitDetected(userId: string, habit: DetectedHabit): LearningTimelineEntry {
  return appendTimelineEntry(userId, {
    kind: "habit_detected",
    message: `Habitude détectée : ${habit.label} (score ${habit.score}).`,
    relatedId: habit.id,
    metadata: { kind: habit.kind, score: habit.score },
  });
}

export function recordPreferenceProposed(
  userId: string,
  proposal: PreferenceProposal,
): LearningTimelineEntry {
  return appendTimelineEntry(userId, {
    kind: "preference_proposed",
    message: `Préférence proposée : ${proposal.label} (${Math.round(proposal.confidence * 100)}%).`,
    relatedId: proposal.id,
    metadata: { status: proposal.status, confidence: proposal.confidence },
  });
}

export function recordPreferenceValidated(
  userId: string,
  proposal: PreferenceProposal,
  accepted: boolean,
): LearningTimelineEntry {
  return appendTimelineEntry(userId, {
    kind: accepted ? "preference_accepted" : "preference_rejected",
    message: accepted
      ? `Préférence validée : ${proposal.label}.`
      : `Préférence refusée : ${proposal.label}.`,
    relatedId: proposal.id,
    metadata: { status: proposal.status },
  });
}

export function syncTimelineFromAnalysis(input: {
  userId: string;
  habits: readonly DetectedHabit[];
  proposals: readonly PreferenceProposal[];
}): LearningTimelineEntry[] {
  const existing = read(input.userId);
  const existingRelated = new Set(existing.map((entry) => `${entry.kind}:${entry.relatedId}`));

  for (const habit of input.habits) {
    const key = `habit_detected:${habit.id}`;
    if (!existingRelated.has(key)) {
      recordHabitDetected(input.userId, habit);
    }
  }

  for (const proposal of input.proposals.filter((prop) => prop.status === "pending")) {
    const key = `preference_proposed:${proposal.id}`;
    if (!existingRelated.has(key)) {
      recordPreferenceProposed(input.userId, proposal);
    }
  }

  return getLearningTimeline(input.userId);
}

export function clearLearningTimeline(userId: string): void {
  write(userId, []);
}

export type { LearningTimelineEntryKind };
