/** EPIC 5B — Calendar Sync Engine public API */

export type {
  SyncLifecycleState,
  SyncProviderId,
  SyncContext,
  SyncChange,
  SyncChangeKind,
  SyncConflictKind,
  ConflictResolution,
  ConflictResolutionPreview,
  SyncPullResult,
  SyncPushResult,
  SyncHistoryEntry,
  OAuthSessionInfo,
  OAuthSessionState,
} from "./types/syncTypes";

export { SyncEventBus, defaultSyncEventBus } from "./events/syncEventBus";
export type { SyncEvent, SyncEventType } from "./events/syncEventBus";

export {
  GoogleCalendarConnector,
  createGoogleCalendarConnector,
  defaultGoogleCalendarConnector,
  GOOGLE_WRITE_SCOPE_REQUIRED,
} from "./connectors/googleCalendarConnector";
export type { GoogleCalendarConnectorDeps } from "./connectors/googleCalendarConnector";

export { createGoogleCalendarProvider } from "./providers/googleCalendarProvider";
export { externalEventToCalendarItem } from "./mappers/externalEventMapper";

export { detectSyncChanges } from "./sync/changeDetector";
export { detectSyncConflicts, buildConflictResolutions } from "./sync/conflictDetector";
export type { SyncConflict } from "./sync/conflictDetector";

export { OfflineSyncQueue, defaultOfflineSyncQueue } from "./sync/offlineQueue";
export type { QueuedSyncOperation } from "./sync/offlineQueue";

export {
  SynchronizationEngine,
  defaultSynchronizationEngine,
} from "./sync/synchronizationEngine";
export type { SynchronizationEngineDeps } from "./sync/synchronizationEngine";

export {
  appendSyncHistory,
  getSyncHistory,
  clearSyncHistory,
  recordSyncHistory,
} from "./sync/syncHistory";

export {
  BackgroundSyncScheduler,
  defaultBackgroundSyncScheduler,
  DEFAULT_BACKGROUND_SYNC_CONFIG,
} from "./sync/backgroundSyncScheduler";

export {
  mapConnectionToOAuthSession,
  isOAuthSessionExpired,
  describeOAuthState,
} from "./oauth/oauthSession";
