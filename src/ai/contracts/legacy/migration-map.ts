/**
 * Legacy migration map — documentation only, no adapters wired (Sprint A2).
 * @see architecture/adr/0001-pipeline-ia-interfaces-first.md
 */

import type { EngineId } from '../common/primitives.ts';

export type LegacyMigrationEntry = {
  readonly engineId: EngineId;
  readonly legacyFiles: readonly string[];
  readonly primaryFunctions: readonly string[];
  readonly contractGaps: readonly string[];
  readonly cycleRisk: 'none' | 'low' | 'medium' | 'high';
  readonly replacementOrder: number;
};

export const LEGACY_MIGRATION_MAP: readonly LegacyMigrationEntry[] = [
  {
    engineId: 'conversation-engine',
    legacyFiles: ['src/ai/nlp/conversationEngine.ts', 'src/lib/nlp/pendingConversationAction.ts'],
    primaryFunctions: ['processConversationTurn'],
    contractGaps: ['PendingAction types fragmented', 'UI holds session state'],
    cycleRisk: 'medium',
    replacementOrder: 5,
  },
  {
    engineId: 'intent-engine',
    legacyFiles: ['src/ai/nlp/intentEngine.ts', 'src/ai/nlp/entityExtractor.ts'],
    primaryFunctions: ['parseIntent'],
    contractGaps: ['PLM arbitration rules not coded'],
    cycleRisk: 'low',
    replacementOrder: 3,
  },
  {
    engineId: 'personal-language-memory-engine',
    legacyFiles: ['src/ai/languageMemory/'],
    primaryFunctions: ['resolvePersonalExpression', 'learnPersonalExpression'],
    contractGaps: ['Bridge coupled to actionResolver'],
    cycleRisk: 'medium',
    replacementOrder: 4,
  },
  {
    engineId: 'human-model-engine',
    legacyFiles: ['src/ai/memoryEngine.ts', 'src/ai/memory/livingMemoryEngine.ts', 'src/ai/habits/buildHabitProfile.ts'],
    primaryFunctions: ['buildMemoryProfile'],
    contractGaps: ['Merged with PlanningContext', 'behaviorSignals producer missing'],
    cycleRisk: 'high',
    replacementOrder: 2,
  },
  {
    engineId: 'household-engine',
    legacyFiles: ['src/ai/familyContextEngine.ts'],
    primaryFunctions: ['buildFamilyContext'],
    contractGaps: ['partner_name text model legacy'],
    cycleRisk: 'low',
    replacementOrder: 6,
  },
  {
    engineId: 'planning-context-engine',
    legacyFiles: ['src/ai/memoryEngine.ts', 'src/services/memoryContextService.ts'],
    primaryFunctions: ['buildPlanningContext'],
    contractGaps: ['Hub bidirectional in memoryContextService'],
    cycleRisk: 'high',
    replacementOrder: 1,
  },
  {
    engineId: 'constraint-engine',
    legacyFiles: ['src/ai/planningEngine.ts', 'src/ai/decisionEngine.ts'],
    primaryFunctions: ['buildDayConstraints'],
    contractGaps: ['Inline in planningEngine monolith'],
    cycleRisk: 'high',
    replacementOrder: 1,
  },
  {
    engineId: 'availability-engine',
    legacyFiles: ['src/ai/planningEngine.ts', 'src/ai/lifeEngine.ts'],
    primaryFunctions: ['findAvailableSlots', 'scoreFreeSlot'],
    contractGaps: ['Merged with lifeEngine scoring'],
    cycleRisk: 'high',
    replacementOrder: 1,
  },
  {
    engineId: 'goal-engine',
    legacyFiles: ['src/ai/memory/dailyMissionEngine.ts', 'src/ai/memory/weeklyMissionEngine.ts'],
    primaryFunctions: ['buildDailyMission'],
    contractGaps: ['Engine absent as unit'],
    cycleRisk: 'medium',
    replacementOrder: 7,
  },
  {
    engineId: 'life-event-engine',
    legacyFiles: ['src/ai/lifeEngine.ts'],
    primaryFunctions: ['determineDayType'],
    contractGaps: ['Monolith with availability scoring'],
    cycleRisk: 'high',
    replacementOrder: 2,
  },
  {
    engineId: 'reasoning-engine',
    legacyFiles: ['src/ai/reasoning/lifeReasoner.ts', 'src/ai/coach/proactiveCoachEngine.ts', 'src/lib/proactiveEngine/'],
    primaryFunctions: ['reasonAboutLife'],
    contractGaps: ['Three parallel paths'],
    cycleRisk: 'high',
    replacementOrder: 8,
  },
  {
    engineId: 'decision-engine',
    legacyFiles: ['src/ai/decisionEngine.ts', 'src/ai/planningEngine.ts'],
    primaryFunctions: ['validatePlannedBlock', 'validateDayPlan'],
    contractGaps: ['Validation dispersed in planningEngine'],
    cycleRisk: 'medium',
    replacementOrder: 2,
  },
  {
    engineId: 'action-proposal-engine',
    legacyFiles: ['src/ai/nlp/actionResolver.ts'],
    primaryFunctions: ['resolveActions'],
    contractGaps: ['Mixed with NaturalResponse formatting', 'No proposalTrace'],
    cycleRisk: 'medium',
    replacementOrder: 9,
  },
  {
    engineId: 'scheduler-engine',
    legacyFiles: ['src/ai/planningEngine.ts'],
    primaryFunctions: ['generateDayPlan'],
    contractGaps: ['~1150 line monolith'],
    cycleRisk: 'high',
    replacementOrder: 1,
  },
  {
    engineId: 'recommendation-engine',
    legacyFiles: ['src/ai/leisureSuggestionEngine.ts', 'src/ai/freeTimeSuggestionEngine.ts', 'src/ai/eveningOpportunityEngine.ts'],
    primaryFunctions: ['suggestLeisure'],
    contractGaps: ['5+ fragmented engines'],
    cycleRisk: 'medium',
    replacementOrder: 10,
  },
  {
    engineId: 'knowledge-engine',
    legacyFiles: [],
    primaryFunctions: [],
    contractGaps: ['Not implemented'],
    cycleRisk: 'none',
    replacementOrder: 12,
  },
  {
    engineId: 'natural-response-engine',
    legacyFiles: ['src/ai/nlp/actionResolver.ts', 'src/ai/core/enrichAssistantWithMemory.ts'],
    primaryFunctions: ['formatAssistantReply'],
    contractGaps: ['Embedded in actionResolver'],
    cycleRisk: 'medium',
    replacementOrder: 9,
  },
  {
    engineId: 'notification-engine',
    legacyFiles: [],
    primaryFunctions: [],
    contractGaps: ['Sprint 6 planned'],
    cycleRisk: 'none',
    replacementOrder: 14,
  },
  {
    engineId: 'universal-learning-engine',
    legacyFiles: ['src/ai/languageMemory/colloquialPatternRegistry.ts'],
    primaryFunctions: [],
    contractGaps: ['Static registry only', 'No store'],
    cycleRisk: 'none',
    replacementOrder: 13,
  },
  {
    engineId: 'outcome-observation-engine',
    legacyFiles: ['src/ai/core/aggregateBehaviorSignals.ts', 'src/ai/habits/buildHabitProfile.ts'],
    primaryFunctions: ['aggregateBehaviorSignals'],
    contractGaps: ['No unified outcome pipeline'],
    cycleRisk: 'low',
    replacementOrder: 11,
  },
] as const;

/** Empty adapter ports — Sprint A3+ */
export type LegacyAdapterPort<TContract> = {
  readonly engineId: EngineId;
  readonly contract: TContract;
  readonly legacyModule: string;
  readonly status: 'documented' | 'stub' | 'wired';
};

/** Sprint A3 — DecisionEngine pilot adapter (wired). */
export const DECISION_ENGINE_ADAPTER: LegacyAdapterPort<'IDecisionEngine'> = {
  engineId: 'decision-engine',
  contract: 'IDecisionEngine',
  legacyModule: 'src/ai/decisionEngine.ts',
  status: 'wired',
};

/** Sprint A4 — OutcomeObservationEngine first implementation (wired). */
export const OUTCOME_OBSERVATION_ENGINE_ADAPTER: LegacyAdapterPort<'IOutcomeObservationEngine'> = {
  engineId: 'outcome-observation-engine',
  contract: 'IOutcomeObservationEngine',
  legacyModule: 'src/ai/core/aggregateBehaviorSignals.ts',
  status: 'wired',
};
