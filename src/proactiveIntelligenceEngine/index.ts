/** EPIC 6B — Proactive Intelligence Engine public API */

export type {
  SuggestionKind,
  SuggestionLifecycleState,
  PreparedActionType,
  ProactiveExplainability,
  ProactiveSuggestion,
  ProactiveScoreFactors,
  ProactiveScore,
  AttentionDecision,
  SensitivePeriodKind,
  CalendarEventInput,
  ProactiveIntelligenceInput,
  ProactiveDigest,
  ProactiveTimelineEntry,
  ProactiveTimelineEntryKind,
  LifeTransitionKind,
  LifeTransitionSignal,
  ProactiveBehaviorMetrics,
  ProactiveIntelligenceSnapshot,
  NotificationChannel,
  ProactiveNotification,
} from "./types/proactiveTypes";

export {
  AttentionEngine,
  defaultAttentionEngine,
  evaluateAttention,
} from "./attention/attentionEngine";

export { computeProactiveScore, dismissHistoryPenalty } from "./score/proactiveScoreEngine";

export {
  detectSensitivePeriod,
  shouldBlockIntervention,
  interventionEndTime,
  PERIOD_LABELS,
} from "./policy/interventionPolicy";

export {
  evaluateQuietHours,
  DEFAULT_QUIET_HOURS,
} from "./quiet/quietHoursPolicy";
export type { QuietHoursConfig } from "./quiet/quietHoursPolicy";

export {
  SuggestionEngine,
  defaultSuggestionEngine,
  generateSuggestions,
} from "./suggestion/suggestionEngine";

export {
  getAllSuggestions,
  upsertSuggestion,
  updateSuggestionStatus,
  acceptSuggestion,
  dismissSuggestion,
  clearSuggestions,
} from "./suggestion/suggestionStore";

export {
  getBehaviorMetrics,
  recordSuggestionOutcome,
  clearBehaviorMetrics,
  DEFAULT_METRICS,
} from "./learning/proactiveBehaviorStore";

export {
  recordSuggestionShown,
  recordSuggestionDismissed,
  kindDismissRate,
  frequencyMultiplier,
  createDismissObservation,
  clearDismissRecords,
} from "./learning/proactiveLearningEngine";

export {
  getProactiveTimeline,
  appendProactiveTimelineEntry,
  recordSuggestionLifecycle,
  recordDigestCreated,
  recordLifeTransition,
  clearProactiveTimeline,
} from "./timeline/proactiveTimeline";

export { DigestBuilder, defaultDigestBuilder, buildDigest } from "./digest/digestBuilder";

export {
  NotificationDispatcher,
  defaultNotificationDispatcher,
  FUTURE_CHANNELS,
} from "./notification/notificationDispatcher";

export {
  LifeTransitionEngine,
  defaultLifeTransitionEngine,
  detectLifeTransitions,
} from "./transition/lifeTransitionEngine";

export {
  getActionPreparation,
  canPrepareAction,
  suggestionsForActionEngine,
} from "./action/proactiveActionGuards";

export { buildProactivePhrasingHints, sanitizeProactivePhrase } from "./phrasing/proactivePhrasing";

export {
  ProactiveIntelligenceEngine,
  defaultProactiveIntelligenceEngine,
  createEmptyProactiveSnapshot,
} from "./engine/proactiveIntelligenceEngine";
export type { ProactiveIntelligenceEngineDeps } from "./engine/proactiveIntelligenceEngine";

export { buildProactiveDiagnostics } from "./diagnostics/buildProactiveDiagnostics";
export type { ProactiveDiagnostics } from "./diagnostics/buildProactiveDiagnostics";
