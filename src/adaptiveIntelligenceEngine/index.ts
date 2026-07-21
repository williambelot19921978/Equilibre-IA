/** EPIC 6A — Adaptive Intelligence Engine public API */

export type {
  ObservationSource,
  ObservationType,
  BehaviorObservation,
  HabitKind,
  DetectedHabit,
  PreferenceValidationState,
  ConfidenceExplanation,
  PreferenceProposal,
  LearningTimelineEntry,
  LearningTimelineEntryKind,
  AdaptiveIntelligenceSnapshot,
  AdaptiveIntelligenceInput,
  AdaptiveNotification,
  AdaptiveNotificationKind,
} from "./types/adaptiveTypes";

export {
  ObservationEngine,
  defaultObservationEngine,
  observeFromInput,
  recordObservations,
} from "./observation/observationEngine";

export {
  appendObservation,
  getObservations,
  clearObservations,
  filterObservationsSince,
} from "./observation/observationStore";

export { HabitDetector, defaultHabitDetector, detectHabits } from "./habit/habitDetector";

export {
  PreferenceProposalEngine,
  defaultPreferenceProposalEngine,
  buildPreferenceProposals,
} from "./preference/preferenceProposalEngine";

export {
  getAllPreferences,
  getValidatedPreferences,
  getPendingProposals,
  acceptPreference,
  rejectPreference,
  updateProposalStatus,
  clearPreferences,
} from "./preference/preferenceStore";

export { computeConfidence, periodDaysFromObservations } from "./confidence/confidenceEngine";

export {
  getLearningTimeline,
  appendTimelineEntry,
  recordPreferenceValidated,
  syncTimelineFromAnalysis,
  clearLearningTimeline,
} from "./timeline/learningTimeline";

export {
  MemoryConsolidationEngine,
  defaultMemoryConsolidationEngine,
  DEFAULT_CONSOLIDATION_CONFIG,
} from "./consolidation/memoryConsolidationEngine";
export type { ConsolidationConfig, ConsolidationResult } from "./consolidation/memoryConsolidationEngine";

export {
  AdaptiveNotificationBus,
  defaultAdaptiveNotificationBus,
} from "./events/adaptiveNotificationBus";

export { buildAdaptivePhrasingHints, sanitizeAdaptivePhrase } from "./phrasing/adaptivePhrasing";

export {
  getValidatedPreferencesOnly,
  isRejectedPreference,
  shouldUsePreferenceForRecommendation,
  strongHabits,
  recommendationConfidenceFromPreferences,
} from "./action/adaptiveActionGuards";

export {
  AdaptiveIntelligenceEngine,
  defaultAdaptiveIntelligenceEngine,
  createEmptyAdaptiveSnapshot,
} from "./engine/adaptiveIntelligenceEngine";
export type { AdaptiveIntelligenceEngineDeps } from "./engine/adaptiveIntelligenceEngine";

export { buildAdaptiveDiagnostics } from "./diagnostics/buildAdaptiveDiagnostics";
export type { AdaptiveDiagnostics } from "./diagnostics/buildAdaptiveDiagnostics";
