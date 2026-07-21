/**
 * EPIC 5B — Internal sync events (SyncStarted, SyncCompleted, ConflictDetected).
 */

import type { ConflictResolution } from "../types/syncTypes";

export type SyncEventType = "SyncStarted" | "SyncCompleted" | "ConflictDetected";

export type SyncStartedPayload = {
  readonly provider: string;
  readonly direction: "pull" | "push";
};

export type SyncCompletedPayload = {
  readonly provider: string;
  readonly direction: "pull" | "push";
  readonly success: boolean;
  readonly itemCount: number;
  readonly message: string;
};

export type ConflictDetectedPayload = {
  readonly resolutions: readonly ConflictResolution[];
};

export type SyncEvent =
  | { readonly type: "SyncStarted"; readonly payload: SyncStartedPayload; readonly at: string }
  | { readonly type: "SyncCompleted"; readonly payload: SyncCompletedPayload; readonly at: string }
  | { readonly type: "ConflictDetected"; readonly payload: ConflictDetectedPayload; readonly at: string };

export type SyncEventListener = (event: SyncEvent) => void;

export class SyncEventBus {
  private readonly listeners = new Set<SyncEventListener>();
  private readonly history: SyncEvent[] = [];
  private readonly maxHistory = 50;

  subscribe(listener: SyncEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(event: SyncEvent): void {
    this.history.unshift(event);
    if (this.history.length > this.maxHistory) {
      this.history.length = this.maxHistory;
    }
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  getHistory(): readonly SyncEvent[] {
    return this.history;
  }

  clear(): void {
    this.history.length = 0;
  }
}

export const defaultSyncEventBus = new SyncEventBus();
