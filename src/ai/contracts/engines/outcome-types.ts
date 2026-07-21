import type { MemoryRoute } from '../common/consent.ts';
import type { CorrelationId, OutcomeId, ProposalId, TraceId } from '../common/ids.ts';

export type CorrelationConfidence = 'observed' | 'correlated' | 'causal_hypothesis';

export type ObservedOutcome = {
  readonly outcomeId: OutcomeId;
  readonly observedAt: string;
  readonly valence: 'neutral' | 'positive_signal' | 'negative_signal' | 'unknown';
  readonly note?: string;
};

export type CorrelationResult = {
  readonly proposalId: ProposalId;
  readonly traceId?: TraceId;
  readonly correlationId: CorrelationId;
  readonly confidence: CorrelationConfidence;
  readonly route: MemoryRoute;
  /** Explicit — correlation ≠ causation */
  readonly causalClaim: false | 'hypothesis_only';
};

export type OutcomeBatch = {
  readonly batchId: string;
  readonly from: string;
  readonly to: string;
};

export type OutcomeMetrics = {
  readonly acceptanceRate: number;
  readonly dismissalRate: number;
  readonly executionFailureRate: number;
  readonly sampleSize: number;
};

export type OutcomeRoute = MemoryRoute;
