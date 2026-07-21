# OutcomeObservationEngine — Contrat

> ID : `outcome-observation-engine` · Pipeline #20 · **Non implémenté**  
> Référence : [`Docs/PRE_IMPLEMENTATION_ARCHITECTURE_REVIEW.md`](../../Docs/PRE_IMPLEMENTATION_ARCHITECTURE_REVIEW.md) · ADR-0004

## Mission

**Observer et classifier** les résultats réels après les propositions de l'IA : actions exécutées ou refusées, tâches complétées ou ignorées, recommandations acceptées ou rejetées, décisions confirmées ou annulées.

Produire des **signaux structurés** routés vers :
- **Personal Memory** (HumanModelEngine, GoalEngine, PersonalLanguageMemoryEngine) ;
- **Universal Learning** (via AnonymizationGate uniquement — jamais en direct).

Ce moteur **ne stocke pas** de mémoire long terme, **n'apprend pas** et **n'exécute pas** d'actions. Il ferme la **boucle de rétroaction** entre le monde réel et les moteurs de mémoire.

## Position dans le cerveau

```
Forward path (20 moteurs — moteur #20 = rétroaction) :
  Conversation → … → ActionProposal → [ActionExecution — hors cerveau]

Backward path (NOUVEAU) :
  [ActionExecution + UI + Conversation] → OutcomeObservationEngine
       ├─ Personal Memory  → HumanModel / Goal / PLM
       └─ Universal path   → AnonymizationGate → UniversalLearningEngine
```

## Entrées

| Entrée | Type conceptuel | Source |
|--------|-----------------|--------|
| `outcomeEvents[]` | Événements bruts post-action | Couche ActionExecution, UI, calendrier |
| `proposalTrace` | Référence à la proposition IA (id, type, moteur source) | ActionProposalEngine, ReasoningEngine, RecommendationEngine |
| `memberId` | Membre concerné (Personal path uniquement) | HouseholdEngine |
| `conversationOutcome` | Confirmation / rejet / correction en conversation | ConversationEngine |
| `recommendationOutcome` | Accepté, ignoré, reporté, rejeté | UI / services |
| `taskOutcome` | Complété, skip, reporté, partiel | Planning services / calendrier |

## Sorties

| Sortie | Type conceptuel | Consommateur(s) |
|--------|-----------------|-----------------|
| `BehaviorSignal[]` | Signaux comportementaux personnels | HumanModelEngine |
| `GoalFeedbackSignal[]` | Efficacité missions / priorités | GoalEngine |
| `LanguageConfirmationSignal` | Confirmation / rejet expression PLM | PersonalLanguageMemoryEngine |
| `AnonymizedCandidate[]` | Candidats **pré-classifiés** sans PII | AnonymizationGate (infra) |
| `OutcomeMetrics` | Métriques agrégées par type de proposition (sans PII) | Robot QA, Health Score (futur) |

## Dépendances

| Moteur / couche | Relation | Obligatoire |
|-----------------|----------|-------------|
| ActionExecution (couche services) | Émet `outcomeEvents` | Oui |
| ConversationEngine | Confirmations, pending resolved | Oui |
| HouseholdEngine | Scope membre / foyer | Oui |
| HumanModelEngine | Aval Personal Memory | Oui (write signals) |
| GoalEngine | Aval Personal Memory | Non |
| PersonalLanguageMemoryEngine | Aval Personal Memory | Non |
| AnonymizationGate | Aval Universal path — **seul chemin vers ULE** | Oui pour contribution Universal |
| UniversalLearningEngine | **Aucun accès direct** | Interdit |
| ReasoningEngine / RecommendationEngine | Lecture `proposalTrace` metadata only | Non (amont référence) |

## Responsabilités

- Corréler une **proposition IA** à son **résultat observé** (succès, échec, ignore, report).
- Classifier chaque outcome : `personal_only` | `universal_candidate` | `discard`.
- Appliquer **Q11 au moment du routage** — jamais de mélange dans un même signal.
- Produire `BehaviorSignal[]` conformes au contrat HumanModelEngine.
- Mesurer l'**efficacité des recommandations** (taux acceptation, report, rejet par catégorie — agrégé foyer).
- Mesurer l'**efficacité des décisions** (confirmation vs annulation post-Reasoning).
- Détecter les patterns **généralisables** candidats Universal (sans extraire PII).
- Émettre métriques pour QA et amélioration continue **sans** stocker contenu identifiable.

## Ce qu'il ne doit jamais faire

