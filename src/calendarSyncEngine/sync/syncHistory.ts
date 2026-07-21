/**
 * EPIC 5B — Sync history journal (localStorage).
 */

import type { SyncHistoryEntry, SyncLifecycleState, SyncProviderId } from "../types/syncTypes";

const STORAGE_KEY = "calendar-sync-history";

function readHistory(): SyncHistoryEntry[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SyncHistoryEntry[];
  } catch {
    return [];
  }
}

function writeHistory(entries: SyncHistoryEntry[]): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, 50)));
}

export function appendSyncHistory(entry: Omit<SyncHistoryEntry, "id" | "timestamp">): SyncHistoryEntry {
  const record: SyncHistoryEntry = {
    ...entry,
    id: `sync-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
  };
  const history = readHistory();
  history.unshift(record);
  writeHistory(history);
  return record;
}

export function getSyncHistory(): SyncHistoryEntry[] {
  return readHistory();
}

export function clearSyncHistory(): void {
  writeHistory([]);
}

export function mapResultToLifecycleState(success: boolean, conflictCount: number): SyncLifecycleState {
  if (conflictCount > 0) return "conflict";
  return success ? "synced" : "failed";
}

export type SyncHistoryDirection = SyncHistoryEntry["direction"];

export function recordSyncHistory(input: {
  direction: SyncHistoryDirection;
  provider: SyncProviderId;
  success: boolean;
  itemCount: number;
  summary: string;
  conflictCount?: number;
}): SyncHistoryEntry {
  return appendSyncHistory({
    direction: input.direction,
    provider: input.provider,
    status: mapResultToLifecycleState(input.success, input.conflictCount ?? 0),
    summary: input.summary,
    itemCount: input.itemCount,
  });
}
