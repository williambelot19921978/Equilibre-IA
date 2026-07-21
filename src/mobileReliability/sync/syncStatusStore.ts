/**
 * EPIC 7B — Sync status store.
 */

import type { SyncSnapshot, SyncStatus } from "../types/mobileTypes";
import { listPendingMutations } from "../offline/offlineMutationQueue";
import { defaultConnectivityEngine } from "../connectivity/connectivityEngine";

const STATUS_PREFIX = "sync-status-";

type StoredSyncMeta = {
  lastSyncedAt: string | null;
  lastError: string | null;
  status: SyncStatus;
};

function metaKey(userId: string): string {
  return `${STATUS_PREFIX}${userId}`;
}

export function getSyncMeta(userId: string): StoredSyncMeta {
  if (typeof localStorage === "undefined") {
    return { lastSyncedAt: null, lastError: null, status: "synced" };
  }
  try {
    const raw = localStorage.getItem(metaKey(userId));
    if (!raw) return { lastSyncedAt: null, lastError: null, status: "synced" };
    return JSON.parse(raw) as StoredSyncMeta;
  } catch {
    return { lastSyncedAt: null, lastError: null, status: "synced" };
  }
}

export function setSyncMeta(userId: string, patch: Partial<StoredSyncMeta>): StoredSyncMeta {
  const next = { ...getSyncMeta(userId), ...patch };
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(metaKey(userId), JSON.stringify(next));
  }
  return next;
}

export function buildSyncSnapshot(userId: string): SyncSnapshot {
  const meta = getSyncMeta(userId);
  const pendingCount = listPendingMutations(userId).length;
  const isOnline = defaultConnectivityEngine.isOnline();

  let status: SyncStatus = meta.status;
  if (!isOnline) {
    status = pendingCount > 0 ? "offline" : "offline";
  } else if (pendingCount > 0) {
    status = meta.status === "syncing" ? "syncing" : "pending";
  } else if (meta.lastError) {
    status = "error";
  } else {
    status = "synced";
  }

  return {
    status,
    pendingCount,
    lastSyncedAt: meta.lastSyncedAt,
    lastError: meta.lastError,
    isOnline,
  };
}
