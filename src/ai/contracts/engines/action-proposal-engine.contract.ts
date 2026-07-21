import type { EngineContractMeta, Result } from '../common/primitives.ts';
import { CONTRACT_VERSION_V1 } from '../common/primitives.ts';
import type { ProposalId } from '../common/ids.ts';
import type { ConsumedEventBinding, EmittedEventBinding } from '../events/engine-events.ts';
import type { ProposalTraceLink } from '../traces/proposal-trace.ts';
import type {
  ConversationContext,
  DecisionValidation,
  IntentResult,
  PendingAction,
  ProposedAction,
  ReasoningResult,
} from './shared-domain.ts';

export const ACTION_PROPOSAL_ENGINE_META: EngineContractMeta = {
  id: 'action-proposal-engine',
  pipelineNumber: 13,
  contractVersion: CONTRACT_VERSION_V1,
  invariants: [
    'Must not call Supabase or services directly',
    'Must attach proposalTrace metadata',
    'Must not execute without DecisionEngine approval',
  ],
};

export type ActionProposalResult = {
  readonly proposedActions: readonly ProposedAction[];
  readonly pendingAction?: PendingAction;
  readonly proposalTrace: ProposalTraceLink;
  readonly proposalId: ProposalId;
};

export type ResolveActionsInput = {
  readonly intentResult: IntentResult;
  readonly decisionValidation: DecisionValidation;
  readonly reasoningResult: ReasoningResult;
  readonly conversationContext: ConversationContext;
};

export type IActionProposalEngine = {
  readonly meta: typeof ACTION_PROPOSAL_ENGINE_META;
  resolveActions(input: ResolveActionsInput): Result<ActionProposalResult>;
  buildConfirmationPrompt(actions: readonly ProposedAction[]): string;
};

export const ACTION_PROPOSAL_ENGINE_EVENTS = {
  emitted: [
    { type: 'action.proposed', description: 'Actions proposed' },
    { type: 'action.confirmation.requested', description: 'Confirmation requested' },
  ] satisfies EmittedEventBinding[],
  consumed: [{ type: 'decision.approved', handler: 'sync' }] satisfies ConsumedEventBinding[],
};
