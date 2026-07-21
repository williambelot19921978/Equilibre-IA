# EPIC 5C — Semantic Planning & Life Understanding Engine

## Vision

Transformer le **Planning Engine** en moteur de **compréhension de la vie** : le système ne se contente plus de connaître des événements — il interprète ce qu'ils signifient.

Le **PlanningCalendarEngine** reste la **source de vérité temporelle**. Le **SemanticPlanningEngine** est une **couche d'interprétation en lecture seule** — il enrichit, ne remplace jamais.

## Architecture

```mermaid
flowchart TB
  subgraph consumers [Consommateurs]
    HM[Human Model]
    DB[Daily Brief]
    AE[Action Engine]
    CE[Conversation Engine]
    UI[Compréhension IA UI]
  end

  subgraph semantic [SemanticPlanningEngine — EPIC 5C]
    CLS[Classification Engine]
    SCR[Semantic Scoring]
    LOAD[Daily Load Engine]
    BAL[Life Balance Engine]
    INS[Insight Engine]
    GOAL[Goal Impact Engine]
    HH[Household Engine]
    PRED[Prediction Engine — architecture]
  end

  subgraph planning [PlanningCalendarEngine — EPIC 5A]
    PCE[Timeline unifiée]
  end

  PCE -->|CalendarItem[]| semantic
  semantic -->|SemanticCalendarItem| consumers
  HM -->|consomme| semantic
```

## Flag d'activation

| Variable | Default | Prérequis |
|----------|---------|-----------|
| `VITE_SEMANTIC_PLANNING_ENGINE` | `false` | `VITE_PLANNING_CALENDAR_ENGINE=true` |

## SemanticCalendarItem

Extension de `CalendarItem` (intersection TypeScript) — **aucune modification** du contrat 5A.

Champs calculés (jamais saisis manuellement) :

| Champ | Description |
|-------|-------------|
| `category` / `subcategory` | Classification sémantique |
| `importance` | 1–5 |
| `energyBefore` / `energyAfter` | faible · moyenne · élevée |
| `stressLevel` | 0–100 |
| `preparationNeeded` | bool |
| `travelNeeded` | bool |
| `recoveryNeeded` | bool |
| `estimatedDuration` | minutes |
| `focusRequired` | bool |
| `familyImpact` … `socialImpact` | 0–1 |
| `flexibility` | fixe · déplaçable · flexible |
| `confidence` | 0–100 % |
| `tags` | labels |
| `goalLinks` | liens objectifs |

## Classification Engine

Règles keyword + type/origin. Exemples :

| Événement | Catégorie | Sous-catégorie |
|-----------|-----------|----------------|
| Dentiste | Santé | Consultation |
| Réunion Sprint | Travail | Réunion |
| Basic Fit | Sport | Entraînement |
| Anniversaire | Famille | Événement familial |
| Voyage | Déplacement | Voyage |

Architecture prête pour IA future (scores de confiance par règle).

## Semantic Scoring

- **Importance** 1–5 (RDV médical = 5)
- **Stress** 0–100
- **Énergie** avant/après
- **Flexibilité** (médical = fixe)
- **Impacts** famille, objectifs, santé, finances, social

## Daily Load Engine

Calcule par jour :

- charge mentale / physique
- temps concentration, déplacement, personnel, famille, travail, santé, libre

Alimente le **Human Model** via `semanticMentalLoad`.

## Life Balance Engine

Évalue équilibre **quotidien**, **hebdomadaire**, **mensuel**.

Signaux : `overload`, `sleep_deficit`, `no_sport`, `no_personal_time`, `work_overinvestment`, `family_imbalance`, `balanced`.

## Insight Engine

Insights explicables avec :

- **Pourquoi**
- **Quelles données**
- **Quel calcul**
- **Confiance**

Exemples : absence de temps personnel, RDV médicaux concentrés, lundis surchargés.

## Prediction Engine

Architecture uniquement — **pas d'IA générative** :

- probabilité surcharge, retard, annulation, objectif non atteint
- `architectureOnly: true` sur chaque prédiction

## Goal Impact Engine

Liaison automatique événement ↔ objectifs (Marathon, Santé, Études…).

## Household Engine

Vision foyer : temps ensemble, libre commun, parents, enfants, individuel.

## Human Model

Le Human Model **consomme** — ne recalcule plus la charge quand le semantic engine est actif :

- `mentalLoadRule` → `semanticMentalLoad`
- `availabilityRule` → `semanticBalanceScore`

Fallback legacy si flag désactivé.

## Daily Brief

Hints sémantiques injectés dans la synthèse :

- « Aujourd'hui sera chargé »
- « Tu disposes de X heures libres »
- « Tu peux avancer ton objectif Sport »

## Action Engine

Guards sémantiques :

- `canRescheduleSemantically` — RDV médical non déplaçable
- `shouldBlockMedicalBeforeSport`
- `shouldProposeReorganizeDay` — utilise charge sémantique

## Explainability

Chaque insight inclut `SemanticExplainability` : why, dataUsed, calculation, confidenceLevel.

## UI

**Organisation → Compréhension IA** (`/organization/ai-understanding`)

Affiche : catégories, charge, équilibre, foyer, insights, confiance IA, événements enrichis.

## Indépendance connecteurs

Le Semantic Engine lit **uniquement** `PlanningCalendarEngine` — **aucune** dépendance Google / Outlook / Apple.

## Tests

```bash
npm run test:semantic-planning-engine
```

Profils : célibataire, couple, famille, étudiant, travailleur posté, indépendant.

## Roadmap IA prédictive

1. Modèles ML sur historique `external_calendar_events`
2. Features sémantiques comme input (category, stress, flexibility)
3. Calibration confiance vs `architectureOnly`
4. Feedback utilisateur sur insights

## Structure

```
src/semanticPlanningEngine/
├── classification/classificationEngine.ts
├── scoring/semanticScoringEngine.ts
├── load/dailyLoadEngine.ts
├── balance/lifeBalanceEngine.ts
├── insights/insightEngine.ts
├── prediction/predictionEngine.ts
├── goals/goalImpactEngine.ts
├── household/householdEngine.ts
├── action/semanticActionGuards.ts
├── brief/semanticBriefHints.ts
├── explain/explainability.ts
├── engine/semanticPlanningEngine.ts
└── index.ts
```

## Références

- [EPIC 5A — Planning Engine](./EPIC5_PLANNING_ENGINE.md)
- [EPIC 5B — Calendar Sync](./EPIC5B_CALENDAR_SYNC.md)
