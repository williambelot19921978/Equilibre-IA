/**
 * Outcome event taxonomy — extensible, versioned.
 * @see architecture/contracts/outcome-observation-engine.md
 *
 * Principe : un outcome observé n'implique pas un succès de vie.
 */

import type { ContractVersion } from '../common/primitives.ts';
import type {
  CorrelationId,
  EventId,
  MemberId,
  ProposalId,
  TraceId,
} from '../common/ids.ts';
import type { SignalProvenance } from '../common/consent.ts';

export const OUTCOME_EVENT_SCHEMA_VERSION = '1.0.0' as ContractVersion;

export type OutcomeEventType =
  | 'proposal.presented'
  | 'proposal.accepted'
  | 'proposal.rejected'
  | 'proposal.dismissed'
  | 'proposal.modified'
  | 'action.executed'
  | 'action.failed'
  | 'task.started'
  | 'task.completed'
  | 'task.skipped'
  | 'task.rescheduled'
  | 'recommendation.followed'
  | 'recommendation.ignored'
  | 'user.corrected_ai'
  | 'user.reported_helpful'
  | 'user.reported_unhelpful';

export type OutcomeValence =
  | 'neutral'
  | 'positive_signal'
  | 'negative_signal'
  | 'unknown';

/** Minimal payload — no full conversation content */
export type OutcomeEventPayload = {
  readonly proposalId?: ProposalId;
  readonly traceId?: TraceId;
  readonly correlationId?: CorrelationId;
  readonly memberId: MemberId;
  readonly valence: OutcomeValence;
  readonly metadata?: Readonly<Record<string, string | number | boolean>>;
};

export type OutcomeEvent = {
  readonly schemaVersion: ContractVersion;
  readonly eventId: EventId;
  readonly type: OutcomeEventType;
  readonly occurredAt: string;
  readonly provenance: SignalProvenance;
  readonly payload: OutcomeEventPayload;
};

export const OUTCOME_EVENT_TYPES = [
  'proposal.presented',
  'proposal.accepted',
  'proposal.rejected',
  'proposal.dismissed',
  'proposal.modified',
  'action.executed',
  'action.failed',
  'task.started',
  'task.completed',
  'task.skipped',
  'task.rescheduled',
  'recommendation.followed',
  'recommendation.ignored',
  'user.corrected_ai',
  'user.reported_helpful',
  'user.reported_unhelpful',
] as const satisfies readonly OutcomeEventType[];

export function isOutcomeEventType(value: string): value is OutcomeEventType {
  return (OUTCOME_EVENT_TYPES as readonly string[]).includes(value);
}
