/** EPIC 8A — Trust Center public API */

export type {
  PrivacyPreferenceKey,
  PrivacyPreferences,
  TrustDashboardSnapshot,
  SecuritySnapshot,
  DataExportSection,
  UserDataExportBundle,
  DataDeletionScope,
  FeedbackKind,
  FeedbackEntry,
  RecommendationWhyDetails,
} from "./types";

export { DEFAULT_PRIVACY_PREFERENCES, FAQ_ITEMS } from "./types";

export {
  getPrivacyPreferences,
  setPrivacyPreference,
  clearPrivacyPreferences,
  PRIVACY_PREFERENCE_LABELS,
} from "./privacyPreferencesStore";

export { buildTrustDashboard } from "./trustDashboardService";

export {
  buildUserDataExport,
  exportAsJson,
  exportAsCsv,
  exportAsPdfSummary,
  downloadTextFile,
} from "./dataExportService";

export {
  executeDeletion,
  deleteHabitsData,
  deleteCheckinsData,
  deleteGoalsData,
  deleteAuraMemory,
  deleteAllUserData,
  DELETION_SCOPE_LABELS,
  requiresDeletionConfirmation,
} from "./dataDeletionService";
export type { DeletionResult } from "./dataDeletionService";

export {
  buildSecuritySnapshot,
  signOutAllDevices,
  signOutCurrentDevice,
} from "./securityStatusService";

export {
  listFeedback,
  submitFeedback,
  clearFeedback,
  FEEDBACK_KIND_LABELS,
} from "./feedbackStore";
