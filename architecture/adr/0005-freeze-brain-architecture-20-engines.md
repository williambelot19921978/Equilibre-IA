# ADR-0005 : Gel architecture cerveau — 20 moteurs

> Statut : **accepted**  
> Date : 2026-07-18  
> Décideurs : Validation humaine — Sprint A2

## Contexte

Sprint A1 a défini 18 moteurs. ADR-0003 (Dual Memory) a ajouté UniversalLearningEngine (#19). ADR-0004 (accepté) a ajouté OutcomeObservationEngine (#20) pour fermer la boucle rétroaction.

La revue CTO pré-implémentation et la validation humaine confirment que **20 moteurs** couvrent les capacités fondamentales du cerveau Équilibre IA.

## Décision

**L'architecture cible du cerveau est figée à 20 moteurs.**

Boucle officielle :

```
comprendre → décider → proposer → observer → mesurer → apprendre
```

## Ce que « figée » signifie

| Inclus | Exclu |
|--------|-------|
| Liste stable des 20 moteurs et leurs responsabilités | Gel du code legacy |
| Contrats documentaires + TypeScript (`src/ai/contracts/`) | Interdiction d'évoluer les interfaces existantes |
| Frontières Dual Memory, Q11, AnonymizationGate | Interdiction de nouveaux services ou adaptateurs |
| Procédure exceptionnelle pour un 21ᵉ moteur | Interdiction de refactor legacy (migration progressive OK) |

**Figée ≠ immuable.** Les **contrats** des 20 moteurs peuvent être **précisés** (patch version) sans créer un nouveau moteur. Les **implémentations** migrent progressivement (ADR-0001).

## Ce que cela n'interdit pas

- Services d'exécution (ActionExecution), adaptateurs legacy, infrastructure (AnonymizationGate, event bus).
- Modules produit optionnels (spiritualité, sport avancé) **sous** les moteurs existants.
- Scission **code** des monolithes legacy vers moteurs **existants**.
- Nouvelles **strategies** RecommendationEngine, nouveaux **intents**, nouvelles tables Personal Memory (RLS).
- Health Score, Robot QA, évolutions Constitution (Loi 8 prévaut).

## Taxonomie officielle

| Catégorie | Rôle | Exemples |
|-----------|------|----------|
| **Moteur** | Capacité cognitive bounded du cerveau | IntentEngine, SchedulerEngine |
| **Service** | Exécution, persistance, I/O | nlpActionService, planningService |
| **Adaptateur** | Pont legacy → contrat | *(Sprint A3+)* |
| **Gate** | Pare-feu sécurité / privacy | AnonymizationGate |
| **Infrastructure** | Bus, tracing, observabilité | proposalTrace store, event bus |

**AnonymizationGate n'est pas le moteur #21.** Aucun moteur ne peut contourner cette gate pour alimenter UniversalLearningEngine.

## Procédure exceptionnelle — nouveau moteur

Un 21ᵉ moteur n'est autorisé que si **toutes** les conditions suivantes sont remplies :

1. **Besoin fondamental non couvable** par les 20 moteurs existants (pas une feature produit).
2. **Revue Architecture Guardian** complète (Q1–Q11).
3. **ADR** justifiant pourquoi absorption par un moteur existant est impossible.
4. **Validation humaine explicite** (comme ADR-0004).
5. Mise à jour Constitution si principe nouveau.

En l'absence de ces étapes : **REJET** — implémenter sous moteur ou service existant.

## Liste officielle des 20 moteurs

| # | ID | Moteur |
|---|-----|--------|
| 1 | `conversation-engine` | ConversationEngine |
| 2 | `intent-engine` | IntentEngine |
| 3 | `personal-language-memory-engine` | PersonalLanguageMemoryEngine |
| 4 | `human-model-engine` | HumanModelEngine |
| 5 | `household-engine` | HouseholdEngine |
| 6 | `planning-context-engine` | PlanningContextEngine |
| 7 | `constraint-engine` | ConstraintEngine |
| 8 | `availability-engine` | AvailabilityEngine |
| 9 | `goal-engine` | GoalEngine |
| 10 | `life-event-engine` | LifeEventEngine |
| 11 | `reasoning-engine` | ReasoningEngine |
| 12 | `decision-engine` | DecisionEngine |
| 13 | `action-proposal-engine` | ActionProposalEngine |
| 14 | `scheduler-engine` | SchedulerEngine |
| 15 | `recommendation-engine` | RecommendationEngine |
| 16 | `knowledge-engine` | KnowledgeEngine |
| 17 | `natural-response-engine` | NaturalResponseEngine |
| 18 | `notification-engine` | NotificationEngine |
| 19 | `universal-learning-engine` | UniversalLearningEngine |
| 20 | `outcome-observation-engine` | OutcomeObservationEngine |

## Conséquences

### Positives

- Base stable pour Sprint A2 (interfaces TypeScript) et migration A3+.
- Discipline : pas de proliferation de moteurs.
- Clarté onboarding architecture.

### Négatives

- Rigidité apparente — mitigée par procédure exceptionnelle.
- Pression sur OutcomeObservationEngine et AnonymizationGate pour tenir la boucle.

## Références

- ADR-0001, ADR-0002, ADR-0003, ADR-0004
- ADR-0006 (clarification frontières moteurs)
- [`architecture/contracts/00-index.md`](../contracts/00-index.md)
- [`Docs/PRE_IMPLEMENTATION_ARCHITECTURE_REVIEW.md`](../../Docs/PRE_IMPLEMENTATION_ARCHITECTURE_REVIEW.md)
