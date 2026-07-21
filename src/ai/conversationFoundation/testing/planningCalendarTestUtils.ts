/** Shared planning calendar snapshot for tests. */

import type {
  AssistantAdaptiveIntelligenceSnapshot,
  AssistantPlanningCalendarSnapshot,
  AssistantSemanticPlanningSnapshot,
} from "../types/assistantContext";

export const DISABLED_PLANNING_CALENDAR: AssistantPlanningCalendarSnapshot = {
  enabled: false,
  eventCount: 0,
  conflictCount: 0,
  freeMinutes: 0,
  busyMinutes: 0,
  providerCount: 0,
};

export const DISABLED_SEMANTIC_PLANNING: AssistantSemanticPlanningSnapshot = {
  enabled: false,
  mentalLoad: 0,
  physicalLoad: 0,
  balanceScore: 50,
  balanceSignals: [],
  insightMessages: [],
  briefHints: [],
  categoryDistribution: {},
  averageConfidence: 0,
  freeMinutes: 0,
  togetherMinutes: 0,
  personalMinutes: 0,
  workMinutes: 0,
  eventCount: 0,
};

export const DISABLED_ADAPTIVE_INTELLIGENCE: AssistantAdaptiveIntelligenceSnapshot = {
  enabled: false,
  observationCount: 0,
  habitCount: 0,
  pendingProposalCount: 0,
  validatedPreferenceCount: 0,
  topHabits: [],
  pendingProposals: [],
  validatedPreferences: [],
  phrasingHints: [],
  timelineMessages: [],
  learningConfidence: 0,
};

export const DISABLED_PROACTIVE_INTELLIGENCE: import("../types/assistantContext").AssistantProactiveIntelligenceSnapshot =
  {
    enabled: false,
    displayableCount: 0,
    scheduledCount: 0,
    suggestionCount: 0,
    digestCount: 0,
    displayableSuggestions: [],
    behaviorMetrics: {
      interruptionTolerance: 0.6,
      notificationPreference: "balanced",
      acceptanceRate: 0.5,
      dismissRate: 0.2,
      preferredMoments: [],
    },
    lifeTransitionMessages: [],
    phrasingHints: [],
    timelineMessages: [],
  };

export const DISABLED_LIFE_KNOWLEDGE: import("../types/assistantContext").AssistantLifeKnowledgeSnapshot = {
  enabled: false,
  knowledgeCount: 0,
  confirmedCount: 0,
  pendingConfirmationCount: 0,
  timelineCount: 0,
  phrasingHints: [],
  topConfirmedLabels: [],
};

export const DISABLED_PERSONAL_COACH: import("../types/assistantContext").AssistantPersonalCoachSnapshot = {
  enabled: false,
  lifePriority: "balance",
  todayCount: 0,
  opportunityCount: 0,
  recoveryCount: 0,
  successCount: 0,
  hasWeeklyReview: false,
  hasMonthlyReflection: false,
  hasProposedSession: false,
  phrasingHints: [],
};

export const DISABLED_DAILY_STATE: import("../types/assistantContext").AssistantDailyStateSnapshot = {
  enabled: false,
  hasCheckinToday: false,
  today: null,
  shouldRemind: false,
  phrasingHints: [],
  trendEnergy7d: 0,
  trendStress7d: 0,
};
