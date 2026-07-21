/**
 * ContractOutcomeObservationEngine — Sprint A4 minimal implementation.
 */

import type { Result } from '../../contracts/common/primitives.ts';
import { asConfidence, contractError } from '../../contracts/common/primitives.ts';
import type { MemberId, ProposalId } from '../../contracts/common/ids.ts';
import {
  asCorrelationId,
  asHouseholdId,
  asOutcomeId,
  asProposalId,
  asTraceId,
} from '../../contracts/common/ids.ts';
import type { IOutcomeObservationEngine } from '../../contracts/engines/outcome-observation-engine.contract.ts';
import { OUTCOME_OBSERVATION_ENGINE_META } from '../../contracts/engines/outcome-observation-engine.contract.ts';
import type {
  CorrelationResult,
  ObservedOutcome,
  OutcomeBatch,
  OutcomeMetrics,
  OutcomeRoute,
} from '../../contracts/engines/outcome-types.ts';
import type { OutcomeEvent } from '../../contracts/events/outcome-events.ts';
import {
  OUTCOME_EVENT_SCHEMA_VERSION,
  isOutcomeEventType,
} from '../../contracts/events/outcome-events.ts';
import { CONTRACT_VERSION_V1 } from '../../contracts/common/primitives.ts';
import type { BehaviorSignal, GoalFeedbackSignal, LanguageConfirmationSignal } from '../../contracts/privacy/personal-signal.ts';
import type { AnonymizedCandidate } from '../../contracts/privacy/universal-signal.ts';
import type { InMemoryProposalTraceStore } from '../../traces/inMemoryProposalTraceStore.ts';
import type { IPersonalSignalSink } from '../../outcome/personalSignalSink.ts';
import type { CorrelationRegistry } from '../../outcome/correlationRegistry.ts';
import {
  A4_SUPPORTED_EVENT_TYPES,
  buildSignalType,
  getOutcomeSemantics,
  isA4SupportedEventType,
  type CorrelationStatus,
  type EvidenceType,
} from './outcomeSemantics.ts';
import { OutcomeObservability } from './outcomeObservability.ts';

const DEFAULT_RETENTION = {
  ttlDays: 30,
  purgeContentAfterClose: true,
} as const;

const DEFAULT_CONSENT = ['personal_memory'] as const;

function mapTraceStatus(
  eventType: OutcomeEvent['type'],
): 'presented' | 'accepted' | 'rejected' | 'closed' | 'outcome_observed' {
  switch (eventType) {
    case 'proposal.presented':
      return 'presented';
    case 'proposal.accepted':
      return 'accepted';
    case 'proposal.rejected':
      return 'rejected';
    case 'proposal.dismissed':
      return 'closed';
    default:
      return 'outcome_observed';
  }
}

function computeConfidence(
  correlationStatus: CorrelationStatus,
  isExplicitFeedback: boolean,
): number {
  if (isExplicitFeedback) return 0.85;
  if (correlationStatus === 'correlated') return 0.75;
  if (correlationStatus === 'missing_trace') return 0.35;
  return 0.5;
}

export class ContractOutcomeObservationEngine implements IOutcomeObservationEngine {
  readonly meta = OUTCOME_OBSERVATION_ENGINE_META;

  private readonly behaviorSignals = new Map<MemberId, BehaviorSignal[]>();
  private readonly traceStore: InMemoryProposalTraceStore;
  private readonly signalSink: IPersonalSignalSink;
  private readonly correlationRegistry: CorrelationRegistry;
  readonly observability: OutcomeObservability;
  private acceptanceCount = 0;
  private dismissalCount = 0;
  private presentedCount = 0;

  constructor(
    traceStore: InMemoryProposalTraceStore,
    signalSink: IPersonalSignalSink,
    correlationRegistry: CorrelationRegistry,
    observability: OutcomeObservability,
  ) {
    this.traceStore = traceStore;
    this.signalSink = signalSink;
    this.correlationRegistry = correlationRegistry;
    this.observability = observability;
  }

  recordOutcome(event: OutcomeEvent): Result<void> {
    this.observability.recordReceived();

    const validation = this.validateEvent(event);
    if (!validation.ok) {
      this.observability.recordRejected();
      return validation;
    }

    this.observability.recordValid();

    if (!isA4SupportedEventType(event.type)) {
      return { ok: true, value: undefined };
    }

    const semantics = getOutcomeSemantics(event.type);

    if (event.type === 'proposal.presented') {
      this.handleProposalPresented(event);
      return { ok: true, value: undefined };
    }

    const correlation = this.resolveCorrelation(event);
    if (correlation.status === 'correlated') {
      this.observability.recordCorrelationSucceeded();
    } else if (
      correlation.status === 'missing_trace' ||
      correlation.status === 'missing_proposal'
    ) {
      this.observability.recordCorrelationMissing();
      if (correlation.status === 'missing_trace') {
        this.observability.recordTraceNotFound();
      }
    }

    this.updateTraceFromEvent(event, correlation.traceId);

    const signal = this.buildBehaviorSignal(event, semantics.evidenceType, correlation.status);
    this.emitPersonalSignal(signal);

    if (event.type === 'proposal.accepted') this.acceptanceCount += 1;
    if (event.type === 'proposal.dismissed') this.dismissalCount += 1;

    return { ok: true, value: undefined };
  }

