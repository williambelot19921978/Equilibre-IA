/** EPIC 6D — Personal Coach Engine public API */

export type {
  CoachingDomain,
  LifePriority,
  CoachAdviceKind,
  CoachingSessionKind,
  CoachExplainability,
  CoachAdvice,
  CoachingSession,
  DomainInsights,
  PersonalCoachInput,
  PersonalCoachSnapshot,
} from "./types/personalCoachTypes";

export {
  COACHING_DOMAIN_LABELS,
  LIFE_PRIORITY_OPTIONS,
  DEFAULT_LIFE_PRIORITY,
  COACH_DISCLAIMER,
  ALL_COACHING_DOMAINS,
} from "./types/personalCoachTypes";

export {
  getLifePriority,
  setLifePriority,
  recordDismissedAdvice,
  getDismissedAdviceIds,
  recordShownSuccess,
  getShownSuccessKeys,
  wasSessionOfferedToday,
  wasAnySessionOfferedToday,
  clearCoachStore,
} from "./store/coachStore";

export { buildDomainInsights } from "./domains/coachingDomainEngine";
export { detectOpportunities } from "./opportunity/opportunityEngine";
export { detectRecoveryNeeds } from "./recovery/recoveryEngine";
export { detectSuccesses, markSuccessShown } from "./success/successEngine";
export { buildWeeklyReview, isWeeklyReviewWindow } from "./weekly/weeklyReviewEngine";
export { buildMonthlyReflection, isMonthlyReflectionWindow } from "./monthly/monthlyReflectionEngine";
export {
  buildCoachingSession,
  proposeDailySession,
  proposeWeeklySession,
  proposeAdHocSession,
} from "./session/coachingSessionEngine";
export { buildCoachPhrasingHints } from "./phrasing/coachPhrasing";

export {
  PersonalCoachEngine,
  defaultPersonalCoachEngine,
  createEmptyPersonalCoachSnapshot,
} from "./engine/personalCoachEngine";
export type { PersonalCoachEngineDeps } from "./engine/personalCoachEngine";

export { buildPersonalCoachDiagnostics } from "./diagnostics/buildPersonalCoachDiagnostics";
export type { PersonalCoachDiagnostics } from "./diagnostics/buildPersonalCoachDiagnostics";
