import type { EngineContractMeta, Result } from '../common/primitives.ts';
import { CONTRACT_VERSION_V1 } from '../common/primitives.ts';
import type { MemberId, SessionId, TurnId } from '../common/ids.ts';
import type { ConsumedEventBinding, EmittedEventBinding } from '../events/engine-events.ts';
import type { ConversationContext, PendingAction } from './shared-domain.ts';

export const CONVERSATION_ENGINE_META: EngineContractMeta = {
  id: 'conversation-engine',
  pipelineNumber: 1,
  contractVersion: CONTRACT_VERSION_V1,
  invariants: [
    'Must not parse intents directly',
    'Must not execute planning mutations',
    'Must not call planning engines directly',
  ],
};

export type ProcessTurnInput = {
  readonly userMessage: string;
  readonly sessionId: SessionId;
  readonly memberId: MemberId;
  readonly pendingAction?: PendingAction;
};

export type ProcessTurnOutput = {
  readonly context: ConversationContext;
  readonly turnId: TurnId;
};

export type IConversationEngine = {
  readonly meta: typeof CONVERSATION_ENGINE_META;
  processTurn(input: ProcessTurnInput): Promise<Result<ProcessTurnOutput>>;
  getContext(sessionId: SessionId): ConversationContext | null;
  setPendingAction(sessionId: SessionId, action: PendingAction): void;
  clearPendingAction(sessionId: SessionId): void;
};

export const CONVERSATION_ENGINE_EVENTS = {
  emitted: [
    { type: 'conversation.turn.started', description: 'Turn processing started' },
    { type: 'conversation.turn.completed', description: 'Turn completed' },
    { type: 'conversation.pending.created', description: 'Pending action created' },
    { type: 'conversation.pending.resolved', description: 'Pending resolved' },
  ] satisfies EmittedEventBinding[],
  consumed: [
    { type: 'session.expired', handler: 'sync' },
    { type: 'member.switched', handler: 'sync' },
  ] satisfies ConsumedEventBinding[],
};
