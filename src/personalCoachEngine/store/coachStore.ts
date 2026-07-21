/**
 * EPIC 6D — Coach store (localStorage).
 */

import type { CoachingSessionKind, LifePriority } from "../types/personalCoachTypes";
import { DEFAULT_LIFE_PRIORITY } from "../types/personalCoachTypes";

const PRIORITY_PREFIX = "personal-coach-priority-";
const DISMISS_PREFIX = "personal-coach-dismiss-";
const SUCCESS_PREFIX = "personal-coach-success-";
const SESSION_PREFIX = "personal-coach-session-";

function priorityKey(userId: string): string {
  return `${PRIORITY_PREFIX}${userId}`;
}

function dismissKey(userId: string): string {
  return `${DISMISS_PREFIX}${userId}`;
}

function successStorageKey(userId: string): string {
  return `${SUCCESS_PREFIX}${userId}`;
}

function sessionKey(userId: string): string {
  return `${SESSION_PREFIX}${userId}`;
}

export function getLifePriority(userId: string): LifePriority {
  if (typeof localStorage === "undefined") return DEFAULT_LIFE_PRIORITY;
  try {
    const raw = localStorage.getItem(priorityKey(userId));
    if (!raw) return DEFAULT_LIFE_PRIORITY;
    const parsed = JSON.parse(raw) as { priority?: LifePriority };
    return parsed.priority ?? DEFAULT_LIFE_PRIORITY;
  } catch {
    return DEFAULT_LIFE_PRIORITY;
  }
}

export function setLifePriority(userId: string, priority: LifePriority): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(priorityKey(userId), JSON.stringify({ priority }));
}

export function recordDismissedAdvice(userId: string, adviceId: string): void {
  if (typeof localStorage === "undefined") return;
  const dismissed = new Set(getDismissedAdviceIds(userId));
  dismissed.add(adviceId);
  localStorage.setItem(dismissKey(userId), JSON.stringify([...dismissed].slice(0, 200)));
}

export function getDismissedAdviceIds(userId: string): string[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(dismissKey(userId));
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export function recordShownSuccess(userId: string, successKey: string): void {
  if (typeof localStorage === "undefined") return;
  const shown = new Set(getShownSuccessKeys(userId));
  shown.add(successKey);
  localStorage.setItem(successStorageKey(userId), JSON.stringify([...shown].slice(0, 100)));
}

export function getShownSuccessKeys(userId: string): string[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(successStorageKey(userId));
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export function recordSessionOffered(userId: string, kind: CoachingSessionKind, date: string): void {
  if (typeof localStorage === "undefined") return;
  const history = readSessionHistory(userId);
  history.unshift({ kind, date, offeredAt: new Date().toISOString() });
  localStorage.setItem(sessionKey(userId), JSON.stringify(history.slice(0, 50)));
}

function readSessionHistory(userId: string): Array<{
  kind: CoachingSessionKind;
  date: string;
  offeredAt: string;
}> {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(sessionKey(userId));
    if (!raw) return [];
    return JSON.parse(raw) as Array<{ kind: CoachingSessionKind; date: string; offeredAt: string }>;
  } catch {
    return [];
  }
}

export function wasSessionOfferedToday(userId: string, kind: CoachingSessionKind, date: string): boolean {
  return readSessionHistory(userId).some((entry) => entry.kind === kind && entry.date === date);
}

export function wasAnySessionOfferedToday(userId: string, date: string): boolean {
  return readSessionHistory(userId).some((entry) => entry.date === date);
}

export function clearCoachStore(userId: string): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(priorityKey(userId));
  localStorage.removeItem(dismissKey(userId));
  localStorage.removeItem(successStorageKey(userId));
  localStorage.removeItem(sessionKey(userId));
}
