import type { EngineContractMeta, Result } from '../common/primitives.ts';
import { CONTRACT_VERSION_V1 } from '../common/primitives.ts';
import type { ConsumedEventBinding, EmittedEventBinding } from '../events/engine-events.ts';
import type { UniversalStrategy } from '../privacy/universal-signal.ts';
import type {
  AvailableSlot,
  ConversationContext,
  DayConstraint,
  GoalWeights,
  HouseholdContext,
  HumanModelSnapshot,
  IntentResult,
  LifeEventContext,
  PlanningContext,
  ReasoningResult,
} from './shared-domain.ts';

export const REASONING_ENGINE_META: EngineContractMeta = {
  id: 'reasoning-engine',
  pipelineNumber: 11,
  contractVersion: CONTRACT_VERSION_V1,
  invariants: [
    'Proposes — DecisionEngine validates',
    'Must not execute actions',
    'Arbitrates priorities — RecommendationEngine details activities',
  ],
};

export type ReasoningInput = {
  readonly conversationContext: ConversationContext;
  readonly intentResult: IntentResult;
  readonly humanModel: HumanModelSnapshot;
  readonly householdContext: HouseholdContext;
  readonly planningContext: PlanningContext;
  readonly constraints: readonly DayConstraint[];
  readonly availableSlots: readonly AvailableSlot[];
  readonly goalWeights: GoalWeights;
  readonly lifeEventContext?: LifeEventContext;
  readonly universalStrategies?: readonly UniversalStrategy[];
};

export type IReasoningEngine = {
  readonly meta: typeof REASONING_ENGINE_META;
  reason(input: ReasoningInput): Result<ReasoningResult>;
  explain(proposalId: string): string;
};

export const REASONING_ENGINE_EVENTS = {
  emitted: [
    { type: 'reasoning.completed', description: 'Reasoning finished' },
    { type: 'reasoning.overload.detected', description: 'Overload detected' },
  ] satisfies EmittedEventBinding[],
  consumed: [{ type: 'availability.computed', handler: 'sync' }] satisfies ConsumedEventBinding[],
};
