# EPIC3-C — Suggestions collaboratives

> **Date :** 19 juillet 2026  
> **Statut :** ✅ Terminé — en attente validation humaine  
> **Prérequis :** EPIC3-A et EPIC3-B validés  
> **Aucun commit, merge ou déploiement** dans ce sprint

---

## 1. Objectif

Transformer certaines **opportunités détectées** (EPIC3-B) en **propositions concrètes** — le système prépare, l'utilisateur décide.

| Principe | Application |
|----------|-------------|
| Le système prépare | Brouillon sessionStorage ou écran prérempli |
| L'utilisateur décide | Confirmation explicite obligatoire |
| Aucune modification auto | Jamais de mutation planning/tâches/objectifs sans validation |

---

## 2. Source unique

Réutilisation **exclusive** des opportunités EPIC3-B — **aucune nouvelle règle métier**.

L'orchestrateur `buildHouseholdCollaborationProposal` mappe chaque `HouseholdOpportunityKind` existant vers une action préparable.

---

## 3. Architecture

```
loadHouseholdOverviewBundle
        │
        ├── buildHouseholdOpportunities (EPIC3-B — inchangé)
        ├── presentHouseholdOpportunities
        └── enrichHouseholdOpportunitiesWithCollaboration (EPIC3-C)
                │
                └── buildHouseholdCollaborationProposal
                        │
                        ▼
                HouseholdOpportunityCard — bouton « Proposer »
                        │
                        ▼
                HouseholdCollaborationConfirmModal
                        │
                        ▼ (Oui)
                prepareHouseholdCollaboration
                        │
                        ├── saveHouseholdTaskCollaborationDraft → /tasks
                        └── saveHouseholdPlanningCollaborationDraft → /planning
```

### Fichiers clés

| Fichier | Rôle |
|---------|------|
| `buildHouseholdCollaborationProposal.ts` | Orchestrateur produit |
| `resolveHouseholdCollaborationContext.ts` | Contexte depuis overview (pas de nouvelle détection) |
| `buildHouseholdCollaborationConfirmation.ts` | Prompts (alignés ActionProposalEngine) |
| `prepareHouseholdCollaboration.ts` | Préparation post-confirmation |
| `householdCollaborationDraftStorage.ts` | Brouillons sessionStorage |
| `enrichHouseholdOpportunitiesWithCollaboration.ts` | Enrichissement des cartes |

### Moteurs réutilisés

| Brique | Usage |
|--------|-------|
| **Household Overview (EPIC3-A)** | Contexte membres, fenêtres, objectifs |
| **Household Opportunities (EPIC3-B)** | Source des opportunités |
| **Goal Engine port** | Contexte objectif stale (règle 4) |
| **ActionProposalEngine (contrat)** | Forme `ProposedAction` + confirmation prompt |
| **Explainability (EPIC1-B)** | « Pourquoi ? » inchangé sur les cartes |

Aucun nouveau moteur. Aucun contrat moteur modifié.

---

## 4. Scénarios et actions

| Opportunité EPIC3-B | Action préparée | Écran cible |
|---------------------|-----------------|-------------|
| `load_imbalance` | Brouillon tâche collaborative « Coup de main » | `/tasks` |
| `shared_free_time` | Suggestion créneau commun | `/planning?date=…` |
| `both_busy` | Revue journée dense (sans modification) | `/planning?date=…` |
| `stale_goal_support` | Brouillon tâche de soutien objectif | `/tasks` |

Types `ProposedAction` (alignés contrat) :

- `create_household_support_task`
- `open_household_planning_window`
- `open_household_planning_review`
- `create_household_goal_support_task`

---

## 5. Flux utilisateur

```
Carte opportunité
    │
    ├── [Pourquoi ?] → EPIC1-B (inchangé)
    │
    └── [Proposer] (si VITE_HOUSEHOLD_COLLABORATION=true)
            │
            ▼
    Modal : « Souhaitez-vous préparer cette action ? »
            │
            ├── Annuler → rien
            │
            └── Oui → prepareHouseholdCollaboration
                        │
                        ├── Brouillon tâche → TasksPage (formulaire prérempli)
                        └── Brouillon planning → PlanningPage (bandeau suggestion)
```

**Important :** la création de tâche ou l'ajout au planning reste **manuelle** sur l'écran cible.

---

## 6. Confirmations

