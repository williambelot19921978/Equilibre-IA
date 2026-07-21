/**
 * ProposalTrace repository port — Sprint A4.
 * Abstracts storage so persistent backend can replace in-memory later.
 */

import type {
  CorrelationQuery,
  IProposalTraceStore,
  ProposalTrace,
  ProposalTraceLink,
} from '../contracts/traces/proposal-trace.ts';
import type { MemberId, TraceId } from '../contracts/common/ids.ts';

export type IProposalTraceRepository = IProposalTraceStore & {
  /** Retrieve full trace by id */
  getById(traceId: TraceId): ProposalTrace | null;

  /** Purge traces for member — contract for future persistent stores */
  deleteByMemberId(memberId: MemberId): number;

  /** Purge single trace */
  deleteByTraceId(traceId: TraceId): boolean;

  /** List traces for observability — ids and status only */
  listTraceSummaries(): readonly {
    traceId: TraceId;
    proposalId: string;
    status: string;
    memberId: MemberId;
  }[];
};

export type { CorrelationQuery, ProposalTrace, ProposalTraceLink };
