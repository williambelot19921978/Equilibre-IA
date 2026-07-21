/**
 * EPIC 6B — Proactive Learning Engine.
 * Réduit progressivement la fréquence si l'utilisateur ignore un type — observation only.
 */

import type { SuggestionKind } from "../types/proactiveTypes";

const STORAGE_PREFIX = "proactive-dismiss-by-kind-";

type DismissRecord = Record<string, { readonly shown: number; readonly dismissed: number }>;

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

function read(userId: string): DismissRecord {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return {};
    return JSON.parse(raw) as DismissRecord;
  } catch {
    return {};
  }
}

function write(userId: string, record: DismissRecord): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(storageKey(userId), JSON.stringify(record));
}

export function recordSuggestionShown(userId: string, kind: SuggestionKind): void {
  const record = read(userId);
  const entry = record[kind] ?? { shown: 0, dismissed: 0 };
  record[kind] = { ...entry, shown: entry.shown + 1 };
  write(userId, record);
}

export function recordSuggestionDismissed(userId: string, kind: SuggestionKind): void {
  const record = read(userId);
  const entry = record[kind] ?? { shown: 0, dismissed: 0 };
  record[kind] = { ...entry, dismissed: entry.dismissed + 1, shown: entry.shown + 1 };
  write(userId, record);
}

export function kindDismissRate(userId: string, kind: SuggestionKind): number {
  const entry = read(userId)[kind];
  if (!entry || entry.shown === 0) return 0;
  return entry.dismissed / entry.shown;
}

export function frequencyMultiplier(userId: string, kind: SuggestionKind): number {
  const rate = kindDismissRate(userId, kind);
  if (rate > 0.8) return 0.3;
  if (rate > 0.6) return 0.5;
  if (rate > 0.4) return 0.7;
  return 1;
}

export function createDismissObservation(kind: SuggestionKind, rate: number): string {
  return `Observation : type « ${kind} » ignoré ${Math.round(rate * 100)}% du temps — fréquence réduite progressivement.`;
}

export function clearDismissRecords(userId: string): void {
  write(userId, {});
}
