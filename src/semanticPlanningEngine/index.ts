/** EPIC 5C — Semantic Planning Engine public API */

export type {
  SemanticCategory,
  EnergyLevel,
  FlexibilityLevel,
  ImportanceLevel,
  SemanticEnrichment,
  DailyLoadBreakdown,
  LifeBalanceAssessment,
  LifeBalanceSignal,
  SemanticInsight,
  SemanticExplainability,
  GoalImpactLink,
  HouseholdTimeVision,
  SemanticPrediction,
  SemanticBriefHint,
  SemanticPlanningSnapshot,
  LifeProfileKind,
} from "./types/semanticTypes";

export type { SemanticCalendarItem } from "./types/semanticCalendarItem";
export { wrapSemanticItem } from "./types/semanticCalendarItem";

export { classifyCalendarItem, classifyCalendarItems } from "./classification/classificationEngine";
export type { ClassificationResult } from "./classification/classificationEngine";

export { scoreSemanticEnrichment } from "./scoring/semanticScoringEngine";
export { computeDailyLoad, mentalLoadFromSemantic } from "./load/dailyLoadEngine";
export { assessLifeBalance } from "./balance/lifeBalanceEngine";
export { generateSemanticInsights } from "./insights/insightEngine";
export { buildPredictionArchitecture } from "./prediction/predictionEngine";
export { computeGoalImpacts } from "./goals/goalImpactEngine";
export type { GoalSnapshot } from "./goals/goalImpactEngine";
export { computeHouseholdVision } from "./household/householdEngine";
export { buildExplainability } from "./explain/explainability";
export { buildSemanticBriefHints } from "./brief/semanticBriefHints";

export {
  isFixedMedicalEvent,
  isSportEvent,
  shouldBlockMedicalBeforeSport,
  canRescheduleSemantically,
  rescheduleConfidenceFromSemantic,
  shouldProposeReorganizeDay,
} from "./action/semanticActionGuards";

export {
  SemanticPlanningEngine,
  defaultSemanticPlanningEngine,
  createEmptySemanticSnapshot,
} from "./engine/semanticPlanningEngine";
export type { SemanticPlanningInput, SemanticPlanningEngineDeps } from "./engine/semanticPlanningEngine";

export {
  buildSemanticDiagnostics,
} from "./diagnostics/buildSemanticDiagnostics";
export type { SemanticDiagnostics } from "./diagnostics/buildSemanticDiagnostics";
