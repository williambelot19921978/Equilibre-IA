# Sprint 6B — Rapport EPIC Proactive Intelligence Engine

## Objectif

Créer le moteur de proactivité : savoir quand intervenir, attendre ou se taire. **Propose uniquement — jamais d'action automatique.**

## Ce qui a été livré

### Module `src/proactiveIntelligenceEngine/`

| Composant | Fichier | Rôle |
|-----------|---------|------|
| Types | `types/proactiveTypes.ts` | Suggestions, score, timeline, transitions |
| Attention | `attention/attentionEngine.ts` | Moment opportun, différer, annuler |
| Score | `score/proactiveScoreEngine.ts` | Priorisation explicable |
| Policy | `policy/interventionPolicy.ts` | Périodes sensibles |
| Quiet Hours | `quiet/quietHoursPolicy.ts` | Sommeil, vacances, famille |
| Suggestions | `suggestion/suggestionEngine.ts`, `suggestionStore.ts` | 7 types + lifecycle |
| Timeline | `timeline/proactiveTimeline.ts` | Historisation transitions |
| Digest | `digest/digestBuilder.ts` | Regroupement intelligent |
| Learning | `learning/proactiveLearningEngine.ts`, `proactiveBehaviorStore.ts` | Fréquence adaptative |
| Notifications | `notification/notificationDispatcher.ts` | Architecture only |
| Life Transition | `transition/lifeTransitionEngine.ts` | Changements durables (bonus) |
| Action guards | `action/proactiveActionGuards.ts` | Prépare actions — n'exécute pas |
| Phrasing | `phrasing/proactivePhrasing.ts` | Propose, jamais « c'est fait » |
| Orchestrateur | `engine/proactiveIntelligenceEngine.ts` | analyze() |
| Diagnostics | `diagnostics/buildProactiveDiagnostics.ts` | UI + debug |

### Câblage

| Fichier | Modification |
|---------|--------------|
| `featureFlags.ts` | `VITE_PROACTIVE_INTELLIGENCE` |
| `assistantContext.ts` | `proactiveIntelligence` snapshot |
| `contextEngine.ts` | Analyse proactive post-adaptive |
| `proactiveBehaviorRule.ts` | Human Model — tolérance, taux accept/refus |
| `humanModel.ts`, `humanModelEngine.ts` | Champ `proactiveBehavior` |
| `responseBuilder.ts` | Phrasing hints proactifs |
| `routes.ts`, `AppRouter`, `appNavigationItems` | `/organization/proactive-ai` |
| Test utils | `DISABLED_PROACTIVE_INTELLIGENCE` |

### UI

- `pages/ProactiveIntelligencePage.tsx` — Organisation → IA proactive

### Tests (8 fichiers)

AttentionEngine, SuggestionEngine, DigestBuilder, QuietHoursPolicy, ProactiveScore, ProactiveTimeline, profils (6 scénarios).

### Documentation

- `Docs/EPIC6B_PROACTIVE_INTELLIGENCE.md`

## Principes respectés

1. Proactivité **n'autorise jamais** une action automatique
2. Toute suggestion passe par **AttentionEngine**
3. Notifications **architecture only**
4. Refus répétés → **fréquence réduite** (observation, pas suppression)
5. Life transitions → **proposition** de mise à jour préférences
6. Explainability complète sur chaque suggestion

## Activation

```env
VITE_PLANNING_CALENDAR_ENGINE=true
VITE_PROACTIVE_INTELLIGENCE=true
# Recommandé :
VITE_SEMANTIC_PLANNING_ENGINE=true
VITE_ADAPTIVE_INTELLIGENCE=true
```

## Points de test manuel

1. Activer les flags ci-dessus
2. Ouvrir `/organization/proactive-ai`
3. Vérifier suggestions, scores, explainability
4. Accepter / ignorer une suggestion → timeline + métriques comportement
5. Conversation — hint proactif si suggestion affichable
6. Human Model — section comportement proactif

## Limites connues

- Stockage localStorage
- Notifications en queue uniquement
- Life transitions keyword/heuristique
- Pas de push/email réel

## Qualité

- `npm run test:proactive-intelligence-engine` — **26/26**
- `npm test` — **1324/1324**
- `npm run build` — OK
- `npm run lint` — warnings préexistants (e2e fixtures)
