# EPIC3-A — Vision foyer (Household Intelligence)

> **Date :** 19 juillet 2026  
> **Statut :** ✅ Terminé — en attente validation humaine  
> **Prérequis :** EPIC1, EPIC2-A et EPIC2-B validés  
> **Aucun commit, merge ou déploiement** dans ce sprint

---

## 1. Objectif

Permettre à Équilibre IA d'**observer le foyer comme une entité unique** via une vue consolidée **purement informative**.

Aucune décision automatique. Aucune modification de planning. Aucune recommandation familiale.

---

## 2. Philosophie

| Aujourd'hui | Demain (ce sprint) |
|-------------|-------------------|
| William a son planning | Le foyer a **aussi** une vue consolidée |
| Madeline a son planning | Les plannings individuels **restent inchangés** |

---

## 3. Architecture

```
HouseholdOverviewPage (UI)
        │
        ▼
useHouseholdOverview (hook)
        │
        ▼
householdOverviewService.loadHouseholdOverview
        │
        ├── getHouseholdMembers
        ├── loadDisplayedDayPlan (par membre, fail-open)
        ├── getUserTasks (filtrage charge par membre)
        └── getUserGoals (par membre, si VITE_GOALS)
        │
        ▼
buildHouseholdOverview (orchestrateur produit)
        │
        ├── computeMemberWorkload ← analyzeDayForBrief
        ├── consolidateHouseholdAvailability
        └── householdEnginePort → MemberAvailabilityHint[]
```

### Moteurs réutilisés (existants — aucun nouveau)

| Moteur / brique | Usage |
|-----------------|-------|
| **PlanningContextEngine** | Via `loadDisplayedDayPlan` / `loadPlanningContextForDate` |
| **Availability pattern** | Via `analyzeDayForBrief` (même logique que Daily Brief) |
| **HouseholdEngine (contrat)** | Pont `householdEnginePort` → `MemberAvailabilityHint[]` |
| **familyContextEngine** | Non modifié — contexte familial reste sur `/family-context` |

Aucun nouveau moteur. Aucun contrat modifié.

---

## 4. Agrégation des données

### Par membre

Pour chaque membre du foyer :

1. Timeline du jour (`loadDisplayedDayPlan`)
2. Tâches du foyer (`getUserTasks`, filtrées par `assigned_to` / `created_by`)
3. Objectifs actifs (`getUserGoals` si flag goals ON)

Chargement **fail-open** : si le planning d'un membre est indisponible (RLS, erreur), la vue continue avec les autres.

### Consolidation foyer

| Donnée | Calcul |
|--------|--------|
| **Disponibilités** | 3 fenêtres (matin / après-midi / soir) — qui est libre vs tout le monde occupé |
| **Charge** | Temps planifié, temps libre, tâches actives par membre |
| **Objectifs** | Liste **par membre** (pas de fusion) |
| **Planning commun** | Notes observatoires (premier bloc, absence de bloc) |

---

## 5. Calculs

### Charge membre (`computeMemberWorkload`)

- **Temps planifié** : `analyzeDayForBrief(timeline).scheduledMinutes`
- **Temps libre restant** : `analyzeDayForBrief(timeline).freeMinutes`
- **Tâches actives** : tâches non terminées assignées ou créées par le membre
- **Label** : Journée chargée / modérée / légère / peu de marge

### Disponibilités consolidées

Par fenêtre horaire :

- **Tout le monde occupé** : aucun membre libre (peu de minutes libres, beaucoup planifié)
- **Au moins une personne libre** : liste des prénoms concernés

### Objectifs actifs

Objectifs dont la progression `< 100 %` (via `computeGoalProgress` EPIC2-A).

---

## 6. Composants UI

| Composant | Section |
|-----------|---------|
| `HouseholdOverviewSummaryCard` | Vue d'ensemble |
| `HouseholdAvailabilitySection` | Disponibilités |
| `HouseholdWorkloadSection` | Charge |
| `HouseholdGoalsSection` | Objectifs par membre |
| `HouseholdPlanningSection` | Planning commun (observations) |

**Page :** `/household-overview` — titre **Foyer**  
**Navigation :** drawer Organisation (flag ON)

