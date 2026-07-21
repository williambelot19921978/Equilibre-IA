import type { EngineContractMeta, Result } from '../common/primitives.ts';
import { CONTRACT_VERSION_V1 } from '../common/primitives.ts';
import type { ConsumedEventBinding, EmittedEventBinding } from '../events/engine-events.ts';
import type { HouseholdContext, LifeEventContext } from './shared-domain.ts';

export const LIFE_EVENT_ENGINE_META: EngineContractMeta = {
  id: 'life-event-engine',
  pipelineNumber: 10,
  contractVersion: CONTRACT_VERSION_V1,
  invariants: [
    'Must not generate leisure before Planning First',
    'Must not mutate planning without ActionProposal',
  ],
};

export type LifeEventInput = {
  readonly date: string;
  readonly householdContext: HouseholdContext;
  readonly lifeEvents: readonly { type: string; start: string; end?: string }[];
};

export type ILifeEventEngine = {
  readonly meta: typeof LIFE_EVENT_ENGINE_META;
  buildContext(input: LifeEventInput): Result<LifeEventContext>;
};

export const LIFE_EVENT_ENGINE_EVENTS = {
  emitted: [{ type: 'lifeEvent.declared', description: 'Life event active' }] satisfies EmittedEventBinding[],
  consumed: [] satisfies ConsumedEventBinding[],
};
