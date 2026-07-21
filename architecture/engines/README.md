# Moteurs — Cartographie

> **20 moteurs figés** (ADR-0005) — Contrats : [`../contracts/00-index.md`](../contracts/00-index.md) · TS : [`../../src/ai/contracts/`](../../src/ai/contracts/)

## Pipeline cible (20 moteurs)

| # | Moteur | Contrat | Code actuel |
|---|--------|---------|-------------|
| 1 | ConversationEngine | [conversation-engine.md](../contracts/conversation-engine.md) | `src/ai/nlp/conversationEngine.ts` |
| 2 | IntentEngine | [intent-engine.md](../contracts/intent-engine.md) | `src/ai/nlp/intentEngine.ts` |
| 3 | PersonalLanguageMemoryEngine | [personal-language-memory-engine.md](../contracts/personal-language-memory-engine.md) | `src/ai/languageMemory/` |
| 4 | HumanModelEngine | [human-model-engine.md](../contracts/human-model-engine.md) | `src/ai/memoryEngine.ts` |
| 5 | HouseholdEngine | [household-engine.md](../contracts/household-engine.md) | `src/ai/familyContextEngine.ts` |
| 6 | PlanningContextEngine | [planning-context-engine.md](../contracts/planning-context-engine.md) | `memoryEngine.buildPlanningContext` |
| 7 | ConstraintEngine | [constraint-engine.md](../contracts/constraint-engine.md) | `planningEngine.buildDayConstraints` |
| 8 | AvailabilityEngine | [availability-engine.md](../contracts/availability-engine.md) | `planningEngine`, `lifeEngine` |
| 9 | GoalEngine | [goal-engine.md](../contracts/goal-engine.md) | `memory/dailyMissionEngine` |
| 10 | LifeEventEngine | [life-event-engine.md](../contracts/life-event-engine.md) | `lifeEngine.ts` |
| 11 | ReasoningEngine | [reasoning-engine.md](../contracts/reasoning-engine.md) | `reasoning/lifeReasoner.ts` |
| 12 | DecisionEngine | [decision-engine.md](../contracts/decision-engine.md) | `src/ai/decisionEngine.ts` |
| 13 | ActionProposalEngine | [action-proposal-engine.md](../contracts/action-proposal-engine.md) | `nlp/actionResolver.ts` |
| 14 | SchedulerEngine | [scheduler-engine.md](../contracts/scheduler-engine.md) | `planningEngine.generateDayPlan` |
| 15 | RecommendationEngine | [recommendation-engine.md](../contracts/recommendation-engine.md) | suggestion engines |
| 16 | KnowledgeEngine | [knowledge-engine.md](../contracts/knowledge-engine.md) | — |
| 17 | NaturalResponseEngine | [natural-response-engine.md](../contracts/natural-response-engine.md) | `formatAssistantReply` |
| 18 | NotificationEngine | [notification-engine.md](../contracts/notification-engine.md) | — |
| 19 | UniversalLearningEngine | [universal-learning-engine.md](../contracts/universal-learning-engine.md) | — |
| 20 | OutcomeObservationEngine | [outcome-observation-engine.md](../contracts/outcome-observation-engine.md) | — |

## Boucle officielle

Comprendre → Décider → Proposer → Observer → Mesurer → Apprendre

## Diagramme

[diagram-pipeline-global.md](../contracts/diagram-pipeline-global.md)

## Règle Architecture Guardian

Nouveau moteur = procédure exceptionnelle ADR-0005 (question Q3 + ADR + validation humaine).

Légende : ✅ Proche contrat · 🚧 Partiel · 📋 Planifié
