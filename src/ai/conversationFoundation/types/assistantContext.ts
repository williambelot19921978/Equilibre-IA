/** EPIC 4A — Aggregated read-only context for the assistant. */

import type { DailyStateMood, SpecialDayKind } from "../../../dailyStateEngine/types/dailyStateTypes";
import type { DailyBrief } from "../../../lib/dailyBrief/buildDailyBrief";
import type { HouseholdMemoryContext, PlanningContext } from "../../memoryEngine";
import type { HouseholdMemberRecord } from "../../../types";
import type { HabitProfile } from "../../../types/habitProfile";
import type { LivingMemory } from "../../../types/livingMemory";
import type { DayPlan } from "../../../types/planning";

export type UserProfileSnapshot = {
  readonly id: string;
  readonly onboarding_completed: boolean | null;
};

export type ContextSourceRef = {
  readonly id: string;
  readonly label: string;
  readonly available: boolean;
};

export type AssistantUserContext = {
  readonly userId: string;
  readonly firstName: string;
  readonly profile: UserProfileSnapshot | null;
  readonly onboardingCompleted: boolean;
};

export type AssistantHouseholdContext = {
  readonly householdId: string | null;
  readonly members: readonly HouseholdMemberRecord[];
  readonly childrenCount: number;
  readonly memory: HouseholdMemoryContext | null;
};

export type AssistantPlanningSnapshot = {
  readonly date: string;
  readonly planningContext: PlanningContext | null;
  readonly dayPlan: DayPlan | null;
  readonly blockCount: number;
  readonly hasLoadedPlan: boolean;
};

/** EPIC 5A — Unified timeline metrics from PlanningCalendarEngine. */
export type AssistantPlanningCalendarSnapshot = {
  readonly enabled: boolean;
  readonly eventCount: number;
  readonly conflictCount: number;
  readonly freeMinutes: number;
  readonly busyMinutes: number;
  readonly providerCount: number;
};

export type AssistantTasksSnapshot = {
  readonly total: number;
  readonly todo: number;
  readonly done: number;
  readonly topTitles: readonly string[];
};

export type AssistantGoalSnapshot = {
  readonly id: string;
  readonly name: string;
  readonly progressPercent: number;
};

export type AssistantGoalsSnapshot = {
  readonly enabled: boolean;
  readonly activeCount: number;
  readonly goals: readonly AssistantGoalSnapshot[];
};

export type AssistantDailyBriefSnapshot = {
  readonly enabled: boolean;
  readonly brief: DailyBrief | null;
};

export type AssistantMemorySnapshot = {
  readonly livingMemory: LivingMemory | null;
  readonly habitProfile: HabitProfile | null;
  readonly knownFactsCount: number;
};

/** EPIC 5C — Semantic interpretation layer on PlanningCalendarEngine. */
export type AssistantSemanticPlanningSnapshot = {
  readonly enabled: boolean;
  readonly mentalLoad: number;
  readonly physicalLoad: number;
  readonly balanceScore: number;
  readonly balanceSignals: readonly string[];
  readonly insightMessages: readonly string[];
  readonly briefHints: readonly string[];
  readonly categoryDistribution: Readonly<Record<string, number>>;
  readonly averageConfidence: number;
  readonly freeMinutes: number;
  readonly togetherMinutes: number;
  readonly personalMinutes: number;
  readonly workMinutes: number;
  readonly eventCount: number;
};

/** EPIC 6A — Adaptive learning layer (validated preferences only for behavior). */
export type AssistantAdaptiveIntelligenceSnapshot = {
  readonly enabled: boolean;
  readonly observationCount: number;
  readonly habitCount: number;
  readonly pendingProposalCount: number;
  readonly validatedPreferenceCount: number;
  readonly topHabits: readonly string[];
  readonly pendingProposals: readonly {
    readonly id: string;
    readonly label: string;
    readonly confidence: number;
    readonly proposedValue: string;
  }[];
  readonly validatedPreferences: readonly {
    readonly id: string;
    readonly label: string;
    readonly proposedValue: string;
    readonly kind: string;
  }[];
  readonly phrasingHints: readonly string[];
  readonly timelineMessages: readonly string[];
  readonly learningConfidence: number;
};

