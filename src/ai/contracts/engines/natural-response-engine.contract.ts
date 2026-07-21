import type { EngineContractMeta, Result } from '../common/primitives.ts';
import { CONTRACT_VERSION_V1 } from '../common/primitives.ts';
import type { ConsumedEventBinding, EmittedEventBinding } from '../events/engine-events.ts';
import type {
  AssistantMessage,
  HumanModelSnapshot,
  LanguageHint,
  ProposedAction,
  ReasoningResult,
  Recommendation,
} from './shared-domain.ts';

export const NATURAL_RESPONSE_ENGINE_META: EngineContractMeta = {
  id: 'natural-response-engine',
  pipelineNumber: 17,
  contractVersion: CONTRACT_VERSION_V1,
  invariants: [
    'Must not invent unmemorized facts',
    'Must not execute actions',
    'Formats response — ActionProposalEngine proposes',
  ],
};

export type NaturalResponseInput = {
  readonly reasoningResult: ReasoningResult;
  readonly proposedActions: readonly ProposedAction[];
  readonly recommendations?: readonly Recommendation[];
  readonly languageHints?: readonly LanguageHint[];
  readonly humanModel: HumanModelSnapshot;
};

export type INaturalResponseEngine = {
  readonly meta: typeof NATURAL_RESPONSE_ENGINE_META;
  formatResponse(input: NaturalResponseInput): Result<AssistantMessage>;
  buildClarification(question: string): AssistantMessage;
};

export const NATURAL_RESPONSE_ENGINE_EVENTS = {
  emitted: [{ type: 'response.formatted', description: 'Assistant message ready' }] satisfies EmittedEventBinding[],
  consumed: [
    { type: 'action.proposed', handler: 'sync' },
    { type: 'intent.ambiguous', handler: 'sync' },
  ] satisfies ConsumedEventBinding[],
};
