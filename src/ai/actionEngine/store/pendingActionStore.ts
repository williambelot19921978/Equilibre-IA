/** EPIC 4C — Pending action store (local, per user). */

import type { SecureAction } from "../types/secureAction";

const STORAGE_PREFIX = "action-engine-pending:";

function readStore(userId: string): Record<string, SecureAction> {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, SecureAction>;
  } catch {
    return {};
  }
}

function writeStore(userId: string, store: Record<string, SecureAction>): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(store));
}

export function savePendingAction(userId: string, action: SecureAction): void {
  const store = readStore(userId);
  store[action.id] = action;
  writeStore(userId, store);
}

export function getPendingAction(
  userId: string,
  actionId: string,
): SecureAction | null {
  return readStore(userId)[actionId] ?? null;
}

export function listPendingActions(userId: string): readonly SecureAction[] {
  return Object.values(readStore(userId)).filter(
    (action) =>
      action.status === "pending_confirmation" || action.status === "confirmed",
  );
}

export function updatePendingAction(
  userId: string,
  action: SecureAction,
): void {
  savePendingAction(userId, action);
}

export function removePendingAction(userId: string, actionId: string): void {
  const store = readStore(userId);
  delete store[actionId];
  writeStore(userId, store);
}

export function clearPendingActions(userId: string): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(`${STORAGE_PREFIX}${userId}`);
}
