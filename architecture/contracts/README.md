# Contrats — Spécifications moteurs IA

> **Sprint A1 ✅ · Sprint A2 ✅** — Contrats documentaires + TypeScript  
> **20 moteurs figés** — voir [`00-index.md`](./00-index.md)

## Index

→ **[00-index.md](./00-index.md)** — liste complète des **20 moteurs**

→ **[diagram-pipeline-global.md](./diagram-pipeline-global.md)** — schéma conceptuel

## Rapports Sprint A1

- [Revue Architecture Guardian](../decisions/2026-07-18-sprint-a1-contracts.md)
- [Rapport Sprint A1](../decisions/2026-07-18-sprint-a1-report.md)

## Template

- [_contract-template.md](./_contract-template.md)

## Stratégie (ADR-0001, ADR-0002)

1. ✅ Contrats documentés ici (Sprint A1)
2. ✅ Interfaces TypeScript → [`src/ai/contracts/`](../../src/ai/contracts/) (Sprint A2)
3. 📋 Adapters legacy → implémentations conformes (Sprint A3+)

## Contrats par moteur

| Contrat | Fichier |
|---------|---------|
| ConversationEngine | [conversation-engine.md](./conversation-engine.md) |
| IntentEngine | [intent-engine.md](./intent-engine.md) |
| PersonalLanguageMemoryEngine | [personal-language-memory-engine.md](./personal-language-memory-engine.md) |
| HumanModelEngine | [human-model-engine.md](./human-model-engine.md) |
| HouseholdEngine | [household-engine.md](./household-engine.md) |
| PlanningContextEngine | [planning-context-engine.md](./planning-context-engine.md) |
| ConstraintEngine | [constraint-engine.md](./constraint-engine.md) |
| AvailabilityEngine | [availability-engine.md](./availability-engine.md) |
| GoalEngine | [goal-engine.md](./goal-engine.md) |
| LifeEventEngine | [life-event-engine.md](./life-event-engine.md) |
| ReasoningEngine | [reasoning-engine.md](./reasoning-engine.md) |
| DecisionEngine | [decision-engine.md](./decision-engine.md) |
| ActionProposalEngine | [action-proposal-engine.md](./action-proposal-engine.md) |
| SchedulerEngine | [scheduler-engine.md](./scheduler-engine.md) |
| RecommendationEngine | [recommendation-engine.md](./recommendation-engine.md) |
| KnowledgeEngine | [knowledge-engine.md](./knowledge-engine.md) |
| NaturalResponseEngine | [natural-response-engine.md](./natural-response-engine.md) |
| NotificationEngine | [notification-engine.md](./notification-engine.md) |
| UniversalLearningEngine | [universal-learning-engine.md](./universal-learning-engine.md) |

## Dual Memory

Voir [`Docs/UNIVERSAL_LEARNING_ENGINE.md`](../../Docs/UNIVERSAL_LEARNING_ENGINE.md)
