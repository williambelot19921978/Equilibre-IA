# ADR-0003 : Dual Memory — Personal vs Universal Learning

> Statut : **accepted**  
> Date : 2026-07-18  
> Décideurs : Validation architecture — Universal Learning Engine

## Contexte

Équilibre IA doit s'améliorer collectivement (langage, raisonnement, planification) sans jamais partager données privées entre foyers. Le code actuel mélange mémoire personnelle (PLM, living memory, profile facts) sans frontière formelle vers un apprentissage global.

## Problème

Comment permettre l'intelligence collective tout en garantissant que **les données personnelles ne quittent jamais le foyer** ?

## Options

### Option A — Pas d'apprentissage global

Chaque foyer apprend isolément. Pas d'amélioration collective.

### Option B — Dual Memory strict (Personal + Universal)

Deux stores séparés, pipeline anonymisation, UniversalLearningEngine dédié.

### Option C — Federated learning opaque

Modèles entraînés distribués sans store explicite.

## Choix

**Option B — Dual Memory strict**

- **Personal Memory** : HumanModel, Household, PLM, planning, objectifs — RLS foyer.
- **Universal Learning** : UniversalLearningEngine — connaissances généralisables uniquement.
- **Mélange interdit** — gate anonymisation obligatoire pour toute contribution.

## Conséquences

### Positives

- Confiance utilisateur (Constitution ch. 18)
- Amélioration produit mesurable
- Auditabilité (Robot QA contrôle PII)
- Aligné RGPD (minimisation, séparation)

### Négatives

- Complexité architecture
- Pipeline agrégation à construire (UL-3)
- Risque erreur anonymisation — mitigé par validation §7 + QA

## Alternatives rejetées

- **Option A** : limite intelligence collective — rejeté par vision produit
- **Option C** : opacité, difficile à auditer — rejeté pour phase actuelle

## Références

- [`Docs/UNIVERSAL_LEARNING_ENGINE.md`](../../Docs/UNIVERSAL_LEARNING_ENGINE.md)
- Constitution ch. 22
- [`architecture/contracts/universal-learning-engine.md`](../contracts/universal-learning-engine.md)
