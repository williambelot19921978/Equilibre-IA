import type { EngineContractMeta, Result } from '../common/primitives.ts';
import { CONTRACT_VERSION_V1 } from '../common/primitives.ts';
import type { MemberId, ProposalId } from '../common/ids.ts';
import type { ConsumedEventBinding, EmittedEventBinding } from '../events/engine-events.ts';
import type { OutcomeEvent } from '../events/outcome-events.ts';
import type { AnonymizedCandidate } from '../privacy/universal-signal.ts';
import type { BehaviorSignal, GoalFeedbackSignal, LanguageConfirmationSignal } from '../privacy/personal-signal.ts';
import type { CorrelationResult, ObservedOutcome, OutcomeBatch, OutcomeMetrics, OutcomeRoute } from './outcome-types.ts';

export const OUTCOME_OBSERVATION_ENGINE_META: EngineContractMeta = {
  id: 'outcome-observation-engine',
  pipelineNumber: 20,
  contractVersion: CONTRACT_VERSION_V1,
  invariants: [
    'Observes — never decides, recommends, or executes',
    'Never writes UniversalLearningEngine directly — AnonymizationGate only',
    'Never stores durable personal memory',
    'Never infers causality without evidence',
    'Distinguishes observation vs correlation vs causality',
  ],
};

export type IOutcomeObservationEngine = {
  readonly meta: typeof OUTCOME_OBSERVATION_ENGINE_META;
  recordOutcome(event: OutcomeEvent): Result<void>;
  correlate(proposalId: ProposalId, outcome: ObservedOutcome): Result<CorrelationResult>;
  emitBehaviorSignals(memberId: MemberId, since?: string): readonly BehaviorSignal[];
  emitGoalFeedback(memberId: MemberId): readonly GoalFeedbackSignal[];
  emitLanguageConfirmations(memberId: MemberId): readonly LanguageConfirmationSignal[];
  /** Candidates for AnonymizationGate — NOT for ULE direct */
  emitAnonymizedCandidates(batch: OutcomeBatch): readonly AnonymizedCandidate[];
  classifyRoute(event: OutcomeEvent): OutcomeRoute;
  getEffectivenessMetrics(scope: 'household' | 'product'): OutcomeMetrics;
};

export const OUTCOME_OBSERVATION_ENGINE_EVENTS = {
  emitted: [
    { type: 'outcome.recorded', description: 'Outcome classified' },
    { type: 'outcome.behaviorSignal.emitted', description: 'Personal behavior signals' },
    { type: 'outcome.universalCandidate.emitted', description: 'Candidates to gate' },
    { type: 'outcome.effectiveness.updated', description: 'Metrics updated' },
    { type: 'outcome.correlation.failed', description: 'Correlation failed' },
  ] satisfies EmittedEventBinding[],
  consumed: [
    { type: 'action.executed', handler: 'async' },
    { type: 'action.failed', handler: 'async' },
    { type: 'decision.approved', handler: 'async' },
    { type: 'decision.rejected', handler: 'async' },
    { type: 'conversation.pending.resolved', handler: 'async' },
    { type: 'task.completed', handler: 'async' },
    { type: 'task.skipped', handler: 'async' },
    { type: 'recommendation.followed', handler: 'async' },
    { type: 'recommendation.ignored', handler: 'async' },
  ] satisfies ConsumedEventBinding[],
};
