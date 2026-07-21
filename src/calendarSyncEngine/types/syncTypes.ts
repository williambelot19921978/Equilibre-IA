/**
 * EPIC 5B — Synchronization types.
 */

import type { CalendarItem } from "../../planningCalendarEngine/types/calendarItem";

/** Extended sync lifecycle states (EPIC 5B). */
export type SyncLifecycleState =
  | "pending"
  | "syncing"
  | "synced"
  | "conflict"
  | "failed"
  | "external_deleted"
  | "local_deleted";

export type SyncProviderId = "google" | "outlook" | "apple" | "internal";

export type SyncContext = {
  readonly userId: string;
  readonly householdId: string;
  readonly rangeStart: string;
  readonly rangeEnd: string;
};

export type SyncChangeKind =
  | "created"
  | "updated"
  | "deleted"
  | "moved"
  | "title_changed"
  | "time_changed"
  | "participants_changed";

export type SyncChange = {
  readonly id: string;
  readonly provider: SyncProviderId;
  readonly kind: SyncChangeKind;
  readonly itemId: string;
  readonly externalId?: string;
  readonly before?: Partial<CalendarItem>;
  readonly after?: Partial<CalendarItem>;
  readonly detectedAt: string;
};

export type SyncConflictKind =
  | "both_moved"
  | "external_deleted"
  | "local_deleted"
  | "time_mismatch"
  | "title_mismatch"
  | "participants_mismatch";

export type ConflictResolutionPreview = {
  readonly before: readonly string[];
  readonly after: readonly string[];
  readonly source: SyncProviderId;
  readonly destination: SyncProviderId;
  readonly differences: readonly string[];
  readonly impact: string;
};

/** Produced for user decision — never auto-applied. */
export type ConflictResolution = {
  readonly id: string;
  readonly conflictKind: SyncConflictKind;
  readonly itemIds: readonly string[];
  readonly message: string;
  readonly preview: ConflictResolutionPreview;
  readonly options: readonly ("keep_local" | "keep_external" | "merge_manual" | "skip")[];
  readonly resolved: boolean;
};

export type SyncPullResult = {
  readonly success: boolean;
  readonly pulledCount: number;
  readonly message: string;
  readonly items: readonly CalendarItem[];
  readonly changes: readonly SyncChange[];
};

export type SyncPushResult = {
  readonly success: boolean;
  readonly pushedCount: number;
  readonly queuedCount: number;
  readonly message: string;
  readonly failures: readonly string[];
};

export type SyncHistoryEntry = {
  readonly id: string;
  readonly timestamp: string;
  readonly direction: "pull" | "push";
  readonly provider: SyncProviderId;
  readonly status: SyncLifecycleState;
  readonly summary: string;
  readonly itemCount: number;
};

export type OAuthSessionState =
  | "disconnected"
  | "connected"
  | "expired"
  | "revoked"
  | "error";

export type OAuthSessionInfo = {
  readonly provider: SyncProviderId;
  readonly state: OAuthSessionState;
  readonly accountEmail?: string;
  readonly lastSyncedAt?: string | null;
  readonly scopes: readonly string[];
  readonly tokenExpiresAt?: string | null;
};
