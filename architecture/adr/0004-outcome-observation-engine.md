# ADR-0004 : OutcomeObservationEngine — boucle de rétroaction

> Statut : **accepted**  
> Date : 2026-07-18 · Validé humainement : 2026-07-18  
> Décideurs : Revue pré-implémentation (Architecture Guardian) — validation produit

> **Note historique :** rédigé au moment de l'ajout du moteur #20. Architecture figée : **20 moteurs** (ADR-0005).

## Contexte

Sprint A1 + Universal Learning (ADR-0003) avaient défini le pipeline **forward** avant OutcomeObservationEngine (#20).

La revue CTO pré-implémentation (juillet 2026) identifie une **capacité fondamentale absente** : l'**observation des résultats** et la **rétroaction structurée** vers Personal Memory et Universal Learning.

Symptômes documentés :

- `HumanModelEngine` déclare `behaviorSignals[]` en entrée **sans producteur contracté** ;
- `UniversalLearningEngine` expose `submitAnonymizedSignal` **sans amont** (AnonymizationGate non contracté, aucun émetteur) ;
- Aucune mesure d'**efficacité des recommandations** ou des **décisions** ;
- Pas de boucle « l'IA apprend de ses propres propositions **via leurs résultats** » ;
- Logique d'inférence comportementale dispersée (`buildHabitProfile`, événements calendrier).

## Problème

Comment fermer la boucle d'**amélioration continue** sans violer Dual Memory (Q11) et sans confondre observation, apprentissage et exécution ?

## Options

### Option A — Pas de moteur dédié ; services ad hoc

Les services d'exécution poussent directement vers HumanModel et ULE.

**Rejeté** : mélange Q11 garanti, pas de corrélation proposition↔résultat, dette identique au legacy mesh.

### Option B — Étendre HumanModelEngine

HumanModel observe et apprend de tout.

**Rejeté** : viole SRP — HumanModel = **modèle**, pas capteur système ; ne route pas vers Universal ; ne mesure pas efficacité cross-moteur.

### Option C — Étendre UniversalLearningEngine

ULE observe les outcomes et apprend.

**Rejeté** : ULE ne doit **jamais** lire Personal Memory ; mélange observation personnelle et agrégation universelle ; violation ADR-0003.

### Option D — OutcomeObservationEngine dédié (#20)

Moteur de **rétroaction** : observe, classifie, route. N'apprend pas, ne stocke pas.

**Retenu.**

## Choix

**Option D — OutcomeObservationEngine** comme 20ᵉ moteur du cerveau.

| Chemin | Flux |
|--------|------|
| **Personal** | OO → `BehaviorSignal[]` → HumanModelEngine / GoalEngine / PLM |
| **Universal** | OO → `AnonymizedCandidate[]` → **AnonymizationGate** (infra) → ULE |

OutcomeObservationEngine est le **seul producteur autorisé** de candidats Universal depuis l'observation runtime (sous réserve gate).

## Conséquences

### Positives

- Boucle d'apprentissage **complète** et auditable ;
- Q11 appliquée **à la source** du routage ;
- Mesure efficacité recommandations et décisions ;
- HumanModel `behaviorSignals[]` a un propriétaire clair ;
- ULE peut recevoir des signaux **sans** lire Personal Memory ;
- Robot QA peut vérifier absence PII en amont gate ;
- Évolutivité 10 ans : métriques, Health Score, amélioration continue.

### Négatives

- 20 moteurs au lieu de 19 — complexité documentaire accrue ;
- Nécessite **proposalTrace** sur les propositions IA (instrumentation A2+) ;
- AnonymizationGate reste à contracter (infra Sprint UL-2) ;
- ActionExecution layer doit émettre événements standardisés.

### Neutres

- ActionExecution reste **hors cerveau** (couche services) ;
- AnonymizationGate n'est **pas** le 21ᵉ moteur — c'est un **pare-feu infrastructure**.

## Alternatives rejetées

- **Option A, B, C** — voir ci-dessus.

## Critères de succès (post-implémentation)

1. ≥ 95 % des actions IA traçables jusqu'à un outcome observé.
2. Zero appel direct OO → ULE.
3. Robot QA UL-1 à UL-8 passent sur le pipeline feedback.
4. Métriques efficacité disponibles sans PII.

## Références

- [`architecture/contracts/outcome-observation-engine.md`](../contracts/outcome-observation-engine.md)
- [`Docs/PRE_IMPLEMENTATION_ARCHITECTURE_REVIEW.md`](../../Docs/PRE_IMPLEMENTATION_ARCHITECTURE_REVIEW.md)
- ADR-0003 Dual Memory
- Constitution ch. 14, 22
- Architecture Guardian Q11
