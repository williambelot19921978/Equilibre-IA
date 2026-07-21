import type { EngineContractMeta, Result } from '../common/primitives.ts';
import { CONTRACT_VERSION_V1 } from '../common/primitives.ts';
import type { ConsumedEventBinding, EmittedEventBinding } from '../events/engine-events.ts';
import type {
  AvailableSlot,
  GoalWeights,
  HumanModelSnapshot,
  LifeEventContext,
  Recommendation,
} from './shared-domain.ts';

export const RECOMMENDATION_ENGINE_META: EngineContractMeta = {
  id: 'recommendation-engine',
  pipelineNumber: 15,
  contractVersion: CONTRACT_VERSION_V1,
  invariants: [
    'Planning First — only after AvailabilityEngine',
    'Details activities — does not place calendar blocks',
    'ReasoningEngine arbitrates — RecommendationEngine fabricates content',
  ],
};

export type RecommendationRequest = {
  readonly category: string;
  readonly slot: AvailableSlot;
};

export type RecommendationInput = {
  readonly availableSlots: readonly AvailableSlot[];
  readonly goalWeights: GoalWeights;
  readonly humanModel: HumanModelSnapshot;
  readonly lifeEventContext?: LifeEventContext;
  readonly request: RecommendationRequest;
};

export type RecommendationOutput = {
  readonly recommendations: readonly Recommendation[];
  readonly featured?: Recommendation;
};

export type IRecommendationEngine = {
  readonly meta: typeof RECOMMENDATION_ENGINE_META;
  recommend(input: RecommendationInput): Result<RecommendationOutput>;
};

export const RECOMMENDATION_ENGINE_EVENTS = {
  emitted: [{ type: 'recommendation.generated', description: 'Recommendations ready' }] satisfies EmittedEventBinding[],
  consumed: [{ type: 'availability.computed', handler: 'sync' }] satisfies ConsumedEventBinding[],
};
