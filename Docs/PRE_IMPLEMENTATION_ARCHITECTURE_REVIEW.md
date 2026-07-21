# Revue CTO — Complétude de l'architecture cerveau

> **Snapshot historique** (juillet 2026, pré-gel 20 moteurs) — architecture de référence : Constitution v1.4, ADR-0005.  
> Auteur : Revue architecture (rôle CTO / architecte principal)  
> Périmètre : 19 moteurs + Dual Memory + viabilité 10 ans  
> Action : **documentation uniquement** — aucun `src/` modifié

---

## Réponses aux six questions

### 1. Le cerveau est-il complet ?

**Presque — pas encore.**

Les **19 moteurs** couvrent intégralement le pipeline **forward** : percevoir, comprendre, contextualiser, planifier, décider, proposer, répondre, notifier, apprendre collectivement (Universal Learning en **lecture**).

Il manque le pipeline **backward** : **observer ce qui s'est passé après les propositions de l'IA** et en déduire des signaux structurés pour Personal Memory et Universal Learning.

Sans cette boucle, le cerveau est un système **open-loop** — capable de raisonner, incapable de s'améliorer de manière fiable à partir de l'expérience.

---

### 2. Manque-t-il une capacité fondamentale ?

**Oui — une seule.**

| Capacité manquante | Moteur proposé |
|--------------------|----------------|
| Observation des résultats, corrélation proposition↔outcome, routage feedback Personal/Universal, mesure d'efficacité | **OutcomeObservationEngine** (#20) |

**Pourquoi indispensable :**

- `HumanModelEngine` attend `behaviorSignals[]` — **personne ne les produit** ;
- `UniversalLearningEngine` attend `anonymizedSignals[]` — **personne ne les produit** (AnonymizationGate absent) ;
- Les recommandations, décisions et actions n'ont **aucun retour contracté** ;
- `buildHabitProfile` infère en silo — pattern exact de la dette legacy.

**Pourquoi non absorbable par un moteur existant :**

| Moteur | Raison du refus |
|--------|-----------------|
| HumanModelEngine | Stocke le modèle ; n'observe pas le système |
| UniversalLearningEngine | Interdit de lire Personal Memory ; agrège, n'observe pas |
| ConversationEngine | Ne voit que le dialogue, pas task.completed ni recommendation.dismissed |
| ReasoningEngine | Forward-only ; mélanger rétrospective = dette |
| NotificationEngine | Canal sortant, pas capteur d'efficacité global |

**Intégration :**

```
ActionExecution + UI + Conversation
         ↓ (événements)
OutcomeObservationEngine (#20)
    ├─ Personal  → HumanModel / Goal / PLM
    └─ Universal → AnonymizationGate → UniversalLearningEngine
```

Contrat : [`architecture/contracts/outcome-observation-engine.md`](../architecture/contracts/outcome-observation-engine.md)  
ADR : [`architecture/adr/0004-outcome-observation-engine.md`](../architecture/adr/0004-outcome-observation-engine.md)

**Ce qui n'est PAS un 21ᵉ moteur :**

- **AnonymizationGate** — pare-feu PII (infrastructure, Sprint UL-2) ;
- **ActionExecutionLayer** — exécution hors cerveau (services, événements vers OO).

---

### 3. L'architecture est-elle viable sur dix ans ?

**Oui, sous conditions.**

| Facteur | Évaluation |
|---------|------------|
| Modularité forward | ✅ Excellente — 19 responsabilités bounded |
| Dual Memory | ✅ Solide — ADR-0003, Q11, Robot QA §3.1 |
| Boucle apprentissage | ⚠️ **Bloquée** sans #20 |
| Event-driven async | ⚠️ Events par moteur, pas de bus global |
| Legacy migration | ⚠️ 4 monolithes (~planningEngine, lifeEngine, memoryEngine, actionResolver) |
| Extensibilité modules | ✅ Recommendation plugins, Spiritualité optionnelle |
| Privacy / confiance | ✅ Architecture privacy-by-design |

**Projection 10 ans :** avec #20 + event bus + migration progressive (ADR-0001), l'architecture tient. Sans #20, l'intelligence « qui s'améliore avec le temps » reste **déclarative**, pas **opérationnelle**.

---

### 4. Quels sont les risques majeurs ?

