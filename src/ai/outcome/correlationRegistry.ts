/**
 * In-memory correlation registry — links proposals to task/calendar entities.
 * Sprint A4 pilot only; replaceable by persistent store later.
 */

import type { ProposalId, TraceId, CorrelationId } from '../contracts/common/ids.ts';

export type EntityCorrelation = {
  readonly proposalId: ProposalId;
  readonly traceId: TraceId;
  readonly correlationId: CorrelationId;
  readonly taskId?: string;
  readonly calendarItemId?: string;
};

export class CorrelationRegistry {
  private readonly byProposalId = new Map<string, EntityCorrelation>();
  private readonly byTaskId = new Map<string, EntityCorrelation>();
  private readonly byCalendarItemId = new Map<string, EntityCorrelation>();

  register(correlation: EntityCorrelation): void {
    this.byProposalId.set(String(correlation.proposalId), correlation);
    if (correlation.taskId) {
      this.byTaskId.set(correlation.taskId, correlation);
    }
    if (correlation.calendarItemId) {
      this.byCalendarItemId.set(correlation.calendarItemId, correlation);
    }
  }

  linkTask(proposalId: ProposalId, taskId: string): void {
    const existing = this.byProposalId.get(String(proposalId));
    if (!existing) return;
    const updated = { ...existing, taskId };
    this.register(updated);
  }

  linkCalendarItem(proposalId: ProposalId, calendarItemId: string): void {
    const existing = this.byProposalId.get(String(proposalId));
    if (!existing) return;
    const updated = { ...existing, calendarItemId };
    this.register(updated);
  }

  resolveByProposalId(proposalId: ProposalId): EntityCorrelation | null {
    return this.byProposalId.get(String(proposalId)) ?? null;
  }

  resolveByTaskId(taskId: string): EntityCorrelation | null {
    return this.byTaskId.get(taskId) ?? null;
  }

  resolveByCalendarItemId(calendarItemId: string): EntityCorrelation | null {
    return this.byCalendarItemId.get(calendarItemId) ?? null;
  }

  clear(): void {
    this.byProposalId.clear();
    this.byTaskId.clear();
    this.byCalendarItemId.clear();
  }
}
