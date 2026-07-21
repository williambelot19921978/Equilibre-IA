# Sprint 5C — Rapport EPIC Semantic Planning Engine

## Objectif

Transformer le Planning Engine en moteur de **compréhension de la vie** via une couche sémantique read-only, sans modifier le PlanningCalendarEngine ni les connecteurs externes.

## Ce qui a été livré

### Module `src/semanticPlanningEngine/`

| Composant | Fichier | Rôle |
|-----------|---------|------|
| Types | `types/semanticCalendarItem.ts`, `semanticTypes.ts` | SemanticCalendarItem, scores, insights |
| Classification | `classification/classificationEngine.ts` | Règles keyword (Santé, Travail, Sport…) |
| Scoring | `scoring/semanticScoringEngine.ts` | Importance, stress, énergie, flexibilité |
| Daily Load | `load/dailyLoadEngine.ts` | Charge mentale/physique, buckets temps |
| Life Balance | `balance/lifeBalanceEngine.ts` | Équilibre jour/semaine/mois |
| Insights | `insights/insightEngine.ts` | Messages explicables |
| Prediction | `prediction/predictionEngine.ts` | Architecture only |
| Goal Impact | `goals/goalImpactEngine.ts` | Liens événement ↔ objectifs |
| Household | `household/householdEngine.ts` | Vision foyer |
| Explainability | `explain/explainability.ts` | why / data / calculation |
| Brief hints | `brief/semanticBriefHints.ts` | Daily Brief |
| Action guards | `action/semanticActionGuards.ts` | RDV médical, réorganisation |
| Orchestrateur | `engine/semanticPlanningEngine.ts` | enrichSnapshot, analyze |
| Diagnostics | `diagnostics/buildSemanticDiagnostics.ts` | UI + debug |

### Câblage

| Fichier | Modification |
|---------|--------------|
| `featureFlags.ts` | `VITE_SEMANTIC_PLANNING_ENGINE` |
| `assistantContext.ts` | `semanticPlanning` snapshot |
| `contextEngine.ts` | Analyse sémantique post-PCE |
| `ruleTypes.ts` | Champs semantic pour Human Model |
| `mentalLoadRule.ts` | Consomme semanticMentalLoad |
| `availabilityRule.ts` | Consomme semanticBalanceScore |
| `buildDailyBrief.ts` | `semanticHints` optionnel |
| `actionBuilders.ts` | `shouldProposeReorganizeDay` |
| `routes.ts`, `AppRouter`, `appNavigationItems` | `/organization/ai-understanding` |
| Test utils | `DISABLED_SEMANTIC_PLANNING` |

### UI

- `pages/SemanticPlanningPage.tsx` — Organisation → Compréhension IA

### Tests (10 fichiers)

Classification, scoring, load, balance, insights, goals, household, action guards, profils (6 scénarios).

### Documentation

- `Docs/EPIC5C_SEMANTIC_ENGINE.md`

## Principes respectés

1. Planning Engine = source de vérité — **inchangé**
2. Semantic Engine = enrichissement — **jamais mutation**
3. Indépendant Google / Outlook / Apple
4. Human Model consomme — ne recalcule plus (si flag actif)
5. Explainability sur chaque insight

## Activation

```env
VITE_PLANNING_CALENDAR_ENGINE=true
VITE_SEMANTIC_PLANNING_ENGINE=true
```

## Points de test manuel

1. Activer les flags ci-dessus
2. Ouvrir `/organization/ai-understanding`
3. Vérifier catégories, charge, insights
4. Ouvrir Mon Profil IA — charge mentale via semantic
5. Daily Brief — hints sémantiques dans la synthèse

## Limites connues

- Classification keyword-only (IA future)
- Predictions architecture only
- Balance hebdo/mensuelle : même snapshot jour (fenêtre multi-jours = EPIC futur)
- Guardian E2E non exécuté dans ce sprint

## Statut

- Code, tests, docs : livrés
- Commit / merge / deploy : **non effectués** (attente validation)
