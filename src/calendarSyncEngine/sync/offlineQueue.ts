/**
 * EPIC 5B — Offline sync queue (localStorage).
 */

import type { CalendarItem } from "../../planningCalendarEngine/types/calendarItem";
import type { SyncLifecycleState, SyncProviderId } from "../types/syncTypes";

export type QueuedSyncOperation = {
  readonly id: string;
  readonly provider: SyncProviderId;
  readonly operation: "create" | "update" | "delete" | "push";
  readonly item?: CalendarItem;
  readonly eventId?: string;
  readonly status: SyncLifecycleState;
  readonly attempts: number;
  readonly lastError?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
};

const STORAGE_KEY = "calendar-sync-offline-queue";

function readQueue(): QueuedSyncOperation[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as QueuedSyncOperation[];
  } catch {
    return [];
  }
}

function writeQueue(entries: QueuedSyncOperation[]): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, 100)));
}

export class OfflineSyncQueue {
  enqueue(entry: Omit<QueuedSyncOperation, "attempts" | "createdAt" | "updatedAt" | "status">): QueuedSyncOperation {
    const now = new Date().toISOString();
    const operation: QueuedSyncOperation = {
      ...entry,
      status: "pending",
      attempts: 0,
      createdAt: now,
      updatedAt: now,
    };
    const queue = readQueue();
    queue.unshift(operation);
    writeQueue(queue);
    return operation;
  }

  list(): QueuedSyncOperation[] {
    return readQueue();
  }

  listPending(): QueuedSyncOperation[] {
    return readQueue().filter((entry) => entry.status === "pending" || entry.status === "failed");
  }

  markSyncing(id: string): void {
    this.update(id, { status: "syncing" });
  }

  markSynced(id: string): void {
    this.update(id, { status: "synced" });
  }

  markFailed(id: string, error: string): void {
    const queue = readQueue();
    const entry = queue.find((item) => item.id === id);
    if (!entry) return;
    this.update(id, {
      status: "failed",
      attempts: entry.attempts + 1,
      lastError: error,
    });
  }

  remove(id: string): void {
    writeQueue(readQueue().filter((entry) => entry.id !== id));
  }

  clear(): void {
    writeQueue([]);
  }

  private update(id: string, patch: Partial<QueuedSyncOperation>): void {
    const queue = readQueue().map((entry) =>
      entry.id === id
        ? { ...entry, ...patch, updatedAt: new Date().toISOString() }
        : entry,
    );
    writeQueue(queue);
  }
}

export const defaultOfflineSyncQueue = new OfflineSyncQueue();
