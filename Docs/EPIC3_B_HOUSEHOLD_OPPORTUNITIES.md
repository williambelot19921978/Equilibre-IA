# EPIC3-B — Détection d'opportunités du foyer

> **Date :** 19 juillet 2026  
> **Statut :** ✅ Terminé — en attente validation humaine  
> **Prérequis :** EPIC3-A validé  
> **Aucun commit, merge ou déploiement** dans ce sprint

---

## 1. Objectif

Identifier automatiquement des **opportunités utiles** pour le foyer — observer puis suggérer, sans jamais agir.

| Principe | Application |
|----------|-------------|
| L'IA aide | Cartes informatives sur la page Foyer |
| L'utilisateur choisit | Aucun bouton d'action automatique |
| Ton bienveillant | « Vous pourriez… », « Il pourrait être utile… » |

---

## 2. Aucune action automatique

Le sprint ne déplace, n'attribue, ne modifie et ne notifie **jamais** :

- ❌ déplacement de tâche
- ❌ attribution de tâche
- ❌ modification de planning / objectif
- ❌ notification push

---

## 3. Règles déterministes

| # | Règle | Condition | Suggestion |
|---|-------|-----------|------------|
| **1** | Déséquilibre de charge | Membre A chargé + membre B libre (≥ 90 min) | Coup de main possible |
| **2** | Créneau libre commun | Tous libres sur même fenêtre (matin/après-midi/soir) | Temps partagé |
| **3** | Foyer dense | Tous très chargés / peu de marge | Limiter nouveaux engagements |
| **4** | Objectif bloqué | Objectif sans avancée ≥ 5 jours + autre membre disponible | Soutien ponctuel possible |

Maximum **3 cartes** affichées (tri par priorité).

### Seuils

| Paramètre | Valeur |
|-----------|--------|
| Membre chargé | ≥ 240 min planifiées ou label « Journée chargée » |
| Peu de marge | < 60 min libres |
| Significativement libre | ≥ 90 min libres |
| Objectif stale | ≥ 5 jours sans progression |

---

## 4. Architecture

```
loadHouseholdOverviewBundle
        │
        ├── buildHouseholdOverview (EPIC3-A)
        └── buildHouseholdOpportunities (EPIC3-B)
                │
                ├── detectLoadImbalance
                ├── detectSharedFreeTime
                ├── detectBothBusy
                └── detectStaleGoalSupport ← computeGoalWeightsFromUserGoals
                │
                ▼
        presentHouseholdOpportunities ← explainability EPIC1-B
                │
                ▼
        HouseholdOpportunitiesSection (max 3 cartes)
```

### Moteurs réutilisés

| Moteur / brique | Usage |
|-----------------|-------|
| **Household Overview (EPIC3-A)** | Entrée principale (charge, disponibilités, objectifs) |
| **Goal Engine (contrat)** | `computeGoalWeightsFromUserGoals` — prioriser objectif stale |
| **PlanningContextEngine** | Via `loadDisplayedDayPlan` (données membres) |
| **Explainability (EPIC1-B)** | `presentExplainabilityReasons` + codes HOUSEHOLD_* |
| **Decision / Reasoning / Recommendation** | Codes sémantiques `NO_CONFLICT`, `AVOID_HEAVY_TASKS`, `CALM_MOMENT` |

Aucun nouveau moteur. Aucun contrat moteur modifié.

---

## 5. Cartes UI

Section **Opportunités du jour** sur la page Foyer :

- Titre
- Explication (ton non prescriptif)
- Bouton **Pourquoi ?** → panneau explicabilité (max 4 raisons)

Composants :

- `HouseholdOpportunitiesSection`
- `HouseholdOpportunityCard`
- Réutilise `RecommendationWhyPanel`

---

## 6. Explicabilité

Codes produit ajoutés (couche traduction, pas contrat moteur) :

- `HOUSEHOLD_MEMBER_AVAILABLE`
- `HOUSEHOLD_MEMBER_LOW_MARGIN`
- `HOUSEHOLD_SHARED_WINDOW`
- `HOUSEHOLD_BOTH_BUSY_DAY`
- `HOUSEHOLD_GOAL_STALE`
- `HOUSEHOLD_SUPPORT_POSSIBLE`

Exemple affiché :

```
Pourquoi ?
✓ William est disponible
✓ Madeline a peu de temps libre
✓ Aucun conflit détecté
```

Les libellés contextuels (prénoms) sont construits dans l'orchestrateur ; la traduction statique passe par EPIC1-B.

---

## 7. Feature flags

