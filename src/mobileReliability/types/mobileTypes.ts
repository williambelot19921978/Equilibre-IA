/**
 * EPIC 7B — Mobile & reliability shared types.
 */

export type ConnectivityState = "online" | "offline" | "degraded";

export type SyncStatus = "synced" | "pending" | "syncing" | "offline" | "error";

export type OfflineMutationKind =
  | "task_create"
  | "task_update"
  | "checkin_save"
  | "goal_create"
  | "profile_update";

export type OfflineMutation = {
  readonly id: string;
  readonly userId: string;
  readonly kind: OfflineMutationKind;
  readonly payload: Record<string, unknown>;
  readonly status: "pending" | "syncing" | "synced" | "failed";
  readonly attempts: number;
  readonly lastError?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type SyncSnapshot = {
  readonly status: SyncStatus;
  readonly pendingCount: number;
  readonly lastSyncedAt: string | null;
  readonly lastError: string | null;
  readonly isOnline: boolean;
};

export type NotificationLevel = "all" | "important" | "silent" | "none";

export type NotificationChannelId =
  | "coach"
  | "checkin"
  | "planning"
  | "goals"
  | "digest";

export type NotificationPreferences = {
  readonly level: NotificationLevel;
  readonly channels: Record<NotificationChannelId, boolean>;
  readonly quietStart: string;
  readonly quietEnd: string;
  readonly digestHour: number;
};

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  level: "important",
  channels: {
    coach: true,
    checkin: true,
    planning: true,
    goals: true,
    digest: true,
  },
  quietStart: "22:00",
  quietEnd: "07:00",
  digestHour: 8,
};

export type DeliveredNotification = {
  readonly id: string;
  readonly channelId: NotificationChannelId;
  readonly title: string;
  readonly body: string;
  readonly suggestionId?: string;
  readonly silent: boolean;
  readonly read: boolean;
  readonly deliveredAt: string;
  readonly source: "proactive_engine";
};

export type CrashReport = {
  readonly id: string;
  readonly message: string;
  readonly stack?: string;
  readonly context?: Record<string, unknown>;
  readonly at: string;
};

export type LogEntry = {
  readonly level: "debug" | "info" | "warn" | "error";
  readonly message: string;
  readonly context?: Record<string, unknown>;
  readonly at: string;
};
