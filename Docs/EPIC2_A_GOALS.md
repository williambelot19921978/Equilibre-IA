# EPIC2-A — Objectifs intelligents (MVP)

> **Date :** 19 juillet 2026  
> **Statut :** ✅ Terminé — en attente validation humaine  
> **Prérequis :** EPIC1-A, EPIC1-B et EPIC1-C validés  
> **Aucun commit, merge ou déploiement** dans ce sprint

---

## 1. Objectif

Permettre à l'utilisateur de **créer un objectif** qui devient la **source** de ses tâches, sans les remplacer.

Chaîne MVP :

```
Objectif → Étapes (découpage manuel) → Tâches existantes (liaison)
```

Pas de génération automatique de tâches.

---

## 2. Modèle fonctionnel

| Champ | Obligatoire | Exemple |
|-------|-------------|---------|
| Nom | Oui | Préparer la certification de naturopathie |
| Catégorie | Oui | Formation / études |
| Date cible | Non | 2026-12-01 |
| Importance | Oui | Faible / Normale / Élevée |
| Estimation globale | Non | 1200 minutes |

### Progression

```
Tâches terminées (status = done) / Nombre total de tâches liées
```

Les tâches sont liées par étape via `step.taskIds[]`.

---

## 3. Architecture

```
GoalsPage (UI)
    │
    ▼
useGoals (hook)
    │
    ▼
goalsService (CRUD + étapes)
    │
    ▼
goalsStorage (localStorage par user — MVP)
    │
    ▼
computeGoalProgress ← TaskRecord[] (Supabase, tâches existantes)
```

### Daily Brief (intégration légère)

```
HomePage charge goals + tasks (si flags ON)
    │
    ▼
useDailyBrief → buildDailyBrief
    │
    ▼
buildGoalBriefInsight (ton neutre, sans culpabilisation)
    │
    ▼
DailyBriefContent affiche goalInsight
```

Exemples de messages :

- « Tu avances vers ton objectif « Formation ». »
- « Aucune progression n'a été enregistrée depuis 5 jours sur « Formation ». »

---

## 4. Moteurs sollicités

| Composant | Rôle |
|-----------|------|
| **Aucun nouveau moteur** | — |
| `tasksService` | Tâches existantes (Supabase) |
| `buildDailyBrief` | Orchestrateur EPIC1-A étendu |
| `buildGoalBriefInsight` | Copie produit neutre (lib, pas moteur) |

Le contrat `goal-engine` existant n'est **pas** branché dans ce MVP.

---

## 5. Feature flag

| Variable | Défaut | Effet |
|----------|--------|-------|
| `VITE_GOALS` | `false` | OFF → pas de menu Objectifs, redirect `/goals` → Accueil, pas d'insight Daily Brief |
| `VITE_DAILY_BRIEF` | requis pour insight | Brief actif |

Helper : `isGoalsEnabled()`.

---

## 6. UI — écran Objectifs (`/goals`)

Accessible depuis le **drawer Organisation** (flag ON).

| Action | Implémentation |
|--------|----------------|
| Créer | Formulaire `GoalForm` |
| Modifier | Formulaire pré-rempli sur le détail |
| Voir progression | Barre `GoalProgressBar` (liste + détail) |
| Découper | `GoalStepsEditor` — ajout d'étapes manuelles |
| Lier tâches | Cases à cocher par étape (tâches Supabase) |
| Supprimer | Bouton sur le détail |

---

## 7. Fichiers créés

| Fichier | Rôle |
|---------|------|
| `src/types/goal.ts` | Types `UserGoal`, `GoalStep`, `GoalProgress` |
| `src/lib/goals/goalCategories.ts` | Catégories et importance |
| `src/lib/goals/goalsStorage.ts` | Persistance localStorage MVP |
| `src/lib/goals/computeGoalProgress.ts` | Calcul progression |
| `src/lib/goals/buildGoalBriefInsight.ts` | Copie Daily Brief |
| `src/services/goalsService.ts` | CRUD + étapes |
| `src/hooks/useGoals.ts` | Hook page Objectifs |
| `src/pages/GoalsPage.tsx` | Écran principal |
| `src/components/goals/GoalForm.tsx` | Création / édition |
| `src/components/goals/GoalProgressBar.tsx` | Barre de progression |
| `src/components/goals/GoalStepsEditor.tsx` | Étapes + liaison tâches |
| `src/lib/goals/goals.test.ts` | Tests EPIC2-A |
| `Docs/EPIC2_A_GOALS.md` | Ce rapport |

