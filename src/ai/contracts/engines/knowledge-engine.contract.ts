import type { EngineContractMeta, Result } from '../common/primitives.ts';
import { CONTRACT_VERSION_V1 } from '../common/primitives.ts';
import type { ConsumedEventBinding, EmittedEventBinding } from '../events/engine-events.ts';
import type { AvailableSlot, KnowledgeResult, PlanningContext } from './shared-domain.ts';

export const KNOWLEDGE_ENGINE_META: EngineContractMeta = {
  id: 'knowledge-engine',
  pipelineNumber: 16,
  contractVersion: CONTRACT_VERSION_V1,
  invariants: [
    'External facts only — distinct from UniversalLearningEngine',
    'Planning First gate — never before availability analysis',
  ],
};

export type KnowledgeRequest = {
  readonly queryType: 'weather' | 'hours' | 'place' | 'definition';
  readonly query: string;
};

export type KnowledgeInput = {
  readonly request: KnowledgeRequest;
  readonly planningContext: PlanningContext;
  readonly availableSlots: readonly AvailableSlot[];
};

export type IKnowledgeEngine = {
  readonly meta: typeof KNOWLEDGE_ENGINE_META;
  fetchKnowledge(input: KnowledgeInput): Promise<Result<KnowledgeResult>>;
};

export const KNOWLEDGE_ENGINE_EVENTS = {
  emitted: [{ type: 'knowledge.fetched', description: 'External knowledge retrieved' }] satisfies EmittedEventBinding[],
  consumed: [{ type: 'availability.computed', handler: 'sync' }] satisfies ConsumedEventBinding[],
};
