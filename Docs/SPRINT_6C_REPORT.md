# Sprint 6C — Rapport EPIC Daily Check-in & State Engine

## Objectif

Créer le moteur qui capture l'état réel de l'utilisateur en ~30 secondes, historise les check-ins, calcule les tendances et alimente tous les moteurs IA — sans diagnostic médical, sans blocage.

## Ce qui a été livré

### Module `src/dailyStateEngine/`

| Composant | Fichier | Rôle |
|-----------|---------|------|
| Types | `types/dailyStateTypes.ts` | DailyState, modes, tendances |
| Store | `store/dailyStateStore.ts` | localStorage, skips, settings |
| Engine | `engine/dailyStateEngine.ts` | Orchestrateur submit / skip / analyze |
| Adaptive | `adaptive/adaptiveQuestionEngine.ts` | Skip sommeil, question mal dormi |
| Trends | `trends/trendEngine.ts` | 7d / 30d / 12m |
| Bridge | `bridge/dailyCheckinBridge.ts` | Sync legacy Supabase check-in |
| Phrasing | `phrasing/statePhrasing.ts` | Conversation + proactive + semantic |
| Guards | `guards/stateEngineGuards.ts` | Action confidence, priorité HM |
| Human Model helpers | `humanModel/dailyStateHumanModel.ts` | Mapping énergie / stress / sommeil |
| Diagnostics | `diagnostics/buildDailyStateDiagnostics.ts` | UI historique |

### Câblage

| Fichier | Modification |
|---------|--------------|
| `featureFlags.ts` | `VITE_DAILY_STATE_ENGINE` |
| `assistantContext.ts` | Snapshot `dailyState` |
| `contextEngine.ts` | Daily state avant proactive + semantic insight |
| `fatigueRule`, `stressRule`, `sleepRule` | Priorité check-in du jour |
| `responseBuilder.ts` | Hints ton adapté |
| `suggestionEngine.ts` | Réduction si `dailyEnergy ≤ 4` |
| `actionBuilders.ts` | `actionConfidenceFromState` sur moveTask |
| `routes.ts`, `AppRouter`, `appNavigationItems` | Routes + nav |
| Test utils | `DISABLED_DAILY_STATE` |

### UI

| Composant | Rôle |
|-----------|------|
| `DailyCheckinFlow.tsx` | Parcours 5 étapes + adaptatif + skip |
| `DailyCheckinPage.tsx` | Page gate `/daily-check-in` |
| `DailyCheckinGate.tsx` | Redirect si pas de check-in ni skip aujourd'hui |
| `DailyStateDayWidget.tsx` | Widget accueil « État du jour » |
| `DailyStateHistoryPage.tsx` | Historique, tendances, mode check-in |

### Tests (9 fichiers)

`dailyStateEngine.test.ts`, `adaptiveQuestionEngine.test.ts`, `trendEngine.test.ts`, `stateEngineGuards.test.ts`, `statePhrasing.test.ts`, `humanModelDailyState.test.ts`, `proactiveDailyState.test.ts`, `conversationDailyState.test.ts`, `fixtures.ts`

Script : `npm run test:daily-state-engine`

### Documentation

- `Docs/EPIC6C_DAILY_STATE.md`

## Principes respectés

1. Check-in **≤ 30–45 s** — pas un questionnaire
2. **Facultatif** — skip tracé, jamais bloquant après « Passer »
3. DailyState **prioritaire** sur les déductions automatiques
4. **Aucune action automatique** — propositions adaptées uniquement
5. Tendances **sans diagnostic médical**

## Activation

```env
VITE_DAILY_STATE_ENGINE=true
```

## Points de test manuel

1. Activer le flag, se connecter un nouveau jour
2. Vérifier redirect vers `/daily-check-in`
3. Compléter le check-in → accès normal + widget accueil
4. « Passer » → accès immédiat, pas de re-blocage
5. `/daily-state/history` — tendances 7j/30j/12m, changement de mode
6. Conversation — ton adapté selon énergie
7. Human Model — énergie déclarée prime sur planning chargé

## Limites connues

- Persistance principale en localStorage (bridge Supabase à l'enregistrement)
- Gate basé sur la date appareil (`getCurrentDeviceDate`)
- Styles check-in minimalistes (classes existantes réutilisées)

## Fichiers impactés (principaux)

`src/dailyStateEngine/**`, `src/components/dailyState/**`, `src/pages/DailyCheckinPage.tsx`, `src/pages/DailyStateHistoryPage.tsx`, `src/pages/HomePage.tsx`, `src/app/router/AppRouter.tsx`, `src/lib/navigation/routes.ts`, `src/ai/**` (context, rules, action, conversation)

## Qualité

- `npm run test:daily-state-engine` — 25/25
- `npm test` — **1349/1349**
- `npm run build` — OK
- `npm run lint` — warnings préexistants (e2e fixtures) ; aucun nouveau bloquant EPIC 6C