  correlate(proposalId: ProposalId, outcome: ObservedOutcome): Result<CorrelationResult> {
    const link = this.traceStore.resolve({ proposalId });
    if (!link) {
      this.observability.recordCorrelationMissing();
      return {
        ok: false,
        error: contractError(
          'outcome-observation-engine',
          'CORRELATION_FAILED',
          `No trace for proposal ${String(proposalId)}`,
        ),
      };
    }

    this.traceStore.attachOutcome(link.traceId, outcome.outcomeId, 'outcome_observed');
    this.observability.recordCorrelationSucceeded();

    return {
      ok: true,
      value: {
        proposalId,
        traceId: link.traceId,
        correlationId: link.correlationId,
        confidence: 'correlated',
        route: 'personal_only',
        causalClaim: false,
      },
    };
  }

  emitBehaviorSignals(memberId: MemberId): readonly BehaviorSignal[] {
    return this.behaviorSignals.get(memberId) ?? [];
  }

  emitGoalFeedback(_memberId: MemberId): readonly GoalFeedbackSignal[] {
    return [];
  }

  emitLanguageConfirmations(_memberId: MemberId): readonly LanguageConfirmationSignal[] {
    return [];
  }

  emitAnonymizedCandidates(_batch: OutcomeBatch): readonly AnonymizedCandidate[] {
    return [];
  }

  classifyRoute(_event: OutcomeEvent): OutcomeRoute {
    return 'personal_only';
  }

  getEffectivenessMetrics(scope: 'household' | 'product'): OutcomeMetrics {
    const sampleSize = this.presentedCount;
    return {
      acceptanceRate: sampleSize > 0 ? this.acceptanceCount / sampleSize : 0,
      dismissalRate: sampleSize > 0 ? this.dismissalCount / sampleSize : 0,
      executionFailureRate: 0,
      sampleSize: scope === 'product' ? sampleSize : sampleSize,
    };
  }

  private validateEvent(event: OutcomeEvent): Result<void> {
    if (event.schemaVersion !== OUTCOME_EVENT_SCHEMA_VERSION) {
      return {
        ok: false,
        error: contractError(
          'outcome-observation-engine',
          'INVALID_INPUT',
          'Invalid outcome event schema version',
        ),
      };
    }

    if (!isOutcomeEventType(event.type)) {
      return {
        ok: false,
        error: contractError(
          'outcome-observation-engine',
          'INVALID_INPUT',
          `Unknown outcome event type: ${event.type}`,
        ),
      };
    }

    if (!event.payload.memberId) {
      return {
        ok: false,
        error: contractError(
          'outcome-observation-engine',
          'INVALID_INPUT',
          'memberId is required',
        ),
      };
    }

    return { ok: true, value: undefined };
  }

  private handleProposalPresented(event: OutcomeEvent): void {
    const proposalId =
      event.payload.proposalId ??
      asProposalId(`generated-${event.eventId}`);

    const correlationId =
      event.payload.correlationId ??
      asCorrelationId(crypto.randomUUID());

    const traceId =
      event.payload.traceId ?? asTraceId(crypto.randomUUID());

    const now = event.occurredAt;

    this.traceStore.openTrace({
      schemaVersion: CONTRACT_VERSION_V1,
      traceId,
      correlationId,
      proposalId,
      memberId: event.payload.memberId,
      proposalType: 'recommendation',
      status: 'presented',
      createdAt: now,
      engines: [
        {
          engineId: 'recommendation-engine',
          contractVersion: CONTRACT_VERSION_V1,
        },
        {
          engineId: 'outcome-observation-engine',
          contractVersion: CONTRACT_VERSION_V1,
        },
      ],
      refs: {},
      consentScopes: [...DEFAULT_CONSENT],
      retention: DEFAULT_RETENTION,
      memoryRoute: 'personal_only',
    });

    this.correlationRegistry.register({
      proposalId,
      traceId,
      correlationId,
    });

    this.presentedCount += 1;

    const semantics = getOutcomeSemantics('proposal.presented');
    const signal = this.buildBehaviorSignal(
      event,
      semantics.evidenceType,
      'correlated',
    );
    this.emitPersonalSignal(signal);
  }

