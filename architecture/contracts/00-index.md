# Contrats moteurs — Index Sprint A1

> **Architecture cerveau Équilibre IA — 20 moteurs — FROZEN**  
> Date : 2026-07-18 · Gel : ADR-0005 · Contrats TS : Sprint A2  
> Statut : **20 moteurs figés** — nouveau moteur = procédure exceptionnelle (ADR-0005)

## Pipeline conceptuel (20 moteurs figés — ADR-0005)

```
Utilisateur
    ↓
[1] ConversationEngine
    ↓
[2] IntentEngine (+ [3] PersonalLanguageMemoryEngine en parallèle)
    ↓
[4] HumanModelEngine    [5] HouseholdEngine
    ↓
[6] PlanningContextEngine
    ↓
[7] ConstraintEngine → [8] AvailabilityEngine
    ↓
[9] GoalEngine + [10] LifeEventEngine
    ↓
[11] ReasoningEngine → [12] DecisionEngine
    ↓
[13] ActionProposalEngine (+ [14] SchedulerEngine)
    ↓
[15] RecommendationEngine (+ [16] KnowledgeEngine si externe)
    ↓
[17] NaturalResponseEngine
    ↓
Actions (couche services — hors cerveau)

[18] NotificationEngine — canal parallèle (événements)

[19] UniversalLearningEngine — apprentissage collectif (Dual Memory)
     ↳ alimente IntentEngine + ReasoningEngine — JAMAIS Personal Memory

[20] OutcomeObservationEngine — boucle rétroaction (Dual Memory)
     ↳ observe résultats → Personal Memory OU AnonymizationGate → ULE
```

## Contrats

| # | Moteur | Fichier | Code actuel principal |
|---|--------|---------|------------------------|
| 1 | ConversationEngine | [conversation-engine.md](./conversation-engine.md) | `nlp/conversationEngine.ts` |
| 2 | IntentEngine | [intent-engine.md](./intent-engine.md) | `nlp/intentEngine.ts` |
| 3 | PersonalLanguageMemoryEngine | [personal-language-memory-engine.md](./personal-language-memory-engine.md) | `languageMemory/*` |
| 4 | HumanModelEngine | [human-model-engine.md](./human-model-engine.md) | `memoryEngine.ts`, `memory/*` |
| 5 | HouseholdEngine | [household-engine.md](./household-engine.md) | `familyContextEngine.ts` |
| 6 | PlanningContextEngine | [planning-context-engine.md](./planning-context-engine.md) | `memoryEngine.buildPlanningContext`, `memoryContextService` |
| 7 | ConstraintEngine | [constraint-engine.md](./constraint-engine.md) | `planningEngine.buildDayConstraints`, `decisionEngine` |
| 8 | AvailabilityEngine | [availability-engine.md](./availability-engine.md) | `planningEngine.findAvailableSlots`, `lifeEngine.scoreFreeSlot` |
| 9 | GoalEngine | [goal-engine.md](./goal-engine.md) | `memory/dailyMissionEngine`, `mainPriority` |
| 10 | LifeEventEngine | [life-event-engine.md](./life-event-engine.md) | `lifeEngine.ts` (partiel) |
| 11 | ReasoningEngine | [reasoning-engine.md](./reasoning-engine.md) | `reasoning/lifeReasoner.ts` |
| 12 | DecisionEngine | [decision-engine.md](./decision-engine.md) | `decisionEngine.ts` |
| 13 | ActionProposalEngine | [action-proposal-engine.md](./action-proposal-engine.md) | `nlp/actionResolver.ts` |
| 14 | SchedulerEngine | [scheduler-engine.md](./scheduler-engine.md) | `planningEngine.generateDayPlan` |
| 15 | RecommendationEngine | [recommendation-engine.md](./recommendation-engine.md) | `leisureSuggestionEngine`, `freeTimeSuggestionEngine`, etc. |
| 16 | KnowledgeEngine | [knowledge-engine.md](./knowledge-engine.md) | *(aucun — planifié)* |
| 17 | NaturalResponseEngine | [natural-response-engine.md](./natural-response-engine.md) | `actionResolver.formatAssistantReply`, `enrichAssistantWithMemory` |
| 18 | NotificationEngine | [notification-engine.md](./notification-engine.md) | *(planifié — Sprint 6 ROADMAP)* |
| 19 | UniversalLearningEngine | [universal-learning-engine.md](./universal-learning-engine.md) | *(planifié — Dual Memory)* |
| 20 | OutcomeObservationEngine | [outcome-observation-engine.md](./outcome-observation-engine.md) | *(planifié — boucle rétroaction)* |

## Dual Memory

| Niveau | Moteurs | Document |
|--------|---------|----------|
| **Personal Memory** | HumanModel, Household, PLM, PlanningContext, Goal, LifeEvent | Constitution ch. 14 |
| **Universal Learning** | UniversalLearningEngine | [`UNIVERSAL_LEARNING_ENGINE.md`](../../Docs/UNIVERSAL_LEARNING_ENGINE.md) |
| **Rétroaction** | OutcomeObservationEngine → routage Q11 | [`PRE_IMPLEMENTATION_ARCHITECTURE_REVIEW.md`](../../Docs/PRE_IMPLEMENTATION_ARCHITECTURE_REVIEW.md) |

> **Mélange interdit** — Architecture Guardian Q11

## Diagramme global

[diagram-pipeline-global.md](./diagram-pipeline-global.md)

## Revue Architecture Guardian

[../decisions/2026-07-18-sprint-a1-contracts.md](../decisions/2026-07-18-sprint-a1-contracts.md)

## Rapport Sprint A1

[../decisions/2026-07-18-sprint-a1-report.md](../decisions/2026-07-18-sprint-a1-report.md)

## Règles transverses (tous moteurs)

1. **Loi 8** — Constitution prévaut.
2. **Pas de dépendance circulaire** dans l'architecture cible.
3. **Planning déterministe** — le LLM ne modifie jamais directement le calendrier.
4. **Universalité** — aucun profil fondateur en dur dans les contrats.
5. **Foyer centrale** — `HouseholdEngine` remplace la modélisation texte conjoint.
6. **Interfaces publiques stables** — migration progressive (ADR-0001).
7. **Dual Memory** — Personal Memory ≠ Universal Learning ; mélange interdit (ADR-0003).
8. **Boucle rétroaction** — OutcomeObservationEngine ferme la loop forward→backward (ADR-0004).