| Élément | Valeur |
|---------|--------|
| Prompt principal | « Souhaitez-vous préparer cette action ? » |
| Boutons | **Oui** / **Annuler** |
| Détail tâche | « … brouillon — vous pourrez la valider ou l'ajuster… » |
| Détail planning | « … aucun bloc ne sera ajouté automatiquement » |
| Détail densité | « … aucun engagement ne sera modifié sans votre validation » |

Ton bienveillant, jamais prescriptif.

---

## 7. Feature flags

| Variable | Défaut | Effet |
|----------|--------|-------|
| `VITE_HOUSEHOLD_OVERVIEW` | `false` | Requis — page Foyer |
| `VITE_HOUSEHOLD_OPPORTUNITIES` | `false` | Requis — opportunités |
| `VITE_HOUSEHOLD_COLLABORATION` | `false` | OFF → pas de bouton Proposer |
| `VITE_EXPLAINABLE_AI` | optionnel | « Pourquoi ? » |

---

## 8. UI

### Composants

- `HouseholdOpportunityCard` — bouton **Proposer** (si proposition disponible)
- `HouseholdCollaborationConfirmModal` — confirmation Oui/Annuler
- `HouseholdPlanningPrefillBanner` — bandeau sur Planning
- Bandeau brouillon sur TasksPage

### Logique métier

Hors React — orchestrateurs dans `src/lib/householdCollaboration/`.

---

## 9. Tests

```bash
npm run verify:household-collaboration
```

**12 tests** :

- ✓ opportunité sans action (flag OFF)
- ✓ opportunité avec proposition (déséquilibre, créneau commun)
- ✓ confirmation prompt
- ✓ préparation brouillon tâche
- ✓ préparation brouillon planning
- ✓ annulation (aucun brouillon sans prepare)
- ✓ objectif bloqué — soutien
- ✓ journée dense — revue planning
- ✓ non-régression EPIC3-B
- ✓ UI sans logique métier lourde
- ✓ feature flag default false

### Suite Guardian

| Commande | Résultat |
|----------|----------|
| `npm run build` | ✅ OK |
| `npm run lint` | ✅ OK |
| `npm run test` | ✅ **1082 tests** |
| `npm run verify:contracts` | ✅ OK |
| `npm run verify:household-collaboration` | ✅ 12 tests |
| `npm run verify:household-opportunities` | ✅ 16 tests |

---

## 10. Protocole manuel

`.env.local` :

```
VITE_HOUSEHOLD_OVERVIEW=true
VITE_HOUSEHOLD_OPPORTUNITIES=true
VITE_HOUSEHOLD_COLLABORATION=true
VITE_GOALS=true
VITE_EXPLAINABLE_AI=true
```

1. Ouvrir **Foyer** avec 2 membres
2. Sur une carte opportunité → cliquer **Proposer**
3. Vérifier la modal « Souhaitez-vous préparer cette action ? »
4. **Annuler** → aucun changement, rester sur Foyer
5. **Proposer** → **Oui** :
   - Déséquilibre / objectif → Tasks avec formulaire prérempli
   - Créneau commun / journée dense → Planning avec bandeau
6. Sur Tasks : modifier si besoin, créer manuellement la tâche
7. Sur Planning : aucun bloc ajouté automatiquement
8. Désactiver `VITE_HOUSEHOLD_COLLABORATION` → bouton Proposer absent

---

## 11. Dette restante

| Dette | Détail |
|-------|--------|
| **Pas de service rappel** | « Rappel partagé » non implémenté (absent du produit) |
| **Brouillon sessionStorage** | Perdu à la fermeture d'onglet |
| **Assignation tâche** | Brouillon créé pour l'utilisateur courant uniquement |
| **Planning prefill limité** | Bandeau informatif, pas de surbrillance timeline |
| **ActionProposalEngine runtime** | Alignement contrat ; implémentation runtime différée |

---

## 12. Verdict Guardian

| Critère | Statut |
|---------|--------|
| Réutilise opportunités EPIC3-B uniquement | ✅ |
| Aucune nouvelle règle métier | ✅ |
| Confirmation explicite obligatoire | ✅ |
| Aucune modification sans validation | ✅ |
| Prépare / ouvre prérempli / brouillon | ✅ |
| Aucun nouveau moteur / contrat | ✅ |
| « Pourquoi ? » EPIC1-B inchangé | ✅ |
| Feature flag OFF par défaut | ✅ |
| Non-régression EPIC3-A / EPIC3-B | ✅ |

**Verdict : ✅ PRÊT POUR VALIDATION HUMAINE**
