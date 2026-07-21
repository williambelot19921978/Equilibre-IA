/**
 * Cross-engine domain types referenced by multiple contracts.
 */

import type { AutonomyLevel, Confidence } from '../common/primitives.ts';
import type { MemberId, SessionId, TurnId, TaskId, BlockId } from '../common/ids.ts';

export type PendingAction = {
  readonly id: string;
  readonly type: string;
  readonly createdAt: string;
  readonly expiresAt?: string;
  readonly payload: Readonly<Record<string, unknown>>;
};

export type ConversationContext = {
  readonly sessionId: SessionId;
  readonly memberId: MemberId;
  readonly turnId: TurnId;
  readonly previousTurnCount: number;
  readonly pendingAction?: PendingAction;
};

export type IntentEntity = {
  readonly type: string;
  readonly value: string;
  readonly confidence: Confidence;
};

export type IntentResult = {
  readonly intent: string;
  readonly confidence: Confidence;
  readonly entities: readonly IntentEntity[];
  readonly ambiguities: readonly string[];
};

export type LanguageHint = {
  readonly expression: string;
  readonly suggestedIntent: string;
  readonly confidence: Confidence;
};

export type DayConstraint = {
  readonly id: string;
  readonly kind: 'hard' | 'soft';
  readonly ruleKey: string;
};

export type AvailableSlot = {
  readonly start: string;
  readonly end: string;
  readonly score: number;
};

export type GoalWeights = {
  readonly weights: Readonly<Record<string, number>>;
};

export type ProposedDecision = {
  readonly id: string;
  readonly summary: string;
  readonly confidence: Confidence;
  readonly schedulingRequested: boolean;
};

export type ReasoningResult = {
  readonly proposal: ProposedDecision;
  readonly rationale: string;
  readonly confidence: Confidence;
  readonly alternatives: readonly ProposedDecision[];
};

export type DecisionValidation = {
  readonly approved: boolean;
  readonly violations: readonly string[];
  readonly requiresConfirmation: boolean;
  readonly autonomyLevel: AutonomyLevel;
};

export type ProposedAction = {
  readonly type: string;
  readonly payload: Readonly<Record<string, unknown>>;
};

export type SchedulePatch = {
  readonly date: string;
  readonly blocks: readonly { blockId: BlockId; start: string; end: string }[];
};

export type DayPlan = {
  readonly date: string;
  readonly blocks: readonly { blockId: BlockId; taskId?: TaskId; start: string; end: string }[];
};

export type Recommendation = {
  readonly id: string;
  readonly category: string;
  readonly title: string;
  readonly confidence: Confidence;
};

export type AssistantMessage = {
  readonly text: string;
  readonly clarificationQuestion?: string;
};

export type HumanModelSnapshot = {
  readonly memberId: MemberId;
  readonly energyLevel?: number;
  readonly communicationStyle?: string;
};

export type HouseholdContext = {
  readonly householdId: string;
  readonly memberIds: readonly MemberId[];
};

export type PlanningContext = {
  readonly date: string;
  readonly taskCount: number;
  readonly blockCount: number;
  readonly immutable: true;
};

export type LifeEventContext = {
  readonly dayType: string;
  readonly adaptationHints: readonly string[];
};

export type KnowledgeResult = {
  readonly source: string;
  readonly confidence: Confidence;
  readonly facts: readonly { key: string; value: string }[];
};

export type NotificationItem = {
  readonly id: string;
  readonly channel: 'in_app' | 'push';
  readonly body: string;
};
