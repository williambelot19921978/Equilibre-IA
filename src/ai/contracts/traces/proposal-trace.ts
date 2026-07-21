/**
 * proposalTrace — trace decisions, not the user's life.
 *
 * Correlates: context → intent → constraints → reasoning → decision →
 * proposal → action → observed outcome → emitted signals.
 *
 * Stores minimal references only — no full conversation dumps.
 */

import type { ContractVersion, EngineId } from '../common/primitives.ts';
import type { ConsentScope } from '../common/consent.ts';
import type {
  CorrelationId,
  DecisionId,
  MemberId,
  OutcomeId,
  ProposalId,
  TraceId,
  TurnId,
} from '../common/ids.ts';
import type { MemoryRoute } from '../common/consent.ts';

export const PROPOSAL_TRACE_SCHEMA_VERSION = '1.0.0' as ContractVersion;

export type ProposalType =
  | 'conversation_reply'
  | 'nlp_action'
  | 'schedule_patch'
  | 'recommendation'
  | 'notification'
  | 'language_learning'
  | 'pending_action';

export type ProposalTraceStatus =
  | 'initiated'
  | 'presented'
  | 'awaiting_confirmation'
  | 'accepted'
  | 'rejected'
  | 'modified'
  | 'executed'
  | 'failed'
  | 'outcome_observed'
  | 'closed';

export type TraceRetentionPolicy = {
  readonly ttlDays: number;
  readonly purgeContentAfterClose: boolean;
};

export type TraceEngineRef = {
  readonly engineId: EngineId;
  readonly contractVersion: ContractVersion;
  readonly outputRef?: string;
};

/** Minimal anchors — IDs and types, not private content */
export type ProposalTraceRefs = {
  readonly turnId?: TurnId;
  readonly intentRef?: string;
  readonly constraintSetRef?: string;
  readonly reasoningRef?: string;
  readonly decisionId?: DecisionId;
  readonly schedulePatchRef?: string;
  readonly actionRef?: string;
  readonly outcomeId?: OutcomeId;
};

export type ProposalTrace = {
  readonly schemaVersion: ContractVersion;
  readonly traceId: TraceId;
  readonly correlationId: CorrelationId;
  readonly proposalId: ProposalId;
  readonly memberId: MemberId;
  readonly proposalType: ProposalType;
  readonly status: ProposalTraceStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly engines: readonly TraceEngineRef[];
  readonly refs: ProposalTraceRefs;
  readonly consentScopes: readonly ConsentScope[];
  readonly retention: TraceRetentionPolicy;
  readonly memoryRoute?: MemoryRoute;
};

export type ProposalTraceLink = {
  readonly traceId: TraceId;
  readonly proposalId: ProposalId;
  readonly correlationId: CorrelationId;
};

export type CorrelationQuery = {
  readonly proposalId?: ProposalId;
  readonly traceId?: TraceId;
  readonly correlationId?: CorrelationId;
};

export type IProposalTraceStore = {
  /** Create minimal trace at proposal time */
  openTrace(input: Omit<ProposalTrace, 'updatedAt' | 'status'> & { status?: ProposalTraceStatus }): ProposalTrace;

  /** Append engine step — refs only */
  appendEngineStep(traceId: TraceId, step: TraceEngineRef): ProposalTrace;

  /** Link observed outcome */
  attachOutcome(traceId: TraceId, outcomeId: OutcomeId, status: ProposalTraceStatus): ProposalTrace;

  /** Resolve correlation without loading private payloads */
  resolve(query: CorrelationQuery): ProposalTraceLink | null;
};
