import type { EngineContractMeta, Result } from '../common/primitives.ts';
import { CONTRACT_VERSION_V1 } from '../common/primitives.ts';
import type { MemberId } from '../common/ids.ts';
import type { ConsumedEventBinding, EmittedEventBinding } from '../events/engine-events.ts';
import type { BehaviorSignal } from '../privacy/personal-signal.ts';
import type { HumanModelSnapshot } from './shared-domain.ts';

export const HUMAN_MODEL_ENGINE_META: EngineContractMeta = {
  id: 'human-model-engine',
  pipelineNumber: 4,
  contractVersion: CONTRACT_VERSION_V1,
  invariants: [
    'Must not build planning views',
    'Must not model whole household',
    'Hypotheses require confidence level',
  ],
};

export type ModelCorrection = {
  readonly field: string;
  readonly newValue: unknown;
};

export type HumanModel = {
  readonly memberId: MemberId;
  readonly fields: Readonly<Record<string, { value: unknown; confidence: number }>>;
};

export type LivingInsight = {
  readonly key: string;
  readonly summary: string;
};

export type IHumanModelEngine = {
  readonly meta: typeof HUMAN_MODEL_ENGINE_META;
  getModel(memberId: MemberId): HumanModel;
  getSnapshot(memberId: MemberId): HumanModelSnapshot;
  applyCorrection(memberId: MemberId, correction: ModelCorrection): Result<void>;
  ingestBehaviorSignals(signals: readonly BehaviorSignal[]): Result<void>;
  getInsights(memberId: MemberId): readonly LivingInsight[];
};

export const HUMAN_MODEL_ENGINE_EVENTS = {
  emitted: [
    { type: 'humanModel.updated', description: 'Model updated' },
    { type: 'humanModel.correction.applied', description: 'User correction applied' },
  ] satisfies EmittedEventBinding[],
  consumed: [
    { type: 'outcome.behaviorSignal.emitted', handler: 'async' },
    { type: 'goal.updated', handler: 'sync' },
    { type: 'lifeEvent.declared', handler: 'sync' },
  ] satisfies ConsumedEventBinding[],
};