| Variable | Défaut | Effet |
|----------|--------|-------|
| `VITE_HOUSEHOLD_OVERVIEW` | `false` | Requis — page Foyer |
| `VITE_HOUSEHOLD_OPPORTUNITIES` | `false` | OFF → pas de section opportunités |
| `VITE_GOALS` | optionnel | Règle 4 (objectif bloqué) |
| `VITE_EXPLAINABLE_AI` | optionnel | Bouton « Pourquoi ? » |

---

## 8. Fichiers créés / modifiés

### Créés

| Fichier | Rôle |
|---------|------|
| `src/types/householdOpportunity.ts` | Types opportunité |
| `src/lib/householdOpportunities/buildHouseholdOpportunities.ts` | Orchestrateur |
| `src/lib/householdOpportunities/buildHouseholdOpportunityReasonCodes.ts` | Codes raison |
| `src/lib/householdOpportunities/presentHouseholdOpportunity.ts` | Présentation |
| `src/lib/householdOpportunities/householdOpportunities.test.ts` | Tests |
| `src/components/householdOverview/HouseholdOpportunityCard.tsx` | Carte |
| `src/components/householdOverview/HouseholdOpportunitiesSection.tsx` | Section |

### Modifiés

- `src/services/householdOverviewService.ts` — `loadHouseholdOverviewBundle`
- `src/hooks/useHouseholdOverview.ts` — expose `opportunities`
- `src/pages/HouseholdOverviewPage.tsx` — section opportunités
- `src/lib/explainability/explainabilityReasonCodes.ts` — codes HOUSEHOLD_*
- `src/lib/explainability/translateExplainabilityReasons.ts` — traductions
- `src/config/featureFlags.ts`, `.env.example`, `package.json`, CSS

---

## 9. Tests

```bash
npm run verify:household-opportunities
```

**16 tests** :

- ✓ aucun membre / un membre / deux membres
- ✓ membre chargé (déséquilibre)
- ✓ créneau commun
- ✓ les deux chargés
- ✓ objectif bloqué + soutien
- ✓ maximum 3 cartes
- ✓ aucune opportunité (journée calme)
- ✓ feature flags
- ✓ non-régression EPIC3-A / explainability

### Suite Guardian

| Commande | Résultat |
|----------|----------|
| `npm run build` | ✅ OK |
| `npm run lint` | ✅ OK |
| `npm test` | ✅ **1070 tests** |
| `npm run verify:contracts` | ✅ OK |
| `npm run verify:household-opportunities` | ✅ 16 tests |
| `npm run verify:household-overview` | ✅ 16 tests |

---

## 10. Protocole manuel

`.env.local` :

```
VITE_HOUSEHOLD_OVERVIEW=true
VITE_HOUSEHOLD_OPPORTUNITIES=true
VITE_GOALS=true
VITE_EXPLAINABLE_AI=true
```

1. Foyer à 2 membres (William + Madeline)
2. **Cas charge** : un membre avec journée dense, l'autre libre → carte déséquilibre
3. **Cas commun** : les deux libres l'après-midi → carte temps partagé
4. **Cas dense** : les deux surchargés → carte limiter engagements
5. **Cas objectif** : objectif sans avancée 5+ jours + partenaire libre → carte soutien
6. Ouvrir **Pourquoi ?** sur chaque carte
7. Vérifier l'absence de formulations « X doit… »
8. Désactiver `VITE_HOUSEHOLD_OPPORTUNITIES` → section disparue

---

## 11. Dette restante

| Dette | Détail |
|-------|--------|
| **RLS calendrier partenaire** | Données partielles si planning non accessible |
| **Objectifs localStorage** | Règle 4 limitée au navigateur local |
| **Fenêtres horaires fixes** | Matin / Après-midi / Soir (EPIC3-A) |
| **Pas de résolution conflit fine** | `NO_CONFLICT` sémantique, pas DecisionEngine runtime complet |
| **HouseholdEngine runtime** | Contrat ponté via hints ; implémentation complète différée |

---

## 12. Verdict Guardian

| Critère | Statut |
|---------|--------|
| Observe puis suggère uniquement | ✅ |
| Aucune action automatique | ✅ |
| Max 3 cartes | ✅ |
| Ton bienveillant non prescriptif | ✅ |
| Réutilise Household Overview + Goal port + Explainability | ✅ |
| Aucun nouveau moteur / contrat | ✅ |
| Logique métier hors React | ✅ |
| Feature flag OFF par défaut | ✅ |
| Non-régression EPIC3-A / EPIC1 / EPIC2 | ✅ |

**Verdict : ✅ PRÊT POUR VALIDATION HUMAINE**
