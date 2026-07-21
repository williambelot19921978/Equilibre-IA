/** EPIC 6C — Daily State Engine public API */

export type {
  DailyStateMood,
  SpecialDayKind,
  CheckinMode,
  DailyStateSource,
  DailyState,
  CheckinSkipRecord,
  CheckinFlowStep,
  CheckinFlowPlan,
  StateTrendPeriod,
  StateTrends,
  DailyStateSnapshot,
  DailyStateInput,
} from "./types/dailyStateTypes";

export {
  MOOD_OPTIONS,
  SPECIAL_DAY_OPTIONS,
  DEFAULT_CHECKIN_MODE,
  MEDICAL_DISCLAIMER,
} from "./types/dailyStateTypes";

export {
  getDailyState,
  getStateHistory,
  saveDailyState,
  deleteDailyState,
  clearDailyStates,
  getCheckinMode,
  setCheckinMode,
  recordSkip,
  getSkipRecords,
  consecutiveSkipDays,
  clearSkipRecords,
} from "./store/dailyStateStore";

export {
  shouldSkipSleepQuestion,
  needsAdaptiveSleepQuestion,
  buildCheckinFlow,
  recordAdaptiveObservation,
} from "./adaptive/adaptiveQuestionEngine";

export { computeTrends, TrendEngine, defaultTrendEngine } from "./trends/trendEngine";

export {
  dailyStateToCheckinInput,
  parseStateFromCheckin,
  buildDailyStateFromInput,
  enrichCheckinRecordFromState,
} from "./bridge/dailyCheckinBridge";

export {
  buildStatePhrasingHints,
  proactiveReductionFactor,
  semanticFatigueInsight,
} from "./phrasing/statePhrasing";

export {
  shouldSoftenActions,
  actionConfidenceFromState,
  humanModelPriorityConfidence,
} from "./guards/stateEngineGuards";

export {
  DailyStateEngine,
  defaultDailyStateEngine,
  createEmptyDailyStateSnapshot,
} from "./engine/dailyStateEngine";
export type { DailyStateEngineDeps } from "./engine/dailyStateEngine";

export { buildDailyStateDiagnostics } from "./diagnostics/buildDailyStateDiagnostics";
export type { DailyStateDiagnostics } from "./diagnostics/buildDailyStateDiagnostics";

export { dailyStateToHumanModelEnergy, dailyStateToHumanModelStress, dailyStateToHumanModelSleep } from "./humanModel/dailyStateHumanModel";