/** EPIC 6B — Proactive intelligence layer (suggest only — never act alone). */
export type AssistantProactiveIntelligenceSnapshot = {
  readonly enabled: boolean;
  readonly displayableCount: number;
  readonly scheduledCount: number;
  readonly suggestionCount: number;
  readonly digestCount: number;
  readonly displayableSuggestions: readonly {
    readonly id: string;
    readonly title: string;
    readonly kind: string;
    readonly score: number;
    readonly confidence: number;
    readonly reason: string;
    readonly preparedAction?: string;
  }[];
  readonly behaviorMetrics: {
    readonly interruptionTolerance: number;
    readonly notificationPreference: "minimal" | "balanced" | "active";
    readonly acceptanceRate: number;
    readonly dismissRate: number;
    readonly preferredMoments: readonly string[];
  };
  readonly lifeTransitionMessages: readonly string[];
  readonly phrasingHints: readonly string[];
  readonly timelineMessages: readonly string[];
};

/** EPIC 6C — Daily State (check-in du jour — priority source for Human Model). */
export type AssistantDailyStateSnapshot = {
  readonly enabled: boolean;
  readonly hasCheckinToday: boolean;
  readonly today: {
    readonly date: string;
    readonly mood: DailyStateMood;
    readonly energy: number;
    readonly stress: number;
    readonly sleepQuality: number;
    readonly specialDay: SpecialDayKind;
    readonly confidence: number;
  } | null;
  readonly shouldRemind: boolean;
  readonly reminderMessage?: string;
  readonly phrasingHints: readonly string[];
  readonly trendEnergy7d: number;
  readonly trendStress7d: number;
};

/** EPIC 6D — Personal Coach snapshot. */
export type AssistantPersonalCoachSnapshot = {
  readonly enabled: boolean;
  readonly lifePriority: string;
  readonly todayCount: number;
  readonly opportunityCount: number;
  readonly recoveryCount: number;
  readonly successCount: number;
  readonly hasWeeklyReview: boolean;
  readonly hasMonthlyReflection: boolean;
  readonly hasProposedSession: boolean;
  readonly phrasingHints: readonly string[];
  readonly topOpportunityTitle?: string;
};

/** EPIC 6E — Life Knowledge snapshot. */
export type AssistantLifeKnowledgeSnapshot = {
  readonly enabled: boolean;
  readonly knowledgeCount: number;
  readonly confirmedCount: number;
  readonly pendingConfirmationCount: number;
  readonly timelineCount: number;
  readonly phrasingHints: readonly string[];
  readonly topConfirmedLabels: readonly string[];
};

export type AssistantConversationContext = {
  readonly builtAt: string;
  readonly date: string;
  readonly user: AssistantUserContext;
  readonly household: AssistantHouseholdContext;
  readonly planning: AssistantPlanningSnapshot;
  readonly planningCalendar: AssistantPlanningCalendarSnapshot;
  readonly semanticPlanning: AssistantSemanticPlanningSnapshot;
  readonly adaptiveIntelligence: AssistantAdaptiveIntelligenceSnapshot;
  readonly proactiveIntelligence: AssistantProactiveIntelligenceSnapshot;
  readonly dailyState: AssistantDailyStateSnapshot;
  readonly lifeKnowledge: AssistantLifeKnowledgeSnapshot;
  readonly personalCoach: AssistantPersonalCoachSnapshot;
  readonly tasks: AssistantTasksSnapshot;
  readonly goals: AssistantGoalsSnapshot;
  readonly dailyBrief: AssistantDailyBriefSnapshot;
  readonly memory: AssistantMemorySnapshot;
  readonly sources: readonly ContextSourceRef[];
  readonly gaps: readonly string[];
};
