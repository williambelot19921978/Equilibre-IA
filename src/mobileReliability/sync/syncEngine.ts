/**
 * EPIC 7B — Sync orchestrator (drains offline queue when online).
 */

import { defaultConnectivityEngine } from "../connectivity/connectivityEngine";
import {
  listPendingMutations,
  removeOfflineMutation,
  updateOfflineMutation,
} from "../offline/offlineMutationQueue";
import { defaultErrorRecoveryEngine } from "../recovery/errorRecoveryEngine";
import { buildSyncSnapshot, setSyncMeta } from "./syncStatusStore";
import type { OfflineMutation, SyncSnapshot } from "../types/mobileTypes";

export type SyncMutationHandler = (mutation: OfflineMutation) => Promise<void>;

const handlers = new Map<string, SyncMutationHandler>();

export function registerSyncHandler(
  kind: OfflineMutation["kind"],
  handler: SyncMutationHandler,
): void {
  handlers.set(kind, handler);
}

export class SyncEngine {
  private syncing = false;

  getSnapshot(userId: string): SyncSnapshot {
    return buildSyncSnapshot(userId);
  }

  async syncNow(userId: string): Promise<SyncSnapshot> {
    if (this.syncing || !defaultConnectivityEngine.isOnline()) {
      return buildSyncSnapshot(userId);
    }

    this.syncing = true;
    setSyncMeta(userId, { status: "syncing", lastError: null });

    try {
      const pending = listPendingMutations(userId);
      for (const mutation of pending) {
        const handler = handlers.get(mutation.kind);
        if (!handler) {
          removeOfflineMutation(userId, mutation.id);
          continue;
        }

        updateOfflineMutation(userId, mutation.id, { status: "syncing" });

        try {
          await defaultErrorRecoveryEngine.run(() => handler(mutation));
          updateOfflineMutation(userId, mutation.id, { status: "synced" });
          removeOfflineMutation(userId, mutation.id);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Sync failed";
          updateOfflineMutation(userId, mutation.id, {
            status: "failed",
            attempts: mutation.attempts + 1,
            lastError: message,
          });
          setSyncMeta(userId, { status: "error", lastError: message });
          defaultConnectivityEngine.markDegraded();
          break;
        }
      }

      if (listPendingMutations(userId).length === 0) {
        setSyncMeta(userId, {
          status: "synced",
          lastSyncedAt: new Date().toISOString(),
          lastError: null,
        });
        defaultConnectivityEngine.markHealthy();
      }
    } finally {
      this.syncing = false;
    }

    return buildSyncSnapshot(userId);
  }
}

export const defaultSyncEngine = new SyncEngine();

/** Auto-sync when connectivity returns. */
export function startAutoSync(userId: string): () => void {
  return defaultConnectivityEngine.subscribe((state) => {
    if (state === "online") {
      void defaultSyncEngine.syncNow(userId);
    }
  });
}
