# EPIC2-B — Goal Progress Assistant

> **Date :** 19 juillet 2026  
> **Statut :** ✅ Terminé — en attente validation humaine  
> **Prérequis :** EPIC1-A/B/C + EPIC2-A validés  
> **Aucun commit, merge ou déploiement** dans ce sprint

---

## 1. Objectif

Faire **vivre les objectifs** dans toute l'application : guider sans imposer, sans automatiser.

L'utilisateur ne doit plus se demander *« Par quoi dois-je continuer ? »* — Equilibre IA propose **une seule** prochaine meilleure action.

---

## 2. Philosophie

| Principe | Application |
|----------|-------------|
| Guider | Encart « Prochaine meilleure action » + insight Daily Brief |
| Ne pas imposer | Bouton Planifier → navigation uniquement |
| Ne pas automatiser | Aucune création/déplacement/complétion de tâche |
| Ton positif | Messages enrichis, jamais culpabilisants |

---

## 3. Architecture

```
UserGoal[] + TaskRecord[]
        │
        ▼
goalEnginePort ──► GoalWeights (contrat IGoalEngine, sans nouveau moteur)
        │
        ▼
resolvePrimaryGoalNextAction ──► GoalNextAction (unique)
        │
        ├── computeGoalProgressSummary (temps/étapes/tâches restantes)
        ├── buildGoalProgressInsight (Daily Brief enrichi)
        └── enrichRecommendationsWithGoalContext (Objectif associé)
        │
        ▼
useGoalProgressAssistant (hook)
        │
        ▼
GoalProgressAssistant / GoalNextActionCard (UI)
```

### Moteurs réutilisés (existants — aucun #21)

| Moteur | Usage EPIC2-B |
|--------|---------------|
| **Goal Engine (contrat)** | `goalEnginePort` → `GoalWeights` pour prioriser les objectifs |
| **DecisionEngine** | Déjà sollicité via `buildDailyBriefRecommendations` → `buildStudySlotRecommendation` |
| **ReasoningEngine** | Déjà sollicité via `reasonAboutLifeProposal` dans les cartes études |
| **RecommendationEngine** | Déjà sollicité via `generateFreeTimeSuggestions` |
| **PlanningContextEngine** | Contexte jour inchangé (Daily Brief) |

Aucun nouveau moteur. Aucun contrat modifié. `HumanModel` et `Universal Learning` non touchés.

---

## 4. Prochaine meilleure action

Algorithme **déterministe** (`resolveGoalNextAction`) :

1. Parcourir les étapes par ordre
2. Retourner la **première tâche active** (non terminée, non annulée)
3. États spéciaux : objectif vide, étape sans tâches, objectif terminé

`resolvePrimaryGoalNextAction` classe les objectifs via `GoalWeights` puis retourne **une seule** action.

Exemple :

```
Objectif : Formation naturopathie
Étape    : Module 3
Tâche    : Lire le chapitre 5
Durée    : 35 minutes
```

---

## 5. Calcul de progression enrichi

Conservation du calcul EPIC2-A (`completedTasks / totalTasks`).

Ajouts dans `GoalProgressSummary` :

| Champ | Description |
|-------|-------------|
| `remainingTasks` | Tâches liées non terminées |
| `remainingSteps` | Étapes non entièrement complétées |
| `remainingMinutes` | Somme des `estimated_minutes` des tâches restantes (défaut 30 min) |

---

## 6. Composants & services

### Créés

| Fichier | Rôle |
|---------|------|
| `src/lib/goals/pickPrimaryGoal.ts` | Objectif principal (importance + récence) |
| `src/lib/goals/goalEnginePort.ts` | Pont `UserGoal[]` → `GoalWeights` |
| `src/lib/goals/resolveGoalNextAction.ts` | Prochaine action unique |
| `src/lib/goals/resolveGoalAssociation.ts` | Liaison tâche → objectif/étape |
| `src/lib/goals/buildGoalProgressInsight.ts` | Insight Daily Brief enrichi |
| `src/lib/goals/enrichRecommendationsWithGoalContext.ts` | Objectif associé sur cartes |
| `src/hooks/useGoalProgressAssistant.ts` | Hook orchestrateur UI |
| `src/components/goals/GoalNextActionCard.tsx` | Encart prochaine action |
| `src/components/goals/GoalProgressAssistant.tsx` | Wrapper page Objectifs |
| `src/lib/goals/goalProgressAssistant.test.ts` | Tests EPIC2-B |

### Modifiés

