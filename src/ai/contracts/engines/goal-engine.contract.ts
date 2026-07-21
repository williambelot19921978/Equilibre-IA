import type { EngineContractMeta, Result } from '../common/primitives.ts';
import { CONTRACT_VERSION_V1 } from '../common/primitives.ts';
import type { MemberId } from '../common/ids.ts';
import type { ConsumedEventBinding, EmittedEventBinding } from '../events/engine-events.ts';
import type { GoalFeedbackSignal } from '../privacy/personal-signal.ts';
import type { AvailabilityOutput } from './availability-engine.contract.ts';
import type { GoalWeights, PlanningContext } from './shared-domain.ts';

export const GOAL_ENGINE_META: EngineContractMeta = {
  id: 'goal-engine',
  pipelineNumber: 9,
  contractVersion: CONTRACT_VERSION_V1,
  invariants: [
    'Must not sacrifice rest for productivity',
    'Must not mutate planning directly',
  ],
};

export type MissionSuggestion = {
  readonly missionKey: string;
  readonly summary: string;
};

export type GoalInput = {
  readonly memberId: MemberId;
  readonly planningContext?: PlanningContext;
  readonly availability?: AvailabilityOutput;
};

export type IGoalEngine = {
  readonly meta: typeof GOAL_ENGINE_META;
  computeWeights(input: GoalInput): Result<GoalWeights>;
  suggestMission(input: GoalInput): Result<MissionSuggestion>;
  ingestFeedback(signals: readonly GoalFeedbackSignal[]): Result<void>;
};

export const GOAL_ENGINE_EVENTS = {
  emitted: [
    { type: 'goal.updated', description: 'Goal weights updated' },
    { type: 'goal.alert', description: 'Goal imbalance alert' },
  ] satisfies EmittedEventBinding[],
  consumed: [{ type: 'outcome.behaviorSignal.emitted', handler: 'async' }] satisfies ConsumedEventBinding[],
};