---

## 7. Feature flag

| Variable | Défaut | Effet |
|----------|--------|-------|
| `VITE_HOUSEHOLD_OVERVIEW` | `false` | OFF → pas de menu, redirect vers Accueil |
| `VITE_GOALS` | optionnel | Affiche les objectifs actifs par membre |

Helper : `isHouseholdOverviewEnabled()`.

---

## 8. Fichiers créés

| Fichier | Rôle |
|---------|------|
| `src/types/householdOverview.ts` | Types vue consolidée |
| `src/lib/householdOverview/buildHouseholdOverview.ts` | Orchestrateur produit |
| `src/lib/householdOverview/computeMemberWorkload.ts` | Charge membre |
| `src/lib/householdOverview/consolidateHouseholdAvailability.ts` | Disponibilités consolidées |
| `src/lib/householdOverview/householdEnginePort.ts` | Pont contrat HouseholdEngine |
| `src/services/householdOverviewService.ts` | Chargement données |
| `src/hooks/useHouseholdOverview.ts` | Hook React |
| `src/pages/HouseholdOverviewPage.tsx` | Page Foyer |
| `src/components/householdOverview/*` | Sections UI |
| `src/lib/householdOverview/householdOverview.test.ts` | Tests |
| `Docs/EPIC3_A_HOUSEHOLD_OVERVIEW.md` | Ce rapport |

### Fichiers modifiés

- `src/config/featureFlags.ts`, `.env.example`
- `src/lib/navigation/routes.ts`, `appNavigationItems.ts`
- `src/design-system/spaceThemes.ts`
- `src/app/router/AppRouter.tsx`
- `src/styles/sprint50.css`
- `package.json` → `verify:household-overview`

---

## 9. Tests

```bash
npm run verify:household-overview
```

**16 tests** — foyer vide, 1 membre, 2 membres, disponibilités, objectifs, charge, feature flag, non-régression.

### Suite Guardian

| Commande | Résultat |
|----------|----------|
| `npm run build` | ✅ OK |
| `npm run lint` | ✅ OK |
| `npm test` | ✅ **1054 tests** |
| `npm run verify:contracts` | ✅ OK |
| `npm run verify:household-overview` | ✅ 16 tests |

---

## 10. Protocole manuel

Activer :

```
VITE_HOUSEHOLD_OVERVIEW=true
VITE_GOALS=true   # optionnel, pour section Objectifs
```

1. Menu drawer → **Foyer**
2. Vérifier la vue d'ensemble (nombre de membres, badges occupé/libre)
3. Parcourir les fenêtres Matin / Après-midi / Soir
4. Comparer la charge William vs Madeline (si foyer à 2)
5. Vérifier objectifs listés séparément par membre
6. Lire les observations planning (aucune action proposée)
7. Changer de jour via la barre de navigation
8. Désactiver le flag → menu disparu, `/household-overview` redirige

---

## 11. Limites et dette

| Limite | Détail |
|--------|--------|
| **RLS calendrier** | Le planning des autres membres peut être partiellement indisponible selon les droits Supabase |
| **Objectifs localStorage** | Objectifs partenaire visibles uniquement sur le même navigateur (EPIC2-A) |
| **Fenêtres horaires fixes** | Matin 6–12, Après-midi 12–18, Soir 18–22 — pas de fusion fine des créneaux |
| **Pas de planning commun fusionné** | Observations textuelles seulement, pas de timeline multi-membre unifiée |
| **HouseholdEngine runtime** | Contrat ponté ; implémentation complète différée |
| **Aucune IA décisionnelle** | Volontaire — sprint observateur |

---

## 12. Verdict Guardian

| Critère | Statut |
|---------|--------|
| Vue consolidée read-only | ✅ |
| Plannings individuels non modifiés | ✅ |
| Aucun nouveau moteur / contrat | ✅ |
| Logique métier hors React | ✅ |
| Feature flag OFF par défaut | ✅ |
| Fail-open chargement membres | ✅ |
| Non-régression EPIC1 / EPIC2 | ✅ |

**Verdict : ✅ PRÊT POUR VALIDATION HUMAINE**