| Fichier | Modification |
|---------|--------------|
| `src/types/goal.ts` | `GoalProgressSummary`, `GoalNextAction`, `GoalAssociation` |
| `src/lib/goals/computeGoalProgress.ts` | `computeGoalProgressSummary()` |
| `src/lib/goals/buildGoalBriefInsight.ts` | Réutilise `pickPrimaryGoal` |
| `src/lib/dailyBrief/buildDailyBrief.ts` | Insight enrichi + enrichissement reco |
| `src/lib/dailyBrief/buildDailyBriefRecommendations.ts` | Champs `associatedGoalName/StepTitle` |
| `src/components/dailyBrief/DailyBriefCard.tsx` | Affichage Objectif associé |
| `src/pages/GoalsPage.tsx` | Encart en haut + bouton Planifier |
| `src/pages/HomePage.tsx` | Chargement goals/tasks si assistant ON |
| `src/config/featureFlags.ts` | `isGoalProgressAssistantEnabled()` |
| `.env.example` | `VITE_GOAL_PROGRESS_ASSISTANT=false` |
| `package.json` | `verify:goal-progress` |

---

## 7. UI

### Page Objectifs

Encart **Prochaine meilleure action** en haut (flag ON) :

- Titre de la tâche
- Temps estimé
- Étape concernée
- Objectif concerné
- Bouton **Planifier** → `/planning` (informatif)

### Daily Brief

Insight enrichi (remplace `buildGoalBriefInsight` quand assistant ON) :

- 📈 Tu avances régulièrement vers ton objectif.
- 🎯 Plus qu'une étape avant le module suivant.
- ⚠ Ton objectif n'a pas avancé depuis plusieurs jours — une petite action suffit pour relancer.

### Recommandations

Sur les cartes études liées à un objectif :

```
Objectif associé
Formation naturopathie

Étape
Module 3
```

---

## 8. Feature flags

| Variable | Défaut | Effet |
|----------|--------|-------|
| `VITE_GOALS` | `false` | Requis — données objectifs |
| `VITE_GOAL_PROGRESS_ASSISTANT` | `false` | OFF → comportement EPIC2-A |
| `VITE_DAILY_BRIEF` | requis | Insight + recommandations |

Helpers : `isGoalsEnabled()`, `isGoalProgressAssistantEnabled()`.

---

## 9. Tests

### Script dédié

```bash
npm run verify:goal-progress
```

**18 tests** couvrant :

- ✓ objectif vide
- ✓ objectif terminé
- ✓ progression correcte
- ✓ temps restant
- ✓ prochaine étape / tâche
- ✓ Daily Brief enrichi
- ✓ affichage Objectif associé
- ✓ feature flag OFF / ON
- ✓ non-régression EPIC1 + EPIC2-A

### Suite Guardian

| Commande | Résultat |
|----------|----------|
| `npm run build` | ✅ OK |
| `npm run lint` | ✅ OK |
| `npm test` | ✅ **1038 tests** |
| `npm run verify:contracts` | ✅ OK |
| `npm run verify:goals` | ✅ 14 tests |
| `npm run verify:goal-progress` | ✅ 18 tests |
| `npm run verify:p1` | ✅ 5 tests |
| `npm run verify:p2` | ✅ 24 tests |
| `npm run verify:dailybrief` | ✅ 21 tests |
| `npm run verify:explainable` | ✅ 14 tests |
| `npm run verify:dynamic-dailybrief` | ✅ 15 tests |

---

## 10. Protocole de validation manuelle

Activer dans `.env.local` :

```
VITE_GOALS=true
VITE_GOAL_PROGRESS_ASSISTANT=true
VITE_DAILY_BRIEF=true
```

| Cas | Attendu |
|-----|---------|
| **A** — objectif sans étape | Encart « Ajoute des étapes » |
| **B** — plusieurs étapes | Prochaine tâche de la première étape incomplète |
| **C** — objectif terminé | Encart « Objectif à jour » |
| **D** — plusieurs objectifs | Action de l'objectif le plus prioritaire |
| **E** — tâches incomplètes | Titre tâche + durée + étape + Planifier |

Vérifier aussi : insight Daily Brief avec emoji, Objectif associé sur carte études.

Désactiver `VITE_GOAL_PROGRESS_ASSISTANT` → retour comportement EPIC2-A.

---

## 11. Dette restante

| Dette | Détail |
|-------|--------|
| **Goal Engine runtime** | Contrat branché via port poids ; implémentation `IGoalEngine` complète différée |
| **Persistance Supabase** | Objectifs toujours en localStorage (EPIC2-A) |
| **Planifier** | Navigation seule — pas de pré-remplissage planning |
| **OutcomeObservationEngine** | Non sollicité (pas de nouvel événement) |

---

## 12. Verdict Guardian

| Critère | Statut |
|---------|--------|
| Aucun moteur supplémentaire | ✅ |
| Aucun contrat modifié | ✅ |
| Aucune logique métier dans React | ✅ |
| Goal Engine réutilisé (contrat GoalWeights) | ✅ |
| Decision / Recommendation / Reasoning via Daily Brief | ✅ |
| Fail-open (try/catch buildDailyBrief) | ✅ |
| Non-régression EPIC1 + EPIC2-A | ✅ |
| Feature flag OFF par défaut | ✅ |
| Aucune automatisation | ✅ |

**Verdict : ✅ PRÊT POUR VALIDATION HUMAINE**
