import type { AutonomyLevel, EngineContractMeta, Result } from '../common/primitives.ts';
import { CONTRACT_VERSION_V1 } from '../common/primitives.ts';
import type { ConsumedEventBinding, EmittedEventBinding } from '../events/engine-events.ts';
import type { DayConstraint, DayPlan, DecisionValidation, PlanningContext, ProposedDecision } from './shared-domain.ts';

export const DECISION_ENGINE_META: EngineContractMeta = {
  id: 'decision-engine',
  pipelineNumber: 12,
  contractVersion: CONTRACT_VERSION_V1,
  invariants: [
    'Validates — never constructs calendar placements (SchedulerEngine)',
    'Must not approve hard constraint violations',
    'Scheduler produces → Decision validates (ADR-0006)',
  ],
};

export type ValidateProposalInput = {
  readonly proposedDecision: ProposedDecision;
  readonly constraints: readonly DayConstraint[];
  readonly planningContext: PlanningContext;
  readonly autonomyLevel: AutonomyLevel;
};

export type IDecisionEngine = {
  readonly meta: typeof DECISION_ENGINE_META;
  validateProposal(input: ValidateProposalInput): Result<DecisionValidation>;
  validateDayPlan(plan: DayPlan, constraints: readonly DayConstraint[]): Result<DecisionValidation>;
  requiresConfirmation(actionType: string, autonomyLevel: AutonomyLevel): boolean;
};

export const DECISION_ENGINE_EVENTS = {
  emitted: [
    { type: 'decision.approved', description: 'Proposal approved' },
    { type: 'decision.rejected', description: 'Proposal rejected' },
    { type: 'decision.confirmation.required', description: 'Confirmation needed' },
  ] satisfies EmittedEventBinding[],
  consumed: [{ type: 'reasoning.completed', handler: 'sync' }, { type: 'schedule.generated', handler: 'sync' }] satisfies ConsumedEventBinding[],
};