| # | Risque | Gravité | Mitigation |
|---|--------|---------|------------|
| R1 | Boucle feedback jamais implémentée | **Critique** | OutcomeObservationEngine #20 |
| R2 | Fuite PII vers Universal via feedback | **Critique** | AnonymizationGate + Q11 à la source + Robot QA UL-* |
| R3 | Legacy mesh bloque instrumentation | Haute | Scission ordonnée A2 (PlanningContext → Constraint → Availability → Scheduler) |
| R4 | 3 chemins Reasoning parallèles | Haute | Unification sous ReasoningEngine avant proactive scale |
| R5 | Scheduler ↔ DecisionEngine ordering ambigu | Moyenne | ADR ordering canonique |
| R6 | PLM vs IntentEngine conflits non arbitrés | Moyenne | Règles explicites A2 |
| R7 | GoalEngine absent du code | Moyenne | Migration memory/* en parallèle A2 |
| R8 | proposalTrace absent → corrélation impossible | Haute | Instrumentation ActionProposal + Reasoning |
| R9 | Confusion Personal Language vs Universal | Moyenne | Doc §10 + OO routage strict |

---

### 5. Peut-on lancer sereinement le Sprint A2 ?

**Oui — avec réserves documentées.**

| Sprint A2 — GO | Sprint A2 — en parallèle |
|----------------|--------------------------|
| Interfaces TypeScript `src/ai/contracts/` | Validation humaine ADR-0004 |
| Scission forward path (priorité planning) | Contrat OutcomeObservationEngine (#20) |
| Tests unitaires par interface | Schéma `proposalTrace` + événements outcome |
| ADR ordering Scheduler/Decision | Roadmap AnonymizationGate (UL-2) |

**Ne pas attendre #20 pour démarrer A2** — mais **ne pas figer l'architecture à 19** avant validation #20.

---

### 6. L'Architecture Guardian recommande-t-il de figer définitivement cette architecture ?

**Non — pas à 19 moteurs.**

**Oui — à 20 moteurs** après :

1. Validation humaine ADR-0004 ;
2. Documentation AnonymizationGate (infra) ;
3. Clarification des 3 ambiguïtés (Scheduler/Decision, Reasoning leadership, PLM/Intent).

Verdict Guardian : **APPROVED WITH RECOMMENDATIONS**  
Document : [`architecture/decisions/2026-07-18-pre-implementation-review.md`](../architecture/decisions/2026-07-18-pre-implementation-review.md)

---

## Analyse des 19 moteurs (+ #20 proposé)

Légende scores : **Faible / Moyen / Élevé / Critique**

| # | Moteur | Mission claire | Unique | Découplé | Chevauchement | Verdict |
|---|--------|----------------|--------|----------|---------------|---------|
| 1 | ConversationEngine | ✅ | ⚠️ | Moyen | PLM, NaturalResponse, pending | Garder — clarifier orchestration |
| 2 | IntentEngine | ✅ | ✅ | Bon | PLM, colloquialRegistry | Garder — arbitrage PLM |
| 3 | PersonalLanguageMemoryEngine | ✅ | ✅ | Bon | Intent, NaturalResponse | Garder — Personal only |
| 4 | HumanModelEngine | ✅ | ⚠️ | Faible | memoryEngine monolithe, Goal | **Scinder** du legacy |
| 5 | HouseholdEngine | ✅ | ✅ | Bon | LifeEvent périodes | Garder |
| 6 | PlanningContextEngine | ✅ | ✅ | Faible | memoryEngine, LifeEvent | **Extraire** legacy |
| 7 | ConstraintEngine | ✅ | ✅ | Faible | planningEngine inline | **Extraire** |
| 8 | AvailabilityEngine | ✅ | ✅ | Faible | lifeEngine.scoreFreeSlot | **Extraire** |
| 9 | GoalEngine | ✅ | ⚠️ | Moyen | HumanModel goals, memory/* | Garder — **implémenter** |
| 10 | LifeEventEngine | ✅ | ⚠️ | Faible | lifeEngine monolithe | **Scinder** |
| 11 | ReasoningEngine | ✅ | ⚠️ | Faible | 3 chemins parallèles, Recommendation | Garder — **unifier** |
| 12 | DecisionEngine | ✅ | ✅ | Bon | validation inline planning | Garder — consolider |
| 13 | ActionProposalEngine | ✅ | ⚠️ | Moyen | actionResolver + NaturalResponse | Garder — scinder formatage |
| 14 | SchedulerEngine | ✅ | ✅ | Faible | planningEngine ~1150 lignes | Garder — **extraire** |
| 15 | RecommendationEngine | ✅ | ⚠️ | Faible | 5+ suggestion engines | Garder — facade |
| 16 | KnowledgeEngine | ✅ | ✅ | Bon | ULE (distinct) | Garder — à implémenter |
| 17 | NaturalResponseEngine | ✅ | ⚠️ | Moyen | formatAssistantReply ailleurs | Garder — extraire |
| 18 | NotificationEngine | ✅ | ✅ | Bon | proactiveCoach | Garder — Sprint 6 |
| 19 | UniversalLearningEngine | ✅ | ✅ | Bon | PLM, colloquialRegistry | Garder — **write-dead sans #20** |
| **20** | **OutcomeObservationEngine** | ✅ | ✅ | Bon | HM, ULE, PLM (producteur) | **Ajouter** |

---

## Évaluation détaillée (19 moteurs existants)

| # | Moteur | Importance | Couplage | Complexité | Évolutivité | Risque dette |
|---|--------|------------|----------|------------|-------------|--------------|
| 1 | ConversationEngine | Critique | Élevé | Moyen | Moyen | Élevé |
| 2 | IntentEngine | Critique | Moyen | Moyen | Élevé | Moyen |
| 3 | PersonalLanguageMemoryEngine | Élevé | Moyen | Moyen | Élevé | Moyen |
| 4 | HumanModelEngine | Critique | Élevé | Élevé | Moyen | **Critique** |
| 5 | HouseholdEngine | Critique | Moyen | Moyen | Élevé | Élevé |
| 6 | PlanningContextEngine | Critique | Élevé | Moyen | Moyen | **Critique** |
| 7 | ConstraintEngine | Critique | Moyen | Élevé | Élevé | Élevé |
| 8 | AvailabilityEngine | Critique | Moyen | Élevé | Élevé | Élevé |
| 9 | GoalEngine | Élevé | Moyen | Moyen | Élevé | Élevé |
| 10 | LifeEventEngine | Élevé | Élevé | Moyen | Élevé | Élevé |
| 11 | ReasoningEngine | Critique | Élevé | Élevé | Moyen | **Critique** |
| 12 | DecisionEngine | Critique | Faible | Élevé | Élevé | Moyen |
| 13 | ActionProposalEngine | Critique | Moyen | Moyen | Élevé | Élevé |
| 14 | SchedulerEngine | Critique | Moyen | **Critique** | Moyen | **Critique** |
| 15 | RecommendationEngine | Élevé | Élevé | Moyen | Élevé | Élevé |
| 16 | KnowledgeEngine | Moyen | Faible | Moyen | Élevé | Faible |
| 17 | NaturalResponseEngine | Critique | Moyen | Moyen | Élevé | Élevé |
| 18 | NotificationEngine | Moyen | Faible | Moyen | Élevé | Faible |
| 19 | UniversalLearningEngine | Élevé | Faible | Élevé | Élevé | Élevé |

| #20 proposé | OutcomeObservationEngine | Critique | Faible | Moyen | Élevé | Faible* |

*\*Faible si implémenté tôt ; **Critique** si omis.*

---

## Analyse par moteur (synthèse CTO)

### Couche compréhension (1–3)

**ConversationEngine** — Orchestrateur de session. Mission claire mais risque d'**over-engineering orchestration** si tout transite par lui. Trop gros ? **Non**, tant qu'il ne parse pas ni n'exécute. Fusion ? Non. Découpage ? Possible extraction « SessionManager » plus tard — pas prioritaire.

**IntentEngine** — Classification + entités. Unique et bien borné. Chevauchement PLM : **PLM upstream, Intent arbitre en cas de conflit** — à formaliser.

**PersonalLanguageMemoryEngine** — Correctement isolé Personal Memory. Ne doit **jamais** alimenter ULE directement — promotion manuelle via OO + gate si pattern généralisable.

### Couche contexte (4–6)

**HumanModelEngine** — **Trop gros dans le code** (fusionné avec PlanningContext). Contrat correct. Scission legacy **obligatoire**.

**HouseholdEngine** — Entité centrale bien placée. `memberAvailabilityHints` chevauche Availability — OK si hints = input brut, scoring = Availability.

**PlanningContextEngine** — Read-only snapshot. Bon decoupling conceptuel ; **mauvais dans le code**.

### Couche planning (7–10)

**ConstraintEngine / AvailabilityEngine / SchedulerEngine** — Triplet sain. Problème = **monolithe planningEngine**, pas les contrats. Scheduler trop gros ? **Oui en code**, non en concept.

**GoalEngine** — Trop petit **dans le code** (quasi absent). Mission claire vs HumanModel : HM = état personne, Goal = priorités et missions. **Ne pas fusionner**.

**LifeEventEngine** — Chevauche lifeEngine et Availability (dayType). Scission nécessaire.

### Couche décision (11–13)

**ReasoningEngine** — **Trop fragmenté en code** (3 chemins). Contrat bon. Priorité unification.

**DecisionEngine** — Gatekeeper solide. Ordering avec Scheduler à figer.

**ActionProposalEngine** — Bon boundary. Manque **proposalTrace** pour #20.

### Couche proposition (14–16)

**RecommendationEngine** — Facade nécessaire sur 5+ engines. Planning First respecté.

**KnowledgeEngine** — Distinct de ULE. Place correcte.

### Couche expression (17–18)

**NaturalResponseEngine** — Dernier moteur cerveau. Extraire formatage de actionResolver.

**NotificationEngine** — Canal parallèle. Outcomes → #20, pas Notification.

### Couche apprentissage (19 + 20)

**UniversalLearningEngine** — Bien défini en invariants. **Incomplet sans producteur**.

**OutcomeObservationEngine** — **Manquant. Indispensable.**

---

## Boucle d'apprentissage — état actuel vs cible

```
AUJOURD'HUI (incomplet)                 CIBLE (20 moteurs)

User → Forward pipeline → Action        User → Forward → Action
         ↓ (rien)                                ↓
    [silence]                            OutcomeObservationEngine
                                              ├→ Personal Memory
PLM ← confirm manuelle                      └→ AnonymizationGate → ULE
HM  ← corrections UI
ULE ← (vide)
```

| Segment | Aujourd'hui | Avec #20 |
|---------|-------------|----------|
| Expression personnelle | PLM + confirmation | PLM + OO signale confirmations |
| Modèle humain | Corrections UI seules | behaviorSignals continus |
| Objectifs | Statiques | GoalFeedback ajuste poids |
| Universal | Lookup only | Candidats anonymisés alimentés |
| Efficacité reco | Non mesurée | OutcomeMetrics |
| Décisions IA | Non tracées | correlate(proposalId, outcome) |

---

## Fusions / découpages recommandés

| Action | Moteurs | Recommandation |
|--------|---------|----------------|
| Fusionner Goal → HumanModel | 4 + 9 | **NON** — responsabilités distinctes |
| Fusionner LifeEvent → Household | 5 + 10 | **NON** — declare vs structure |
| Fusionner Knowledge → ULE | 16 + 19 | **NON** — web vs collectif |
| Fusionner Reasoning → Decision | 11 + 12 | **NON** — créatif vs déterministe |
| Scinder planningEngine | 7, 8, 14 | **OUI** — extraction code |
| Scinder memoryEngine | 4, 6 | **OUI** — extraction code |
| Scinder actionResolver | 13, 17 | **OUI** — extraction code |
| Ajouter OutcomeObservation | **#20** | **OUI** — capacité fondamentale |

**Nombre optimal : 20 moteurs** — ni 19 (incomplet), ni 25 (sur-découpage).

---

## Documents produits par cette revue

| Fichier | Rôle |
|---------|------|
| [`Docs/PRE_IMPLEMENTATION_ARCHITECTURE_REVIEW.md`](./PRE_IMPLEMENTATION_ARCHITECTURE_REVIEW.md) | Ce rapport |
| [`architecture/decisions/2026-07-18-pre-implementation-review.md`](../architecture/decisions/2026-07-18-pre-implementation-review.md) | Verdict Guardian |
| [`architecture/contracts/outcome-observation-engine.md`](../architecture/contracts/outcome-observation-engine.md) | Contrat moteur #20 |
| [`architecture/adr/0004-outcome-observation-engine.md`](../architecture/adr/0004-outcome-observation-engine.md) | ADR (proposed) |

---

## Conclusion CTO

L'architecture forward d'Équilibre IA est **l'une des plus solides que j'aie vues pour un assistant de vie** à ce stade de maturité — DAG clair, Dual Memory, Planning First, gatekeeper Decision, séparation LLM/déterministe.

La faiblesse découverte **aujourd'hui plutôt que dans deux ans** est la **boucle de rétroaction** : sans elle, la promesse « plus intelligente avec le temps » repose sur des confirmations manuelles et des migrations ad hoc — exactement le pattern qui a produit le legacy mesh actuel.

**Une capacité fondamentale manque. Un moteur suffit. L'architecture mérite d'être figée à 20 — pas à 19.**

---

*Revue CTO pré-implémentation v1.0 — 18 juillet 2026*