---

## 8. Fichiers modifiés

| Fichier | Modification |
|---------|--------------|
| `src/config/featureFlags.ts` | `isGoalsEnabled()` |
| `.env.example` | `VITE_GOALS=false` |
| `src/lib/navigation/routes.ts` | Route `/goals` |
| `src/lib/navigation/appNavigationItems.ts` | Entrée drawer (filtrée par flag) |
| `src/design-system/spaceThemes.ts` | Espace `goals` |
| `src/app/router/AppRouter.tsx` | Route protégée |
| `src/lib/dailyBrief/buildDailyBrief.ts` | Champ `goalInsight` |
| `src/hooks/useDailyBrief.ts` | Paramètres `goals` + `tasks` |
| `src/pages/HomePage.tsx` | Chargement goals/tasks pour brief |
| `src/components/dailyBrief/DailyBriefContent.tsx` | Affichage insight |
| `src/services/tasksService.ts` | SELECT inclut `updated_at`, `last_completed_at` |
| `src/styles/sprint50.css` | Styles objectifs + insight brief |
| `package.json` | Script `verify:goals` |

---

## 9. Tests

### Script dédié

```bash
npm run verify:goals
```

**14 tests** — création, édition, progression, liaison tâches, suppression, insight Daily Brief, non-régression EPIC1/P1/P2.

### Suite complète (Guardian)

| Commande | Résultat |
|----------|----------|
| `npm run build` | ✅ OK |
| `npm run lint` | ✅ OK (warnings préexistants) |
| `npm test` | ✅ **1020 tests** |
| `npm run verify:contracts` | ✅ OK |
| `npm run verify:p1` | ✅ 5 tests |
| `npm run verify:p2` | ✅ 24 tests |
| `npm run verify:dailybrief` | ✅ 21 tests |
| `npm run verify:explainable` | ✅ 14 tests |
| `npm run verify:dynamic-dailybrief` | ✅ 15 tests |
| `npm run verify:goals` | ✅ 14 tests |

---

## 10. Points de test manuel

1. Activer dans `.env.local` :
   ```
   VITE_GOALS=true
   VITE_DAILY_BRIEF=true
   ```
2. Menu drawer → **Objectifs** visible.
3. Créer un objectif (nom, catégorie, date, importance).
4. Ajouter des étapes (ex. Module 1, Module 2).
5. Créer des tâches dans **Tâches**, les lier aux étapes.
6. Marquer une tâche terminée → progression mise à jour.
7. Accueil → Daily Brief affiche une phrase objectif neutre.
8. Désactiver `VITE_GOALS` → menu disparu, `/goals` redirige vers Accueil.

---

## 11. Limites connues (dette MVP)

| Limite | Détail |
|--------|--------|
| **Persistance localStorage** | Objectifs non synchronisés Supabase / multi-appareil |
| **Pas de génération auto** | Étapes et liaisons 100 % manuelles |
| **Un insight brief** | Objectif principal = importance la plus élevée |
| **Stale progress** | Basé sur `last_completed_at` / `updated_at` des tâches liées |
| **goal-engine non branché** | Contrat architecture présent, implémentation différée |

---

## 12. Verdict Guardian

| Critère | Statut |
|---------|--------|
| Stabilité (build, tests, contracts) | ✅ |
| Feature flag OFF par défaut | ✅ |
| Pas de nouveau moteur | ✅ |
| Réutilisation tâches existantes | ✅ |
| UX menu / conversation / planning préservés | ✅ |
| Non-régression EPIC1 / P1 / P2 | ✅ |

**Verdict : ✅ PRÊT POUR VALIDATION HUMAINE**

---

## 13. Prochaines étapes suggérées (hors scope EPIC2-A)

- Migration Supabase `user_goals` + `goal_steps`
- Synchronisation bidirectionnelle tâche ↔ objectif
- Brancher le `goal-engine` existant pour suggestions (EPIC2-B+)
- Tests E2E Playwright sur `/goals`
