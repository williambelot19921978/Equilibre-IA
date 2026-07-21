/**
 * In-memory ProposalTrace store — Sprint A4 (reversible, no Supabase).
 */

import type {
  IProposalTraceRepository,
  ProposalTrace,
  ProposalTraceLink,
  CorrelationQuery,
} from './proposalTraceRepository.ts';
import type {
  ProposalTraceStatus,
  TraceEngineRef,
} from '../contracts/traces/proposal-trace.ts';
import type { MemberId, OutcomeId, TraceId } from '../contracts/common/ids.ts';

export class InMemoryProposalTraceStore implements IProposalTraceRepository {
  private readonly traces = new Map<TraceId, ProposalTrace>();
  private readonly byProposalId = new Map<string, TraceId>();
  private readonly byCorrelationId = new Map<string, TraceId>();

  openTrace(
    input: Omit<ProposalTrace, 'updatedAt' | 'status'> & {
      status?: ProposalTraceStatus;
    },
  ): ProposalTrace {
    const now = new Date().toISOString();
    const trace: ProposalTrace = {
      ...input,
      status: input.status ?? 'initiated',
      updatedAt: now,
    };

    this.traces.set(trace.traceId, trace);
    this.byProposalId.set(String(trace.proposalId), trace.traceId);
    this.byCorrelationId.set(String(trace.correlationId), trace.traceId);

    return trace;
  }

  appendEngineStep(traceId: TraceId, step: TraceEngineRef): ProposalTrace {
    const existing = this.traces.get(traceId);
    if (!existing) {
      throw new Error(`Trace not found: ${String(traceId)}`);
    }

    const updated: ProposalTrace = {
      ...existing,
      engines: [...existing.engines, step],
      updatedAt: new Date().toISOString(),
    };

    this.traces.set(traceId, updated);
    return updated;
  }

  attachOutcome(
    traceId: TraceId,
    outcomeId: OutcomeId,
    status: ProposalTraceStatus,
  ): ProposalTrace {
    const existing = this.traces.get(traceId);
    if (!existing) {
      throw new Error(`Trace not found: ${String(traceId)}`);
    }

    const updated: ProposalTrace = {
      ...existing,
      status,
      refs: { ...existing.refs, outcomeId },
      updatedAt: new Date().toISOString(),
    };

    this.traces.set(traceId, updated);
    return updated;
  }

  resolve(query: CorrelationQuery): ProposalTraceLink | null {
    let traceId: TraceId | undefined;

    if (query.traceId) {
      traceId = query.traceId;
    } else if (query.proposalId) {
      traceId = this.byProposalId.get(String(query.proposalId));
    } else if (query.correlationId) {
      traceId = this.byCorrelationId.get(String(query.correlationId));
    }

    if (!traceId) return null;

    const trace = this.traces.get(traceId);
    if (!trace) return null;

    return {
      traceId: trace.traceId,
      proposalId: trace.proposalId,
      correlationId: trace.correlationId,
    };
  }

  getById(traceId: TraceId): ProposalTrace | null {
    return this.traces.get(traceId) ?? null;
  }

  updateStatus(traceId: TraceId, status: ProposalTraceStatus): ProposalTrace {
    const existing = this.traces.get(traceId);
    if (!existing) {
      throw new Error(`Trace not found: ${String(traceId)}`);
    }

    const updated: ProposalTrace = {
      ...existing,
      status,
      updatedAt: new Date().toISOString(),
    };

    this.traces.set(traceId, updated);
    return updated;
  }

  deleteByMemberId(memberId: MemberId): number {
    let removed = 0;

    for (const [traceId, trace] of this.traces.entries()) {
      if (trace.memberId !== memberId) continue;
      this.removeIndexes(trace);
      this.traces.delete(traceId);
      removed += 1;
    }

    return removed;
  }

  deleteByTraceId(traceId: TraceId): boolean {
    const trace = this.traces.get(traceId);
    if (!trace) return false;
    this.removeIndexes(trace);
    this.traces.delete(traceId);
    return true;
  }

  listTraceSummaries(): readonly {
    traceId: TraceId;
    proposalId: string;
    status: string;
    memberId: MemberId;
  }[] {
    return [...this.traces.values()].map((trace) => ({
      traceId: trace.traceId,
      proposalId: String(trace.proposalId),
      status: trace.status,
      memberId: trace.memberId,
    }));
  }

  clear(): void {
    this.traces.clear();
    this.byProposalId.clear();
    this.byCorrelationId.clear();
  }

  private removeIndexes(trace: ProposalTrace): void {
    this.byProposalId.delete(String(trace.proposalId));
    this.byCorrelationId.delete(String(trace.correlationId));
  }
}
