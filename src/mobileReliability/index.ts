/** EPIC 7B — Mobile Reliability public API */

export type {
  ConnectivityState,
  SyncStatus,
  SyncSnapshot,
  OfflineMutation,
  OfflineMutationKind,
  NotificationLevel,
  NotificationChannelId,
  NotificationPreferences,
  DeliveredNotification,
  CrashReport,
  LogEntry,
} from "./types/mobileTypes";

export { DEFAULT_NOTIFICATION_PREFERENCES } from "./types/mobileTypes";

export {
  ConnectivityEngine,
  defaultConnectivityEngine,
} from "./connectivity/connectivityEngine";

export {
  enqueueOfflineMutation,
  listOfflineMutations,
  listPendingMutations,
  clearOfflineMutations,
} from "./offline/offlineMutationQueue";

export {
  SyncEngine,
  defaultSyncEngine,
  registerSyncHandler,
  startAutoSync,
} from "./sync/syncEngine";

export { buildSyncSnapshot, getSyncMeta, setSyncMeta } from "./sync/syncStatusStore";

export {
  ErrorRecoveryEngine,
  defaultErrorRecoveryEngine,
  withRetry,
} from "./recovery/errorRecoveryEngine";

export {
  NotificationEngine,
  defaultNotificationEngine,
  requestNotificationPermission,
} from "./notifications/notificationEngine";

export {
  getNotificationPreferences,
  setNotificationPreferences,
  setNotificationLevel,
  setChannelEnabled,
  isInQuietHours,
} from "./notifications/notificationPreferencesStore";

export { bridgeProactiveDispatchToInbox } from "./notifications/proactiveNotificationBridge";

export {
  secureSignOut,
  clearUserLocalData,
  validateSessionFreshness,
} from "./security/sessionSecurity";

export { CrashReporter, defaultCrashReporter } from "./crash/CrashReporter";
export { LogEngine, defaultLogEngine } from "./crash/LogEngine";
export { AnalyticsBridge, defaultAnalyticsBridge } from "./crash/AnalyticsBridge";

export { registerPwaUpdateListener, promptPwaUpdate, notifyPwaUpdateAvailable } from "./pwa/pwaUpdate";
