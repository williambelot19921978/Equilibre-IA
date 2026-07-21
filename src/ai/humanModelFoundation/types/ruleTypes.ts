/** EPIC 4B — Rule Engine primitives. */

import type { DailyCheckinRecord } from "../../../types/dailyCheckin";
import type { MemoryProfile } from "../../memoryEngine";
import type {
  AssistantConversationContext,
  AssistantGoalSnapshot,
  ContextSourceRef,
} from "../../conversationFoundation/types/assistantContext";
import type { DailyBrief } from "../../../lib/dailyBrief/buildDailyBrief";

export type RuleOutput<T> = {
  readonly value: T;
  readonly confidence: number;
  readonly explanation: string;
  readonly reasons: readonly string[];
  readonly missingData: readonly string[];
};

export type HumanModelRuleInput = {
  readonly userId: string;
  readonly firstName: string;
  readonly date: string;
  readonly dailyCheckin: DailyCheckinRecord | null;
  readonly blockCount: number;
  readonly hasLoadedPlan: boolean;
  readonly taskTodoCount: number;
  readonly taskTotalCount: number;
  readonly topTaskTitles: readonly string[];
  readonly childrenCount: number;
  readonly memberCount: number;
  readonly goals: readonly AssistantGoalSnapshot[];
  readonly goalsEnabled: boolean;
  readonly activeGoalCount: number;
  readonly dailyBrief: DailyBrief | null;
  readonly profile: MemoryProfile | null;
  readonly knownFactsCount: number;
  readonly gaps: readonly string[];
  readonly sources: readonly ContextSourceRef[];
  readonly timelineEventCount: number;
  readonly freeMinutesToday: number;
  readonly conflictCount: number;
  readonly semanticEnabled: boolean;
  readonly semanticMentalLoad: number;
  readonly semanticBalanceScore: number;
  readonly semanticBalanceSignals: readonly string[];
  readonly adaptiveEnabled: boolean;
  readonly validatedPreferenceCount: number;
  readonly validatedPreferenceLabels: readonly string[];
  readonly learningConfidence: number;
  readonly proactiveEnabled: boolean;
  readonly proactiveBehaviorMetrics: {
    readonly interruptionTolerance: number;
    readonly notificationPreference: "minimal" | "balanced" | "active";
    readonly acceptanceRate: number;
    readonly dismissRate: number;
    readonly preferredMoments: readonly string[];
  } | null;
  readonly dailyStateEnabled: boolean;
  readonly dailyStateToday: AssistantConversationContext["dailyState"]["today"];
};

export type HumanModelRule<T> = {
  readonly id: string;
  readonly label: string;
  evaluate(input: HumanModelRuleInput): RuleOutput<T>;
};

export function toHumanModelRuleInput(
  context: AssistantConversationContext,
): HumanModelRuleInput {
  const planningContext = context.planning.planningContext;

  return {
    userId: context.user.userId,
    firstName: context.user.firstName,
    date: context.date,
    dailyCheckin: planningContext?.dailyCheckin ?? null,
    blockCount: context.planning.blockCount,
    hasLoadedPlan: context.planning.hasLoadedPlan,
    taskTodoCount: context.tasks.todo,
    taskTotalCount: context.tasks.total,
    topTaskTitles: context.tasks.topTitles,
    childrenCount: context.household.childrenCount,
    memberCount: context.household.members.length,
    goals: context.goals.goals,
    goalsEnabled: context.goals.enabled,
    activeGoalCount: context.goals.activeCount,
    dailyBrief: context.dailyBrief.brief,
    profile: planningContext?.profile ?? null,
    knownFactsCount: context.memory.knownFactsCount,
    gaps: context.gaps,
    sources: context.sources,
    timelineEventCount: context.planningCalendar.eventCount,
    freeMinutesToday: context.planningCalendar.freeMinutes,
    conflictCount: context.planningCalendar.conflictCount,
    semanticEnabled: context.semanticPlanning.enabled,
    semanticMentalLoad: context.semanticPlanning.mentalLoad,
    semanticBalanceScore: context.semanticPlanning.balanceScore,
    semanticBalanceSignals: context.semanticPlanning.balanceSignals,
    adaptiveEnabled: context.adaptiveIntelligence.enabled,
    validatedPreferenceCount: context.adaptiveIntelligence.validatedPreferenceCount,
    validatedPreferenceLabels: context.adaptiveIntelligence.validatedPreferences.map(
      (pref) => pref.label,
    ),
    learningConfidence: context.adaptiveIntelligence.learningConfidence,
    proactiveEnabled: context.proactiveIntelligence.enabled,
    proactiveBehaviorMetrics: context.proactiveIntelligence.enabled
      ? context.proactiveIntelligence.behaviorMetrics
      : null,
    dailyStateEnabled: context.dailyState.enabled,
    dailyStateToday: context.dailyState.today,
  };
}

export function ruleOutput<T>(
  value: T,
  confidence: number,
  explanation: string,
  reasons: readonly string[] = [],
  missingData: readonly string[] = [],
): RuleOutput<T> {
  return { value, confidence, explanation, reasons, missingData };
}
