# Équilibre IA — Universal Learning Engine

> **Référence officielle d'architecture** — Apprentissage collectif sans données personnelles
>
> Version : 1.0.0  
> Date : 18 juillet 2026  
> Statut : Document fondateur — subordonné à la [Constitution](./EQUILIBRE_AI_CONSTITUTION.md) (Loi 8)

---

## Table des matières

1. [Vision](#1-vision)
2. [Deux niveaux de mémoire](#2-deux-niveaux-de-mémoire)
3. [Personal Memory](#3-personal-memory)
4. [Universal Learning](#4-universal-learning)
5. [Exemples](#5-exemples)
6. [Règles absolues](#6-règles-absolues)
7. [Pipeline de validation](#7-pipeline-de-validation)
8. [Intégration architecture](#8-intégration-architecture)
9. [Universal Learning Engine — contrat conceptuel](#9-universal-learning-engine--contrat-conceptuel)
10. [Frontière avec Personal Language Memory](#10-frontière-avec-personal-language-memory)
11. [Gouvernance et QA](#11-gouvernance-et-qa)
12. [Statut et roadmap](#12-statut-et-roadmap)

---

# 1. Vision

## Principe officiel — Apprentissage universel

> **Équilibre IA s'améliore grâce à l'expérience collective. Mais les données personnelles demeurent toujours privées.**
>
> **Le projet apprend des connaissances. Jamais des personnes.**

Équilibre IA doit devenir **plus intelligente avec le temps** — meilleure compréhension du langage, meilleures stratégies de planification, meilleur raisonnement général.

Elle ne doit **jamais** apprendre les données privées des utilisateurs pour enrichir l'expérience d'autres foyers.

---

# 2. Deux niveaux de mémoire

Le système possède **deux types de mémoire strictement séparés** :

```
┌─────────────────────────────────────────────────────────────────┐
│                     PERSONAL MEMORY                              │
│  Privée · par foyer · ne quitte jamais le foyer                  │
│  HumanModel · Household · habitudes · objectifs · planning       │
└─────────────────────────────────────────────────────────────────┘
                              ║
                              ║  INTERDIT — aucun flux direct
                              ║
┌─────────────────────────────────────────────────────────────────┐
│                   UNIVERSAL LEARNING                             │
│  Globale · anonymisée · généralisable · utile à tous             │
│  expressions · intents · stratégies · raisonnement général       │
└─────────────────────────────────────────────────────────────────┘
```

| Dimension | Personal Memory | Universal Learning |
|-----------|-----------------|-------------------|
| **Portée** | Un foyer / membre | Tous les utilisateurs |
| **Données** | Identifiables, privées | Anonymisées, généralisées |
| **Stockage** | Supabase RLS par foyer | Store global séparé (futur) |
| **Objectif** | Servir **ce** foyer | Améliorer le **produit** |
| **Export** | Jamais vers Universal | N/A |
| **Mélange** | **Interdit** | **Interdit** |

> **Le mélange des deux est interdit.** Aucun pipeline, aucune feature, aucun moteur ne peut fusionner ces flux sans garde-fou explicite validé.

---

# 3. Personal Memory

## Définition

Mémoire **privée** appartenant **exclusivement au foyer** (et à ses membres autorisés).

## Contenu typique

- habitudes et rythme de vie ;
- préférences personnelles ;
- objectifs et contraintes ;
- événements de vie ;
- historique de planning et de tâches ;
- conversations utiles au contexte du foyer ;
- expressions personnelles apprises **pour ce membre** (Personal Language Memory) ;
- profil Human Model ;
- structure Household ;
- spiritualité, santé — **si l'utilisateur choisit de les partager**.

## Règles

- Ne **quitte jamais** le périmètre du foyer (RLS, permissions).
- Ne peut **jamais** servir à améliorer l'expérience d'un autre utilisateur.
- Visible, corrigeable, supprimable par l'utilisateur (Constitution ch. 14).
- Niveaux de confiance par fait (Loi 5).

## Moteurs concernés (architecture actuelle)

| Moteur | Rôle Personal Memory |
|--------|---------------------|
| HumanModelEngine | Profil individuel |
| HouseholdEngine | Structure foyer |
| PersonalLanguageMemoryEngine | Expressions **par membre** |
| PlanningContextEngine | État planning privé |
| GoalEngine | Objectifs privés |
| LifeEventEngine | Transitions vie privées |

---

# 4. Universal Learning

## Définition

Mémoire **globale** du produit. Elle n'apprend **jamais** une information personnelle. Elle apprend uniquement des **connaissances généralisables**.

## Ce que Universal Learning apprend

| Catégorie | Exemples |
|-----------|----------|
| **Langage** | Nouvelles expressions, synonymes, tournures, formulations naturelles |
| **Styles** | Patterns de langage familiers (sans lien à une personne) |
| **Intents** | Nouvelles intentions détectées de manière collective |
| **Compréhension** | Amélioration mapping expression → concept général |
| **Planification** | Stratégies générales efficaces (ex. protéger sommeil avant tâches admin) |
| **Raisonnement** | Patterns d'arbitrage généralisables (pas de contexte identifiable) |

## Ce que Universal Learning n'apprend jamais

Voir [§6 Règles absolues](#6-règles-absolues).

## Moteur dédié

**UniversalLearningEngine** — composant officiel du cerveau (contrat : [`architecture/contracts/universal-learning-engine.md`](../architecture/contracts/universal-learning-engine.md)).

Statut : **documenté, non implémenté**.

---

# 5. Exemples

## ✅ Exemple accepté — connaissance universelle

Des milliers d'utilisateurs disent :

> « je suis rincé »

Le système observe, **de manière anonymisée et agrégée**, une corrélation forte avec le concept **fatigue importante**.

Après validation (§7), la connaissance universelle devient :

```
expression_pattern: "rincé" | "rincée" | "je suis rincé"
generalized_meaning: fatigue_high
confidence: collective (seuil atteint)
identifiable: false
```

Tous les foyers bénéficient d'une **meilleure compréhension** — sans savoir **qui** a dit quoi.

## ❌ Exemple refusé — donnée personnelle

> Un membre du foyer court le mardi à 18 h.

Cette information :

- reste dans le **Personal Memory** de ce foyer ;
- alimente son HumanModel et son planning ;
- **ne doit jamais** enrichir Universal Learning ;
- ne doit jamais influencer un autre utilisateur.

## ❌ Autres exemples refusés

| Donnée | Pourquoi refusé |
|--------|-----------------|
| « Marie préfère le yoga le matin » | Prénom + préférence identifiable |
| « 12 rue des Lilas » | Adresse |
| « Revenus insuffisants ce mois » | Finances privées |
| « Diabète type 2 » | Santé identifiable |
| « Enfants à récupérer à 17h » | Contrainte foyer identifiable |

---

# 6. Règles absolues

Le **Universal Learning Engine** ne doit **jamais** apprendre :

- noms et prénoms ;
- adresses ;
- calendriers et horaires personnels ;
- revenus et finances ;
- santé ;
- localisation ;
- événements privés ;
- objectifs personnels ;
- données du foyer ;
- contenus identifiables ou ré-identifiables ;
- toute donnée ne pouvant pas être **généralisée** et **anonymisée**.

Il ne doit apprendre que des **connaissances généralisables** — patterns linguistiques, stratégiques ou de raisonnement **sans ancrage identitaire**.

---

# 7. Pipeline de validation

Avant qu'une connaissance rejoigne Universal Learning, elle doit être :

| Étape | Critère |
|-------|---------|
| 1. **Anonymisation** | Aucun identifiant foyer, membre, ou session |
| 2. **Généralisation** | Formulation applicable à tout utilisateur |
| 3. **Vérification** | Seuil de confiance collective (volume + cohérence) |
| 4. **Non-identifiabilité** | Test : impossible de remonter à une personne |
| 5. **Utilité universelle** | Améliore l'expérience de **tous**, pas d'un profil cible |
| 6. **Validation humaine** | Revue pour patterns sensibles (santé, finance déguisée) |

### Statuts d'une connaissance universelle

| Statut | Description |
|--------|-------------|
| `candidate` | Signal agrégé détecté, non publié |
| `validated` | Passé pipeline §7 — utilisable |
| `rejected` | Échec anonymisation ou identifiabilité |
| `deprecated` | Remplacé ou contredit |

---

# 8. Intégration architecture

> **Sans modifier l'implémentation actuelle** — description des **relations cibles**.

## Diagramme d'intégration

```
                    UTILISATEUR
                         │
                         ▼
              ┌──────────────────────┐
              │  ConversationEngine   │
              └──────────┬───────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
┌─────────────┐ ┌──────────────┐ ┌─────────────────────┐
│ Personal    │ │ Universal    │ │ IntentEngine        │
│ Language    │ │ Learning     │ │ (compréhension)     │
│ Memory      │ │ Engine       │ └──────────┬──────────┘
│ (personal)  │ │ (global)     │            │
└──────┬──────┘ └──────┬───────┘            │
       │               │                    │
       │    hints      │ universal_hints    │
       └───────┬───────┘                    │
               ▼                            ▼
       ┌───────────────┐          ┌─────────────────┐
       │ Personal      │          │ ReasoningEngine │
       │ Memory        │          │ (stratégies     │
       │ HumanModel +  │          │  universelles)  │
       │ Household +   │          └────────┬────────┘
       │ Planning...   │                   │
       └───────────────┘                   ▼
                                  ┌─────────────────┐
                                  │ KnowledgeEngine │
                                  │ (externe web —  │
                                  │  ≠ Universal)   │
                                  └─────────────────┘
```

## Relations par moteur

| Moteur | Relation avec Universal Learning |
|--------|-------------------------------|
| **ConversationEngine** | Route les flux ; **ne mélange jamais** personal et universal |
| **PersonalLanguageMemoryEngine** | Personal Memory — expressions **par membre** ; peut **alimenter candidats** ULE via export anonymisé contrôlé (futur) |
| **HumanModelEngine** | Personal Memory exclusivement — **aucun export** vers ULE |
| **IntentEngine** | **Consomme** `universal_hints` (patterns langage/intent) |
| **ReasoningEngine** | **Consomme** stratégies de planification générales validées |
| **KnowledgeEngine** | **Distinct** — faits externes (météo, lieux) ; pas d'apprentissage collectif |
| **NaturalResponseEngine** | Ton/style général possible ; jamais faits personnels d'autres foyers |

## Flux de contribution (futur — non implémenté)

```
Signal local (foyer) → Anonymisation gate → Agrégation → Validation → Universal Store
                              ↑
                         REJET si PII
```

Aucun signal ne quitte le foyer **sans** passer par la gate d'anonymisation.

---

# 9. Universal Learning Engine — contrat conceptuel

| Élément | Description |
|---------|-------------|
| **Mission** | Agréger, valider et servir connaissances universelles généralisables |
| **Entrées** | `AnonymizedSignal[]` (futur), requêtes lookup |
| **Sorties** | `UniversalHint[]`, `UniversalStrategy[]`, `UniversalIntentPattern[]` |
| **Dépendances** | Aucune Personal Memory directe |
| **Interdit** | Lire HumanModel, Household, planning, PII |

Contrat détaillé : [`architecture/contracts/universal-learning-engine.md`](../architecture/contracts/universal-learning-engine.md)

---

# 10. Frontière avec Personal Language Memory

| | Personal Language Memory | Universal Learning |
|---|--------------------------|-------------------|
| **Scope** | Un membre | Tous les utilisateurs |
| **Exemple** | « Décale » = reschedule pour **moi** | « rincé » ≈ fatigue pour **tous** |
| **Stockage** | `user_language_expressions` (RLS) | Store global séparé (futur) |
| **Confirmation** | Utilisateur confirme | Validation collective + pipeline §7 |

Personal Language Memory reste dans **Personal Memory**. Universal Learning ne remplace pas PLM — ils **coexistent** avec frontière stricte.

---

# 11. Gouvernance et QA

| Composant | Rôle |
|-----------|------|
| **Constitution** | Principe officiel ch. 22 — Apprentissage universel |
| **Architecture Guardian** | Q11 — Personal ou Universal ? Mélange interdit |
| **Robot QA** | Contrôle permanent — aucune PII dans ULE |
| **ADR-0003** | Décision architecture dual memory |

---

# 12. Statut et roadmap

| Phase | Objectif | Statut |
|-------|----------|--------|
| **UL-0** | Documentation (ce document) | ✅ |
| **UL-1** | Contrat + ADR | ✅ |
| **UL-2** | Interface TypeScript + gate anonymisation (spec) | 📋 |
| **UL-3** | Pipeline agrégation (backend isolé) | 💡 |
| **UL-4** | Intégration IntentEngine / ReasoningEngine | 💡 |

**Aucune implémentation à ce stade.**

---

## Documents liés

| Document | Rôle |
|----------|------|
| [Constitution ch. 22](./EQUILIBRE_AI_CONSTITUTION.md#22-apprentissage-universel) | Principe officiel |
| [Architecture Guardian Q11](./ARCHITECTURE_GUARDIAN.md) | Question obligatoire |
| [Robot QA § Universal Learning](./ROBOT_QA_CHARTER.md) | Contrôle permanent |
| [Contrat ULE](../architecture/contracts/universal-learning-engine.md) | Contrat moteur |
| [ADR-0003](../architecture/adr/0003-dual-memory-universal-learning.md) | Décision structurante |

---

*Universal Learning Engine v1.0.0 — Équilibre IA apprend des connaissances, jamais des personnes.*
