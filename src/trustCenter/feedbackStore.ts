/**
 * EPIC 8A — Beta feedback store (localStorage, no backend).
 */

import type { FeedbackEntry, FeedbackKind } from "./types";

const PREFIX = "aura-feedback-";

function key(userId: string): string {
  return `${PREFIX}${userId}`;
}

function read(userId: string): FeedbackEntry[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(key(userId));
    if (!raw) return [];
    return JSON.parse(raw) as FeedbackEntry[];
  } catch {
    return [];
  }
}

function write(userId: string, entries: FeedbackEntry[]): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(key(userId), JSON.stringify(entries.slice(0, 100)));
}

export function listFeedback(userId: string): FeedbackEntry[] {
  return read(userId);
}

export function submitFeedback(
  userId: string,
  input: {
    kind: FeedbackKind;
    message: string;
    rating?: number;
    context?: string;
  },
): FeedbackEntry {
  const entry: FeedbackEntry = {
    id: `fb-${crypto.randomUUID()}`,
    kind: input.kind,
    message: input.message.trim(),
    rating: input.rating,
    context: input.context,
    createdAt: new Date().toISOString(),
  };
  write(userId, [entry, ...read(userId)]);
  return entry;
}

export function clearFeedback(userId: string): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(key(userId));
}

export const FEEDBACK_KIND_LABELS: Record<FeedbackKind, string> = {
  opinion: "Donner mon avis",
  problem: "Signaler un problème",
  idea: "Proposer une idée",
  rating: "Noter une recommandation",
};
