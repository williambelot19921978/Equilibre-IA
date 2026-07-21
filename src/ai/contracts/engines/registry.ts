/**
 * Engine contract registry — 20 moteurs figés (ADR-0005).
 */

import type { EngineContractMeta } from '../common/primitives.ts';
import { CONVERSATION_ENGINE_META } from './conversation-engine.contract.ts';
import { INTENT_ENGINE_META } from './intent-engine.contract.ts';
import { PLM_ENGINE_META } from './personal-language-memory-engine.contract.ts';
import { HUMAN_MODEL_ENGINE_META } from './human-model-engine.contract.ts';
import { HOUSEHOLD_ENGINE_META } from './household-engine.contract.ts';
import { PLANNING_CONTEXT_ENGINE_META } from './planning-context-engine.contract.ts';
import { CONSTRAINT_ENGINE_META } from './constraint-engine.contract.ts';
import { AVAILABILITY_ENGINE_META } from './availability-engine.contract.ts';
import { GOAL_ENGINE_META } from './goal-engine.contract.ts';
import { LIFE_EVENT_ENGINE_META } from './life-event-engine.contract.ts';
import { REASONING_ENGINE_META } from './reasoning-engine.contract.ts';
import { DECISION_ENGINE_META } from './decision-engine.contract.ts';
import { ACTION_PROPOSAL_ENGINE_META } from './action-proposal-engine.contract.ts';
import { SCHEDULER_ENGINE_META } from './scheduler-engine.contract.ts';
import { RECOMMENDATION_ENGINE_META } from './recommendation-engine.contract.ts';
import { KNOWLEDGE_ENGINE_META } from './knowledge-engine.contract.ts';
import { NATURAL_RESPONSE_ENGINE_META } from './natural-response-engine.contract.ts';
import { NOTIFICATION_ENGINE_META } from './notification-engine.contract.ts';
import { UNIVERSAL_LEARNING_ENGINE_META } from './universal-learning-engine.contract.ts';
import { OUTCOME_OBSERVATION_ENGINE_META } from './outcome-observation-engine.contract.ts';

export const FROZEN_ENGINE_COUNT = 20 as const;

export const ENGINE_REGISTRY: readonly EngineContractMeta[] = [
  CONVERSATION_ENGINE_META,
  INTENT_ENGINE_META,
  PLM_ENGINE_META,
  HUMAN_MODEL_ENGINE_META,
  HOUSEHOLD_ENGINE_META,
  PLANNING_CONTEXT_ENGINE_META,
  CONSTRAINT_ENGINE_META,
  AVAILABILITY_ENGINE_META,
  GOAL_ENGINE_META,
  LIFE_EVENT_ENGINE_META,
  REASONING_ENGINE_META,
  DECISION_ENGINE_META,
  ACTION_PROPOSAL_ENGINE_META,
  SCHEDULER_ENGINE_META,
  RECOMMENDATION_ENGINE_META,
  KNOWLEDGE_ENGINE_META,
  NATURAL_RESPONSE_ENGINE_META,
  NOTIFICATION_ENGINE_META,
  UNIVERSAL_LEARNING_ENGINE_META,
  OUTCOME_OBSERVATION_ENGINE_META,
] as const;

export function assertFrozenEngineRegistry(registry: readonly EngineContractMeta[]): void {
  if (registry.length !== FROZEN_ENGINE_COUNT) {
    throw new Error(`Expected ${FROZEN_ENGINE_COUNT} engines, got ${registry.length}`);
  }
}