- Stocker des données long terme (→ moteurs mémoire ou stores dédiés).
- Écrire directement dans UniversalLearningEngine (→ AnonymizationGate obligatoire).
- Inférer ou propager des PII vers le chemin Universal.
- Modifier le planning, exécuter des actions ou reformuler des réponses.
- Apprendre ou ajuster des poids (→ HumanModel, GoalEngine, ULE en aval).
- Contourner AnonymizationGate pour « accélérer » l'apprentissage collectif.
- Agréger des outcomes multi-foyers sans anonymisation.

## Interfaces publiques (cibles)

```typescript
interface IOutcomeObservationEngine {
  /** Enregistrer un événement brut post-exécution */
  recordOutcome(event: OutcomeEvent): void;

  /** Corréler proposition IA ↔ résultat observé */
  correlate(proposalId: string, outcome: ObservedOutcome): CorrelationResult;

  /** Produire signaux Personal Memory pour un membre */
  emitBehaviorSignals(memberId: string, since?: Date): BehaviorSignal[];

  /** Produire candidats Universal (sans PII) — amont AnonymizationGate */
  emitAnonymizedCandidates(batch: OutcomeBatch): AnonymizedCandidate[];

  /** Métriques efficacité (foyer ou produit agrégé) */
  getEffectivenessMetrics(scope: MetricsScope): OutcomeMetrics;
}
```

| Méthode | Description |
|---------|-------------|
| `recordOutcome` | Point d'entrée unique des événements bruts |
| `correlate` | Lie une proposition à son résultat |
| `emitBehaviorSignals` | Alimente HumanModelEngine |
| `emitAnonymizedCandidates` | Alimente AnonymizationGate — **pas ULE** |
| `getEffectivenessMetrics` | Mesure continue sans PII |

## Événements émis

| Événement | Payload | Quand |
|-----------|---------|-------|
| `outcome.recorded` | `{ proposalId, outcomeType, route }` | Outcome classifié |
| `outcome.behaviorSignal.emitted` | `{ memberId, signalCount }` | Vers HumanModel |
| `outcome.universalCandidate.emitted` | `{ candidateCount, gateTarget }` | Vers AnonymizationGate |
| `outcome.effectiveness.updated` | `{ metricType, value }` | Métrique recalculée |
| `outcome.correlation.failed` | `{ proposalId, reason }` | Proposition sans trace |

## Événements consommés

| Événement | Action |
|-----------|--------|
| `action.executed` | Corréler succès / échec exécution |
| `action.rejected` | Enregistrer refus utilisateur |
| `decision.approved` / `decision.rejected` | Feedback décision |
| `decision.confirmation.required` → résolu | Confirmation ou annulation |
| `conversation.pending.resolved` | Outcome pending action |
| `task.completed` / `task.skipped` / `task.deferred` | Signaux comportement planning |
| `recommendation.accepted` / `recommendation.dismissed` | Efficacité recommandations |
| `notification.dismissed` / `notification.acted` | Feedback canal proactif |
| `language.expression.confirmed` / `.rejected` | Signal PLM |

## Mapping code actuel

| Fichier | Rôle | Écart |
|---------|------|-------|
| — | **Aucune implémentation** | Moteur absent |
| `src/ai/habits/buildHabitProfile.ts` | Infère habitudes depuis calendrier | **Producteur implicite** — à router via OutcomeObservation |
| `task_activity_events` (Supabase) | Événements activité | Source brute potentielle |
| `conversation.pending.resolved` (contrat Conversation) | Pending résolu | Événement défini, consommateur absent |

## Chevauchements identifiés

| Avec | Nature | Résolution |
|------|--------|------------|
| HumanModelEngine | HM **consomme** behaviorSignals ; OO **produit** | OO = producteur ; HM = store/modèle |
| UniversalLearningEngine | ULE apprend ; OO observe | OO → AnonymizationGate → ULE ; jamais direct |
| PersonalLanguageMemoryEngine | PLM apprend expressions ; OO signale confirmations | OO émet signaux ; PLM décide apprentissage |
| GoalEngine | Objectifs et missions | OO mesure efficacité ; GoalEngine ajuste poids |
| ConversationEngine | Confirmations conversationnelles | Conversation émet ; OO agrège multi-sources |
| buildHabitProfile | Inférence habitudes inline | Migrer vers OO → HumanModel |

## Invariants (tests futurs)

1. Aucun `AnonymizedCandidate` ne contient de PII (testé avant AnonymizationGate).
2. Aucun appel direct à `UniversalLearningEngine.submitAnonymizedSignal` depuis OO.
3. Tout outcome `universal_candidate` passe par `anonymization.gate.passed` ou est rejeté.
4. `proposalTrace` permet de corréler ≥ 95 % des actions explicites de l'IA.
5. Q11 respectée : un signal ne mélange jamais Personal et Universal.
