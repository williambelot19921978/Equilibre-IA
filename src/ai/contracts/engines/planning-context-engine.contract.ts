import type { EngineContractMeta, Result } from '../common/primitives.ts';
import { CONTRACT_VERSION_V1 } from '../common/primitives.ts';
import type { ConsumedEventBinding, EmittedEventBinding } from '../events/engine-events.ts';
import type { HouseholdContext, HumanModelSnapshot, PlanningContext } from './shared-domain.ts';

export const PLANNING_CONTEXT_ENGINE_META: EngineContractMeta = {
  id: 'planning-context-engine',
  pipelineNumber: 6,
  contractVersion: CONTRACT_VERSION_V1,
  invariants: [
    'Read-only snapshot — no mutations',
    'Must not compute constraints or availability',
  ],
};

export type BuildPlanningContextInput = {
  readonly date: string;
  readonly humanModel: HumanModelSnapshot;
  readonly householdContext: HouseholdContext;
};

export type IPlanningContextEngine = {
  readonly meta: typeof PLANNING_CONTEXT_ENGINE_META;
  buildContext(input: BuildPlanningContextInput): Result<PlanningContext>;
};

export const PLANNING_CONTEXT_ENGINE_EVENTS = {
  emitted: [{ type: 'planningContext.built', description: 'Snapshot built' }] satisfies EmittedEventBinding[],
  consumed: [
    { type: 'task.updated', handler: 'async' },
    { type: 'block.updated', handler: 'async' },
  ] satisfies ConsumedEventBinding[],
};
