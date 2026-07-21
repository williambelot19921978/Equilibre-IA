function parseBooleanEnv(
  value: string | undefined,
  defaultValue: boolean,
): boolean {
  if (value === undefined || value.trim() === "") {
    return defaultValue;
  }

  return value === "true" || value === "1";
}

export function isGoogleCalendarEnabled(): boolean {
  return parseBooleanEnv(
    import.meta.env.VITE_GOOGLE_CALENDAR_ENABLED,
    false,
  );
}

/** Sprint A3 — contract DecisionEngine pilot (default: legacy authority). */
export function isNewDecisionEngineEnabled(): boolean {
  return parseBooleanEnv(
    import.meta.env.VITE_USE_NEW_DECISION_ENGINE,
    false,
  );
}

/** Sprint A4 — OutcomeObservationEngine pilot (default: disabled). */
export function isOutcomeObservationEnabled(): boolean {
  return parseBooleanEnv(
    import.meta.env.VITE_ENABLE_OUTCOME_OBSERVATION,
    false,
  );
}

/** Sprint P1 — proactive study slot recommendation (default: disabled). */
export function isStudySlotRecommendationEnabled(): boolean {
  return parseBooleanEnv(
    import.meta.env.VITE_P1_STUDY_RECOMMENDATION,
    false,
  );
}

/** Sprint P2 — smart study task rescheduling (default: disabled). */
export function isSmartStudyReschedulingEnabled(): boolean {
  return parseBooleanEnv(
    import.meta.env.VITE_P2_SMART_RESCHEDULING,
    false,
  );
}

/** EPIC1-A — Daily Brief (default: disabled). */
export function isDailyBriefEnabled(): boolean {
  return parseBooleanEnv(import.meta.env.VITE_DAILY_BRIEF, false);
}

/** EPIC1-B — Explainable AI layer (default: disabled). */
export function isExplainableAiEnabled(): boolean {
  return parseBooleanEnv(import.meta.env.VITE_EXPLAINABLE_AI, false);
}

/** EPIC1-C — Adaptive Daily Brief refresh (default: disabled). */
export function isDynamicDailyBriefEnabled(): boolean {
  return parseBooleanEnv(import.meta.env.VITE_DYNAMIC_DAILY_BRIEF, false);
}

/** EPIC2-A — User goals MVP (default: disabled). */
export function isGoalsEnabled(): boolean {
  return parseBooleanEnv(import.meta.env.VITE_GOALS, false);
}

/** EPIC2-B — Goal progress assistant (default: disabled). */
export function isGoalProgressAssistantEnabled(): boolean {
  return parseBooleanEnv(import.meta.env.VITE_GOAL_PROGRESS_ASSISTANT, false);
}

/** EPIC3-A — Household overview (default: disabled). */
export function isHouseholdOverviewEnabled(): boolean {
  return parseBooleanEnv(import.meta.env.VITE_HOUSEHOLD_OVERVIEW, false);
}

/** EPIC3-B — Household opportunities (default: disabled). */
export function isHouseholdOpportunitiesEnabled(): boolean {
  return parseBooleanEnv(import.meta.env.VITE_HOUSEHOLD_OPPORTUNITIES, false);
}

/** EPIC3-C — Household collaboration proposals (default: disabled). */
export function isHouseholdCollaborationEnabled(): boolean {
  return parseBooleanEnv(import.meta.env.VITE_HOUSEHOLD_COLLABORATION, false);
}

/** EPIC4-A — Assistant IA conversation page (default: disabled). */
export function isAssistantIaEnabled(): boolean {
  return parseBooleanEnv(import.meta.env.VITE_ASSISTANT_IA, false);
}

/** EPIC4-B — Mon Profil IA / Human Model page (default: disabled). */
export function isHumanModelEnabled(): boolean {
  return parseBooleanEnv(import.meta.env.VITE_HUMAN_MODEL, false);
}

/** EPIC4-C — Secure Action Engine (default: disabled). */
export function isSecureActionEngineEnabled(): boolean {
  return parseBooleanEnv(import.meta.env.VITE_SECURE_ACTION_ENGINE, false);
}

/** EPIC5-A — Planning & Calendar Engine (default: disabled). */
export function isPlanningCalendarEngineEnabled(): boolean {
  return parseBooleanEnv(import.meta.env.VITE_PLANNING_CALENDAR_ENGINE, false);
}

/** EPIC5-B — Calendar Synchronization Engine (default: disabled). */
export function isCalendarSyncEngineEnabled(): boolean {
  return parseBooleanEnv(import.meta.env.VITE_CALENDAR_SYNC_ENGINE, false);
}

/** EPIC5-C — Semantic Planning Engine (default: disabled). */
export function isSemanticPlanningEngineEnabled(): boolean {
  return parseBooleanEnv(import.meta.env.VITE_SEMANTIC_PLANNING_ENGINE, false);
}

/** EPIC6-A — Adaptive Intelligence Engine (default: disabled). */
export function isAdaptiveIntelligenceEnabled(): boolean {
  return parseBooleanEnv(import.meta.env.VITE_ADAPTIVE_INTELLIGENCE, false);
}

/** EPIC6-C — Proactive Intelligence Engine (default: disabled). */
export function isProactiveIntelligenceEnabled(): boolean {
  return parseBooleanEnv(import.meta.env.VITE_PROACTIVE_INTELLIGENCE, false);
}

/** EPIC6-C — Daily State / Check-in Engine (default: disabled). */
export function isDailyStateEngineEnabled(): boolean {
  return parseBooleanEnv(import.meta.env.VITE_DAILY_STATE_ENGINE, false);
}

/** EPIC6-E — Life Knowledge Engine (default: disabled). */
export function isLifeKnowledgeEngineEnabled(): boolean {
  return parseBooleanEnv(import.meta.env.VITE_LIFE_KNOWLEDGE_ENGINE, false);
}

/** EPIC6-D — Personal Coach Engine (default: disabled). */
export function isPersonalCoachEngineEnabled(): boolean {
  return parseBooleanEnv(import.meta.env.VITE_PERSONAL_COACH_ENGINE, false);
}
