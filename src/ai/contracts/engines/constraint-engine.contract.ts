import type { EngineContractMeta, Result } from '../common/primitives.ts';
import { CONTRACT_VERSION_V1 } from '../common/primitives.ts';
import type { ConsumedEventBinding, EmittedEventBinding } from '../events/engine-events.ts';
import type { DayConstraint, HouseholdContext, HumanModelSnapshot, PlanningContext } from './shared-domain.ts';
import type { LifeEventContext } from './shared-domain.ts';

export const CONSTRAINT_ENGINE_META: EngineContractMeta = {
  id: 'constraint-engine',
  pipelineNumber: 7,
  contractVersion: CONTRACT_VERSION_V1,
  invariants: [
    'Deterministic only — no LLM bypass',
    'Hard constraints cannot be removed without confirmation',
  ],
};

export type ConstraintInput = {
  readonly planningContext: PlanningContext;
  readonly humanModel: HumanModelSnapshot;
  readonly householdContext: HouseholdContext;
  readonly lifeEventContext?: LifeEventContext;
};

export type ConstraintOutput = {
  readonly constraints: readonly DayConstraint[];
  readonly alerts: readonly string[];
};

export type IConstraintEngine = {
  readonly meta: typeof CONSTRAINT_ENGINE_META;
  buildConstraints(input: ConstraintInput): Result<ConstraintOutput>;
};

export const CONSTRAINT_ENGINE_EVENTS = {
  emitted: [{ type: 'constraint.violation.detected', description: 'Constraint alert' }] satisfies EmittedEventBinding[],
  consumed: [{ type: 'planningContext.built', handler: 'sync' }] satisfies ConsumedEventBinding[],
};
