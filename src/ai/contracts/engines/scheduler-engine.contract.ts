import type { EngineContractMeta, Result } from '../common/primitives.ts';
import { CONTRACT_VERSION_V1 } from '../common/primitives.ts';
import type { ConsumedEventBinding, EmittedEventBinding } from '../events/engine-events.ts';
import type {
  AvailableSlot,
  DayConstraint,
  DayPlan,
  GoalWeights,
  PlanningContext,
  SchedulePatch,
} from './shared-domain.ts';

export const SCHEDULER_ENGINE_META: EngineContractMeta = {
  id: 'scheduler-engine',
  pipelineNumber: 14,
  contractVersion: CONTRACT_VERSION_V1,
  invariants: [
    '100% deterministic — no LLM placement',
    'Constructs plans — DecisionEngine validates (ADR-0006)',
    'Must not choose activity content (RecommendationEngine)',
  ],
};

export type SchedulingRequest = {
  readonly kind: 'generate_day' | 'apply_patch' | 'defer_tasks';
  readonly date: string;
};

export type GeneratePlanInput = {
  readonly planningContext: PlanningContext;
  readonly constraints: readonly DayConstraint[];
  readonly availableSlots: readonly AvailableSlot[];
  readonly goalWeights: GoalWeights;
  readonly request: SchedulingRequest;
};

export type ISchedulerEngine = {
  readonly meta: typeof SCHEDULER_ENGINE_META;
  generateDayPlan(input: GeneratePlanInput): Result<DayPlan>;
  applyPatch(context: PlanningContext, patch: SchedulePatch): Result<DayPlan>;
  deferTasks(input: GeneratePlanInput & { taskIds: readonly string[] }): Result<SchedulePatch>;
};

export const SCHEDULER_ENGINE_EVENTS = {
  emitted: [
    { type: 'schedule.generated', description: 'Day plan generated' },
    { type: 'schedule.patched', description: 'Schedule patched' },
  ] satisfies EmittedEventBinding[],
  consumed: [{ type: 'decision.approved', handler: 'sync' }] satisfies ConsumedEventBinding[],
};