  private resolveCorrelation(event: OutcomeEvent): {
    status: CorrelationStatus;
    traceId?: ReturnType<typeof asTraceId>;
    proposalId?: ProposalId;
  } {
    const proposalId = event.payload.proposalId;
    const traceId = event.payload.traceId;

    if (traceId) {
      const trace = this.traceStore.getById(traceId);
      if (trace) {
        return { status: 'correlated', traceId, proposalId: trace.proposalId };
      }
      return { status: 'missing_trace', traceId, proposalId };
    }

    if (proposalId) {
      const link = this.traceStore.resolve({ proposalId });
      if (link) {
        return {
          status: 'correlated',
          traceId: link.traceId,
          proposalId: link.proposalId,
        };
      }
      return { status: 'missing_trace', proposalId };
    }

    const taskId =
      typeof event.payload.metadata?.taskId === 'string'
        ? event.payload.metadata.taskId
        : undefined;
    const calendarItemId =
      typeof event.payload.metadata?.calendarItemId === 'string'
        ? event.payload.metadata.calendarItemId
        : undefined;

    if (taskId) {
      const entity = this.correlationRegistry.resolveByTaskId(taskId);
      if (entity) {
        return {
          status: 'correlated',
          traceId: entity.traceId,
          proposalId: entity.proposalId,
        };
      }
    }

    if (calendarItemId) {
      const entity = this.correlationRegistry.resolveByCalendarItemId(calendarItemId);
      if (entity) {
        return {
          status: 'correlated',
          traceId: entity.traceId,
          proposalId: entity.proposalId,
        };
      }
    }

    if (
      event.type.startsWith('task.') ||
      event.type.startsWith('user.reported_')
    ) {
      return { status: 'missing_trace' };
    }

    return { status: 'not_applicable' };
  }

  private updateTraceFromEvent(
    event: OutcomeEvent,
    traceId?: ReturnType<typeof asTraceId>,
  ): void {
    if (!traceId) return;

    const existing = this.traceStore.getById(traceId);
    if (!existing) {
      this.observability.recordTraceNotFound();
      return;
    }

    if (event.type.startsWith('proposal.')) {
      this.traceStore.updateStatus(traceId, mapTraceStatus(event.type));
      return;
    }

    if (event.type.startsWith('task.') || event.type.startsWith('user.reported_')) {
      this.traceStore.attachOutcome(
        traceId,
        asOutcomeId(String(event.eventId)),
        'outcome_observed',
      );
    }
  }

  private buildBehaviorSignal(
    event: OutcomeEvent,
    evidenceType: EvidenceType,
    correlationStatus: CorrelationStatus,
  ): BehaviorSignal {
    const semantics = isA4SupportedEventType(event.type)
      ? getOutcomeSemantics(event.type)
      : null;

    const householdId = event.payload.metadata?.householdId
      ? asHouseholdId(String(event.payload.metadata.householdId))
      : asHouseholdId('unknown');

    return {
      __memoryTier: 'personal',
      kind: 'behavior',
      memberId: event.payload.memberId,
      householdId,
      sensitivity: 'personal',
      provenance: {
        sourceEngineId: OUTCOME_OBSERVATION_ENGINE_META.id,
        emittedAt: event.occurredAt,
        correlationId: event.payload.correlationId
          ? String(event.payload.correlationId)
          : undefined,
        memberId: event.payload.memberId,
        householdId,
        consentScopes: [...DEFAULT_CONSENT],
      },
      observedAt: event.occurredAt,
      signalType: buildSignalType(
        isA4SupportedEventType(event.type) ? event.type : 'proposal.presented',
        evidenceType,
        correlationStatus,
      ),
      confidence: asConfidence(
        computeConfidence(
          correlationStatus,
          semantics?.isExplicitFeedback ?? false,
        ),
      ),
      route: 'personal_only',
    };
  }

  private emitPersonalSignal(signal: BehaviorSignal): void {
    this.signalSink.emit(signal);

    const existing = this.behaviorSignals.get(signal.memberId) ?? [];
    existing.push(signal);
    this.behaviorSignals.set(signal.memberId, existing);

    this.observability.recordPersonalSignal();
  }
}

export function createContractOutcomeObservationEngine(deps: {
  traceStore: InMemoryProposalTraceStore;
  signalSink: IPersonalSignalSink;
  correlationRegistry: CorrelationRegistry;
  observability: OutcomeObservability;
}): ContractOutcomeObservationEngine {
  return new ContractOutcomeObservationEngine(
    deps.traceStore,
    deps.signalSink,
    deps.correlationRegistry,
    deps.observability,
  );
}

export { A4_SUPPORTED_EVENT_TYPES };
