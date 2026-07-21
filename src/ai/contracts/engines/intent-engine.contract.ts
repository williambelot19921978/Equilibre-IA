import type { EngineContractMeta, Result } from '../common/primitives.ts';
import { CONTRACT_VERSION_V1 } from '../common/primitives.ts';
import type { ConsumedEventBinding, EmittedEventBinding } from '../events/engine-events.ts';
import type { ConversationContext, IntentResult, LanguageHint } from './shared-domain.ts';

export const INTENT_ENGINE_META: EngineContractMeta = {
  id: 'intent-engine',
  pipelineNumber: 2,
  contractVersion: CONTRACT_VERSION_V1,
  invariants: [
    'PLM hints are signals — IntentEngine is final arbiter on conflict',
    'Must not execute planning actions',
    'Must not resolve personal expressions (PLM upstream)',
  ],
};

export type ParseInput = {
  readonly message: string;
  readonly conversationContext: ConversationContext;
  readonly languageHints?: readonly LanguageHint[];
};

export type ClarificationRequest = {
  readonly question: string;
  readonly candidates: readonly string[];
};

export type IIntentEngine = {
  readonly meta: typeof INTENT_ENGINE_META;
  parse(input: ParseInput): Result<IntentResult>;
  detectAmbiguity(result: IntentResult): ClarificationRequest | null;
};

export const INTENT_ENGINE_EVENTS = {
  emitted: [
    { type: 'intent.resolved', description: 'Intent identified' },
    { type: 'intent.ambiguous', description: 'Ambiguity detected' },
    { type: 'intent.unknown', description: 'Unknown intent' },
  ] satisfies EmittedEventBinding[],
  consumed: [{ type: 'conversation.turn.started', handler: 'sync' }] satisfies ConsumedEventBinding[],
};
