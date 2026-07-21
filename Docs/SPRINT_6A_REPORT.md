# Sprint 6A — Rapport EPIC Adaptive Intelligence Engine

## Objectif

Créer le moteur d'apprentissage progressif : observer → détecter habitude → calculer confiance → proposer préférence → validation utilisateur. **Aucune adaptation silencieuse.**

## Ce qui a été livré

### Module `src/adaptiveIntelligenceEngine/`

| Composant | Fichier | Rôle |
|-----------|---------|------|
| Types | `types/adaptiveTypes.ts` | Observations, habitudes, propositions, timeline |
| Observation | `observation/observationEngine.ts`, `observationStore.ts` | Comportements + historisation |
| HabitDetector | `habit/habitDetector.ts` | Sport, sommeil, travail, études… |
| Preference | `preference/preferenceProposalEngine.ts`, `preferenceStore.ts` | Propositions pending + validation |
| Confidence | `confidence/confidenceEngine.ts` | Calcul explicable |
| Timeline | `timeline/learningTimeline.ts` | Traçabilité complète |
| Consolidation | `consolidation/memoryConsolidationEngine.ts` | Architecture only |
| Notifications | `events/adaptiveNotificationBus.ts` | Architecture only |
| Phrasing | `phrasing/adaptivePhrasing.ts` | « J'ai remarqué… » — jamais « J'ai changé… » |
| Action guards | `action/adaptiveActionGuards.ts` | Validated preferences only |
| Orchestrateur | `engine/adaptiveIntelligenceEngine.ts` | analyze() |
| Diagnostics | `diagnostics/buildAdaptiveDiagnostics.ts` | UI + debug |

### Câblage

| Fichier | Modification |
|---------|--------------|
| `featureFlags.ts` | `VITE_ADAPTIVE_INTELLIGENCE` |
| `assistantContext.ts` | `adaptiveIntelligence` snapshot |
| `contextEngine.ts` | Analyse adaptative post-planning/semantic |
| `ruleTypes.ts` | Champs adaptive pour Human Model |
| `motivationRule.ts` | Consomme validated preferences only |
| `actionBuilders.ts` | Confiance adaptive pour moveTask |
| `responseBuilder.ts` | Phrasing hints adaptatifs |
| `routes.ts`, `AppRouter`, `appNavigationItems` | `/organization/adaptive-learning` |
| Test utils | `DISABLED_ADAPTIVE_INTELLIGENCE` |

### UI

- `pages/AdaptiveIntelligencePage.tsx` — Organisation → Apprentissage IA
- Observations, habitudes, propositions, validation/refus, timeline, filtres, recherche

### Tests (8 fichiers)

ObservationEngine, HabitDetector, PreferenceProposalEngine, ConfidenceEngine, LearningTimeline, validation, profils (7 scénarios).

### Documentation

- `Docs/EPIC6A_ADAPTIVE_INTELLIGENCE.md`

## Principes respectés

1. L'IA observe et propose — **ne modifie jamais** Planning / Semantic / Memory
2. Préférences **pending** n'influencent **rien**
3. Human Model + Action Engine = **validated only**
4. Confiance **toujours explicable**
5. Timeline **traçable**
6. Notifications **architecture only**

## Activation

```env
VITE_PLANNING_CALENDAR_ENGINE=true
VITE_ADAPTIVE_INTELLIGENCE=true
# Optionnel pour catégories enrichies :
VITE_SEMANTIC_PLANNING_ENGINE=true
```

## Points de test manuel

1. Activer les flags ci-dessus
2. Ouvrir `/organization/adaptive-learning`
3. Vérifier observations et habitudes détectées
4. Valider ou refuser une proposition pending
5. Vérifier timeline mise à jour
6. Conversation — hints « J'ai remarqué… » si proposition pending
7. Human Model — motivation utilise validated preferences

## Limites connues

- Stockage localStorage (pas de sync cloud)
- Consolidation mémoire non exécutée automatiquement
- Notifications en queue uniquement
- Détection keyword/heure — pas de ML

## Fichiers impactés (principaux)

- `src/adaptiveIntelligenceEngine/**` (nouveau)
- `src/pages/AdaptiveIntelligencePage.tsx`
- `src/config/featureFlags.ts`
- `src/ai/conversationFoundation/**`
- `src/ai/humanModelFoundation/**`
- `src/ai/actionEngine/builders/actionBuilders.ts`
- `src/lib/navigation/**`
- `package.json`
- `Docs/EPIC6A_ADAPTIVE_INTELLIGENCE.md`

## Qualité

- `npm run test:adaptive-intelligence-engine` — **33/33**
- `npm test` — **1298/1298**
- `npm run build` — OK
- `npm run lint` — warnings préexistants (e2e fixtures) ; aucun lint sur le module 6A
