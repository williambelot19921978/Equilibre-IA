import type { EngineContractMeta, Result } from '../common/primitives.ts';
import { CONTRACT_VERSION_V1 } from '../common/primitives.ts';
import type { ConsumedEventBinding, EmittedEventBinding } from '../events/engine-events.ts';
import type { AvailableSlot, DayConstraint, GoalWeights, PlanningContext } from './shared-domain.ts';

export const AVAILABILITY_ENGINE_META: EngineContractMeta = {
  id: 'availability-engine',
  pipelineNumber: 8,
  contractVersion: CONTRACT_VERSION_V1,
  invariants: [
    'Planning First foundation — must respect hard constraints',
    'Must not suggest leisure activities',
  ],
};

export type AvailabilityInput = {
  readonly planningContext: PlanningContext;
  readonly constraints: readonly DayConstraint[];
  readonly goalWeights?: GoalWeights;
};

export type AvailabilityOutput = {
  readonly slots: readonly AvailableSlot[];
  readonly summary: string;
};

export type IAvailabilityEngine = {
  readonly meta: typeof AVAILABILITY_ENGINE_META;
  computeAvailability(input: AvailabilityInput): Result<AvailabilityOutput>;
};

export const AVAILABILITY_ENGINE_EVENTS = {
  emitted: [{ type: 'availability.computed', description: 'Slots computed' }] satisfies EmittedEventBinding[],
  consumed: [{ type: 'constraint.violation.detected', handler: 'sync' }] satisfies ConsumedEventBinding[],
};
