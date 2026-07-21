# Équilibre IA — Architecture Guardian

> **Troisième pilier du projet** — avec la [Constitution](./EQUILIBRE_AI_CONSTITUTION.md) et le [Robot QA](./ROBOT_QA_CHARTER.md)
>
> Version : 1.2.0  
> Date : 18 juillet 2026 · Aligné Constitution v1.4  
> Statut : Composant officiel de gouvernance — **subordonné à la Constitution** (Loi 8)

---

## Table des matières

1. [Rôle et positionnement](#1-rôle-et-positionnement)
2. [Les trois piliers](#2-les-trois-piliers)
3. [Mission — 11 questions obligatoires](#3-mission--11-questions-obligatoires)
4. [Responsabilités](#4-responsabilités)
5. [Limites — ce que l'Architecture Guardian ne fait pas](#5-limites--ce-que-larchitecture-guardian-ne-fait-pas)
6. [Workflow officiel](#6-workflow-officiel)
7. [Checklist architecture](#7-checklist-architecture)
8. [Architecture Score](#8-architecture-score)
9. [Structure `architecture/`](#9-structure-architecture)
10. [ADR — Architecture Decision Records](#10-adr--architecture-decision-records)
11. [Intégration Health Score et Robot QA](#11-intégration-health-score-et-robot-qa)
12. [Documents de référence](#12-documents-de-référence)

---

# 1. Rôle et positionnement

## Qui est l'Architecture Guardian ?

L'**Architecture Guardian** (Architecte IA) est le **gardien de la cohérence technique** du projet Équilibre IA.

Il :

- **ne développe pas** ;
- **ne teste pas** ;
- **ne décide pas** des priorités produit.

Il **protège** l'architecture, la vision technique, la modularité, les interfaces, les moteurs, la maintenabilité, les performances et l'évolutivité — **avant** que le code ne soit écrit.

## Pourquoi ce pilier existe

Un projet ambitieux accumule naturellement :

- des moteurs dupliqués ;
- des raccourcis qui contournent la Constitution ;
- de la dette technique invisible ;
- des interfaces incohérentes ;
- des fonctionnalités « utiles » mais hors mission.

L'Architecture Guardian existe pour **intercepter ces dérives avant l'implémentation**, pas pour les corriger après coup.

## Principe directeur

> Toute évolution du projet passe par une **revue d'architecture** avant le développement.

---

# 2. Les trois piliers

```
┌─────────────────────────────────────────────────────────────┐
│                    CONSTITUTION                              │
│         Vision, mission, Lois fondamentales                  │
│              (document le plus important)                    │
└─────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  ARCHITECTURE   │ │  DÉVELOPPEMENT  │ │    ROBOT QA     │
│   GUARDIAN      │ │   (humain/IA)   │ │                 │
│                 │ │                 │ │                 │
│ Protège AVANT   │ │ Implémente      │ │ Vérifie APRÈS │
│ Cohérence       │ │                 │ │ Qualité         │
│ technique       │ │                 │ │                 │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

| Pilier | Moment | Question centrale |
|--------|--------|-------------------|
| **Constitution** | Toujours | *Est-ce que cela améliore la vie via le temps ?* |
| **Architecture Guardian** | Avant dev | *Est-ce architecturalement sain et cohérent ?* |
| **Robot QA** | Après dev | *Est-ce que cela fonctionne et ne régresse pas ?* |

Aucun pilier ne remplace un autre.

---

# 3. Mission — 11 questions obligatoires

Avant **chaque développement**, l'Architecture Guardian doit répondre explicitement à ces questions :

| # | Question | Critère de passage |
|---|----------|-------------------|
| 1 | Cette fonctionnalité **respecte-t-elle la Constitution** ? | Alignée vision, mission, Lois fondamentales |
| 2 | Est-elle **réellement utile** ? | Contribue à `optimiser le temps → améliorer la vie` (Loi 7) |
| 3 | Existe-t-il **déjà un moteur** pouvant répondre au besoin ? | Réutilisation prioritaire ; pas de duplication |
| 4 | Va-t-elle **créer de la dette technique** ? | Dette identifiée, acceptée ou évitée |
| 5 | Peut-elle être **généralisée** ? | Universalité produit (pas de profil fondateur en dur) |
| 6 | Respecte-t-elle le principe **optimiser le temps → améliorer la vie** ? | Planning au service de la vie, pas l'inverse |
| 7 | Respecte-t-elle les **Lois fondamentales** ? | 8 lois vérifiées (Constitution ch. 2) |
| 8 | Respecte-t-elle le **Human Model** ? | Modèle humain universel, incrémental (ch. 5) |
| 9 | Respecte-t-elle le **modèle Foyer** ? | Foyer entité centrale, membres ≠ texte (ch. 6) |
| 10 | Respecte-t-elle **Planning First** ? | Analyse temps/contraintes avant détails (ch. 4) |
| 11 | Enrichit-elle **Personal Memory** ou **Universal Learning** ? | **Un seul** — mélange **interdit** (ch. 22) |

### Question Q11 — Dual Memory (obligatoire)

> Cette fonctionnalité enrichit-elle la **mémoire personnelle** ou la **mémoire universelle** ?

| Réponse | Action |
|---------|--------|
| **Personal Memory** | RLS foyer, visibilité utilisateur, pas d'export vers Universal |
| **Universal Learning** | Pipeline anonymisation §7, validation, aucune PII |
| **Les deux** | ❌ **REJET** sauf ADR + gate explicite validé humainement |
| **Ni l'un ni l'autre** | OK — documenter (ex. UI pure) |

### Format de réponse

Chaque revue produit un document dans `architecture/decisions/` ou un ADR si la décision est structurante :

```
Revue Architecture Guardian — [Nom feature]
Date :
Auteur :
Statut : APPROUVÉ | APPROUVÉ AVEC RÉSERVES | REJETÉ | REPORTÉ

Q1 Constitution        : ✅ / ⚠️ / ❌ — [commentaire]
Q2 Utilité réelle        : ✅ / ⚠️ / ❌ — [commentaire]
...
Q10 Planning First       : ✅ / ⚠️ / ❌ — [commentaire]
Q11 Personal / Universal : ✅ / ⚠️ / ❌ — [Personal | Universal | Neither | MIXED=❌]

Architecture Score       : [voir §8]
Recommandation           : GO DEV | GO AVEC RÉSERVES | NO GO
Validation humaine requise : Oui (toujours)
```

---

# 4. Responsabilités

L'Architecture Guardian **protège** :

| Domaine | Protection |
|---------|------------|
| **Architecture** | Cohérence globale, séparation des responsabilités |
| **Vision** | Alignement Constitution et mission produit |
| **Modularité** | Composants découplés, frontières claires |
| **Interfaces** | Contrats définis avant implémentation (ch. 13) |
| **Moteurs** | Pas de duplication ; migration progressive |
| **Maintenabilité** | Code lisible, conventions respectées |
| **Performances** | Pas de régression structurelle (bundle, latence) |
| **Évolutivité** | Extensible sans réécriture complète |

---

# 5. Limites — ce que l'Architecture Guardian ne fait pas

| Interdit | Responsable |
|----------|-------------|
| Décider des **priorités produit** | Humain (product owner) |
| **Tester** le code | Robot QA |
| **Développer** | Développeur / agent implémentation |
| **Remplacer** la Constitution | Constitution (Loi 8) |
| **Déployer** en production | Humain + Robot QA + CI |
| **Modifier** la logique métier seul | Jamais — proposition uniquement |

> L'Architecture Guardian **propose et alerte**. L'**humain valide** toujours avant développement.

---

# 6. Workflow officiel

> **Ce workflow est officiel** pour toute évolution du projet.

```
Idée
  ↓
Architecture Guardian     ← revue 11 questions + checklist + Architecture Score
  ↓
Validation humaine        ← décision produit + go/no-go architecture
  ↓
Développement
  ↓
Tests                     ← unitaires, intégration, Playwright
  ↓
Robot QA                  ← scénarios, régressions, rapport
  ↓
Rapport                   ← qa/reports/ + Architecture Score si changement structurant
  ↓
Validation                ← humain : GO / GO AVEC RÉSERVES / NO GO
  ↓
Déploiement
```

### Règles du workflow

1. **Aucun développement** sans passage Architecture Guardian (même pour les petites features).
2. **Aucun déploiement** sans Robot QA + validation humaine.
3. Les **décisions structurantes** produisent un **ADR** (voir §10).
4. La **Constitution** prévaut en cas de conflit à toute étape (Loi 8).

---

# 7. Checklist architecture

Chaque nouvelle fonctionnalité est évaluée selon cette **checklist standard**.

Template : [`architecture/templates/architecture-review.template.md`](../architecture/templates/architecture-review.template.md)

| Critère | Description | Poids indicatif |
|---------|-------------|-----------------|
| **Vision** | Contribue à optimiser le temps → améliorer la vie | Critique |
| **Constitution** | Respecte vision, mission, Lois fondamentales | Critique |
| **Architecture** | Cohérente avec structure projet et pipeline IA | Haute |
| **Réutilisation** | Réutilise moteurs/composants existants | Haute |
| **Dette technique** | N'en crée pas inutilement ; dette acceptée documentée | Haute |
| **Interfaces** | Contrats définis si nouveau moteur ou API | Haute |
| **Modularité** | Découplage, responsabilité unique | Moyenne |
| **Performance** | Pas de régression structurelle identifiée | Moyenne |
| **Sécurité** | RLS, permissions, minimisation données | Critique |
| **Testabilité** | Testable unitairement et en E2E | Haute |
| **Extensibilité** | Generalisable à tout type de foyer/utilisateur | Haute |
| **Impact UX** | Pas de régression UX structurante | Moyenne |
| **Impact Planning** | Respecte Planning First et contraintes dures | Critique |
| **Impact Human Model** | Compatible modèle humain universel | Haute |
| **Impact Foyer** | Compatible modèle foyer centrale | Haute |
| **Impact Robot QA** | Scénarios QA identifiables ou ajoutables | Moyenne |
| **Dual Memory (Q11)** | Personal vs Universal — pas de mélange | **Critique** |

### Statuts par critère

- ✅ **Conforme** — aucune action requise
- ⚠️ **Réserve** — acceptable avec mitigation documentée
- ❌ **Non conforme** — bloquant jusqu'à résolution ou report

---

# 8. Architecture Score

> **Concept officiel** — non automatisé à ce stade. Sera intégré au **Health Score** du Robot QA (Constitution ch. 20).

## Objectif

Chaque revue Architecture Guardian produit un **Architecture Score** — indicateur composite de santé architecturale de la proposition (ou de l'état du projet).

## Dimensions

| Dimension | Description | Exemple score |
|-----------|-------------|---------------|
| **Vision** | Alignement mission produit | 100 |
| **Architecture** | Cohérence structurelle globale | 95 |
| **Interfaces** | Contrats définis et respectés | 96 |
| **Réutilisation** | Usage moteurs/composants existants | 91 |
| **Dette technique** | Faible dette introduite (score inversé si dette) | 94 |
| **Maintenabilité** | Lisibilité, conventions, documentation | 98 |
| **Extensibilité** | Generalisable, pas de hardcode | 97 |

## Calcul (manuel — Phase 1)

```
Architecture Score global = moyenne pondérée des dimensions
```

Pondération recommandée :

| Dimension | Poids |
|-----------|-------|
| Vision, Constitution (via checklist) | 20 % |
| Architecture, Interfaces | 25 % |
| Réutilisation, Dette technique | 20 % |
| Maintenabilité, Extensibilité | 15 % |
| Sécurité, Testabilité | 20 % |

## Seuils

| Score | Recommandation |
|-------|----------------|
| ≥ 90 | GO DEV |
| 75–89 | GO AVEC RÉSERVES — mitigations documentées |
| < 75 | NO GO ou REPORTÉ — revue humaine obligatoire |

## Intégration Health Score

Le Robot QA intègrera l'Architecture Score dans le **Health Score** global :

```
Health Score = f(
  Architecture Score,    ← Architecture Guardian
  Tests, UX, Performance,
  Sécurité, Constitution, ...
)
```

Voir [`ROBOT_QA_CHARTER.md`](./ROBOT_QA_CHARTER.md) §10 et Constitution ch. 20.

---

# 9. Structure `architecture/`

## Emplacement

```
architecture/
├── README.md                 # Guide du dossier
├── engines/                  # Cartographie des moteurs (doc, pas code)
│   └── README.md
├── contracts/                # Contrats cibles pipeline IA (specs, pas impl)
│   └── README.md
├── interfaces/               # Interfaces documentées entre composants
│   └── README.md
├── decisions/                # Revues Architecture Guardian
│   └── README.md
├── adr/                      # Architecture Decision Records
│   ├── README.md
│   └── 0001-template-example.md
├── patterns/                 # Patterns architecturaux approuvés
│   └── README.md
└── templates/
    ├── adr.template.md
    └── architecture-review.template.md
```

> **Note :** ce dossier contient de la **gouvernance et de la documentation**. Le code des moteurs reste dans `src/`. Les contrats implémentés iront ultérieurement dans `src/ai/contracts/` (Sprint A1).

---

# 10. ADR — Architecture Decision Records

> **Décision officielle :** toute décision structurante produit un ADR.

## Quand créer un ADR

- Nouveau moteur ou remplacement de moteur
- Changement de schéma de données majeur
- Nouvelle interface entre composants
- Choix technologique significatif
- Décision difficile à inverser

## Format obligatoire

Template : [`architecture/templates/adr.template.md`](../architecture/templates/adr.template.md)

| Section | Contenu |
|---------|---------|
| **Contexte** | Situation, contraintes, forces en jeu |
| **Problème** | Question précise à trancher |
| **Options** | Alternatives envisagées |
| **Choix** | Décision retenue |
| **Conséquences** | Impacts positifs et négatifs |
| **Alternatives rejetées** | Pourquoi les autres options ont été écartées |

## Nommage

```
architecture/adr/NNNN-titre-court-en-kebab-case.md
```

Exemple : `0001-pipeline-ia-interfaces-first.md`

## Statuts ADR

| Statut | Signification |
|--------|---------------|
| `proposed` | En discussion |
| `accepted` | Validé humainement |
| `deprecated` | Remplacé par un ADR plus récent |
| `superseded by ADR-NNNN` | Référence explicite au remplaçant |

---

# 11. Intégration Health Score et Robot QA

| Composant | Rôle | Moment |
|-----------|------|--------|
| **Architecture Guardian** | Architecture Score, checklist, ADR | **Avant** dev |
| **Robot QA** | Tests, régressions, Health Score global | **Après** dev |
| **Humain** | Validation produit + go/no-go | Entre les deux + avant déploiement |

Le Robot QA **ne remplace pas** l'Architecture Guardian. Il **consomme** son Architecture Score dans le Health Score.

---

# 12. Documents de référence

| Document | Relation |
|----------|----------|
| [`EQUILIBRE_AI_CONSTITUTION.md`](./EQUILIBRE_AI_CONSTITUTION.md) | **Autorité suprême** (Loi 8) |
| [`ROBOT_QA_CHARTER.md`](./ROBOT_QA_CHARTER.md) | Pilier qualité — après dev |
| [`PROJECT_BIBLE.md`](./PROJECT_BIBLE.md) | Architecture technique détaillée |
| [`AI_RULEBOOK.md`](./AI_RULEBOOK.md) | Comportement IA |
| [`ROADMAP.md`](./ROADMAP.md) | Plan de développement |
| [`CONSTITUTION_ALIGNMENT_REPORT.md`](./CONSTITUTION_ALIGNMENT_REPORT.md) | Alignement code ↔ Constitution |
| [`UNIVERSAL_LEARNING_ENGINE.md`](./UNIVERSAL_LEARNING_ENGINE.md) | Dual Memory — apprentissage collectif |

---

*Architecture Guardian v1.0.0 — Troisième pilier Équilibre IA*
