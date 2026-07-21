export type { IActionProposalEngine, ActionProposalResult, ResolveActionsInput } from './action-proposal-engine.contract.ts';
export { ACTION_PROPOSAL_ENGINE_EVENTS, ACTION_PROPOSAL_ENGINE_META } from './action-proposal-engine.contract.ts';
export type { IAvailabilityEngine, AvailabilityInput, AvailabilityOutput } from './availability-engine.contract.ts';
export { AVAILABILITY_ENGINE_EVENTS, AVAILABILITY_ENGINE_META } from './availability-engine.contract.ts';
export type { IConstraintEngine, ConstraintInput, ConstraintOutput } from './constraint-engine.contract.ts';
export { CONSTRAINT_ENGINE_EVENTS, CONSTRAINT_ENGINE_META } from './constraint-engine.contract.ts';
export type { IConversationEngine, ProcessTurnInput, ProcessTurnOutput } from './conversation-engine.contract.ts';
export { CONVERSATION_ENGINE_EVENTS, CONVERSATION_ENGINE_META } from './conversation-engine.contract.ts';
export type { IDecisionEngine, ValidateProposalInput } from './decision-engine.contract.ts';
export { DECISION_ENGINE_EVENTS, DECISION_ENGINE_META } from './decision-engine.contract.ts';
export type { IGoalEngine, GoalInput, MissionSuggestion } from './goal-engine.contract.ts';
export { GOAL_ENGINE_EVENTS, GOAL_ENGINE_META } from './goal-engine.contract.ts';
export type { IHouseholdEngine, FamilyContextForDate, MemberAvailabilityHint } from './household-engine.contract.ts';
export { HOUSEHOLD_ENGINE_EVENTS, HOUSEHOLD_ENGINE_META } from './household-engine.contract.ts';
export type { IHumanModelEngine, HumanModel, LivingInsight, ModelCorrection } from './human-model-engine.contract.ts';
export { HUMAN_MODEL_ENGINE_EVENTS, HUMAN_MODEL_ENGINE_META } from './human-model-engine.contract.ts';
export type { IIntentEngine, ClarificationRequest, ParseInput } from './intent-engine.contract.ts';
export { INTENT_ENGINE_EVENTS, INTENT_ENGINE_META } from './intent-engine.contract.ts';
export type { IKnowledgeEngine, KnowledgeInput, KnowledgeRequest } from './knowledge-engine.contract.ts';
export { KNOWLEDGE_ENGINE_EVENTS, KNOWLEDGE_ENGINE_META } from './knowledge-engine.contract.ts';
export type { ILifeEventEngine, LifeEventInput } from './life-event-engine.contract.ts';
export { LIFE_EVENT_ENGINE_EVENTS, LIFE_EVENT_ENGINE_META } from './life-event-engine.contract.ts';
export type { INaturalResponseEngine, NaturalResponseInput } from './natural-response-engine.contract.ts';
export { NATURAL_RESPONSE_ENGINE_EVENTS, NATURAL_RESPONSE_ENGINE_META } from './natural-response-engine.contract.ts';
export type { INotificationEngine, NotificationOutput } from './notification-engine.contract.ts';
export { NOTIFICATION_ENGINE_EVENTS, NOTIFICATION_ENGINE_META } from './notification-engine.contract.ts';
export type {
  CorrelationConfidence,
  CorrelationResult,
  ObservedOutcome,
  OutcomeBatch,
  OutcomeMetrics,
  OutcomeRoute,
} from './outcome-types.ts';
export type { IOutcomeObservationEngine } from './outcome-observation-engine.contract.ts';
export { OUTCOME_OBSERVATION_ENGINE_EVENTS, OUTCOME_OBSERVATION_ENGINE_META } from './outcome-observation-engine.contract.ts';
export type { IPLMEngine, ConfirmOutcome, LanguageResolution, LearningProposal } from './personal-language-memory-engine.contract.ts';
export { PLM_ENGINE_EVENTS, PLM_ENGINE_META } from './personal-language-memory-engine.contract.ts';
export type { BuildPlanningContextInput, IPlanningContextEngine } from './planning-context-engine.contract.ts';
export { PLANNING_CONTEXT_ENGINE_META, PLANNING_CONTEXT_ENGINE_EVENTS } from './planning-context-engine.contract.ts';
export type { IReasoningEngine, ReasoningInput } from './reasoning-engine.contract.ts';
export { REASONING_ENGINE_EVENTS, REASONING_ENGINE_META } from './reasoning-engine.contract.ts';
export type { IRecommendationEngine, RecommendationInput, RecommendationOutput, RecommendationRequest } from './recommendation-engine.contract.ts';
export { RECOMMENDATION_ENGINE_EVENTS, RECOMMENDATION_ENGINE_META } from './recommendation-engine.contract.ts';
export { assertFrozenEngineRegistry, ENGINE_REGISTRY, FROZEN_ENGINE_COUNT } from './registry.ts';
export type { GeneratePlanInput, ISchedulerEngine, SchedulingRequest } from './scheduler-engine.contract.ts';
export { SCHEDULER_ENGINE_EVENTS, SCHEDULER_ENGINE_META } from './scheduler-engine.contract.ts';
export type * from './shared-domain.ts';
export type { GeneralPlanningContext, IUniversalLearningEngine, ValidationResult } from './universal-learning-engine.contract.ts';
export { UNIVERSAL_LEARNING_ENGINE_EVENTS, UNIVERSAL_LEARNING_ENGINE_META } from './universal-learning-engine.contract.ts';
