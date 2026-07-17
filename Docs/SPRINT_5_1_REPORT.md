# Sprint 5.1 — Mémoire vivante & apprentissage progressif

**Date :** 17 juillet 2026  
**Type :** évolution du coach (pas de multiplication de pages)

## Objectif

L'IA apprend **progressivement** comment fonctionne son utilisateur, adapte ses propositions et reste **transparente** — jamais une boîte noire.

Pipeline :

```
Historique + check-ins + stats + corrections → LivingHabitProfile → Tendances → Insights → Missions → Adaptations
```

## Quality gate

| Commande | Résultat |
|----------|----------|
| `npm test` | ✅ 764 tests |
| `npm run build` | ✅ |
| `npm run lint` | ✅ |
| `npm run verify:schema` | ✅ |
| `npm run verify:supabase` | ✅ |

---

## 1 — Mémoire vivante

### Fichier central

`src/ai/memory/livingMemoryEngine.ts` — orchestrateur `buildLivingMemory()`

Analyse :

- activités terminées / annulées / reports (`task_activity_events`)
- `calendar_items` complétés
- check-ins (`daily_checkins`)
- statistiques hebdomadaires
- corrections utilisateur (`profile_facts`)

Service : `src/services/livingMemoryService.ts` — `loadLivingMemory()`, `saveLivingInsightFeedback()`

---

## 2 — LivingHabitProfile

`src/ai/memory/buildLivingHabitProfile.ts`

Métriques évolutives (`EvolvingMetric<T>`) :

- `preferredStudyTime`, `preferredWorkoutDuration/Day/Hour`
- `preferredCoupleTime`, `preferredSleepTime`
- `averageWorkoutDuration`, `averageStudyDuration`
- `averageCancellationRate`, `bestProductivityWindow`
- `fatigueRecoverySpeed`, `preferredFreeTimeBlocks`
- `socialMediaTolerance`, `favoriteLeisureActivities`

Jamais figées — recalculées à chaque chargement.

---

## 3 — Détection de tendances

`src/ai/memory/habitTrendEngine.ts` — `detectHabitTrends()`

Directions : `improving` | `degrading` | `stable`

Exemples :

- Révisions du matin plus efficaces
- Sport après 20 h rarement terminé
- Meilleur jour de la semaine
- Séances longues souvent raccourcies

---

## 4 — Niveau de connaissance

`src/ai/memory/knowledgeLevelEngine.ts`

Paliers :

1. Je commence à te connaître
2. Je comprends tes habitudes
3. Je connais très bien ton rythme
4. Je peux anticiper certaines décisions

Basé sur : ancienneté, volume de données, confirmations, confiance moyenne.

Affiché sur `/my-ai` avec confiance globale et progression.

---

## 5 — Insights automatiques

Chaque `LivingInsight` inclut :

- `confidence`, `firstSeen`, `lastConfirmed`, `evidenceCount`, `status`
- `reasoning` + `evidence[]` (transparence)

Génération : `src/ai/memory/generateLivingInsights.ts`

---

## 6 — Validation utilisateur

Sur `/my-ai` : **Exact** / **Faux** / **Plus tard**

- Faux → confiance ÷ ~85 % immédiatement, insight retiré
- Exact → confiance +12
- Plus tard → statut `deferred`, confiance -8

Persistance : `profile_facts` (`habit_correction_*`, `living_insight_meta_*`)

---

## 7 — Objectifs évolutifs

`buildEvolvingGoalSuggestions()` dans `adaptiveDurationEngine.ts`

Propositions d'augmenter ou réduire objectifs sport/révision — toujours expliquées, jamais imposées.

---

## 8 — Mission du jour

`src/ai/memory/dailyMissionEngine.ts` — **une seule** mission/jour

Catégories : sport, révision, famille, couple, repos, spiritualité, organisation, temps calme.

Widget accueil : `DailyMissionBanner.tsx`

---

## 9 — Mission hebdomadaire

`src/ai/memory/weeklyMissionEngine.ts` — mission **facultative**

Exemples : 3 séances sport, heures de révision, zéro report.

---

## 10 — Adaptation automatique

`adaptiveDurationEngine.ts` — durées sport/révision/calme calibrées depuis le profil.

Intégration : `slotActivitySuggestionEngine.ts` via `livingHabitProfile`.

Messages d'adaptation visibles sur Mon IA et dans le coach proactif.

---

## 11 — Page Mon IA enrichie

`/my-ai` — sections :

- Niveau de connaissance + personnalité coach
- Mission du jour / hebdo
- Ce que j'ai appris récemment
- Ce que j'apprends encore
- Ce dont je ne suis pas certain
- Tendances, adaptations, objectifs évolutifs
- Validation des insights (preuves + raisonnement)

---

## 12 — Personnalité du coach

`resolveCoachPersonality()` — messages selon palier de connaissance.

Intégré dans `proactiveCoachEngine.ts` + `ProactiveCoachBanner`.

---

## 13 — Transparence

Chaque insight/tendance/mission/adaptation expose :

- preuves (`evidence[]`)
- raisonnement (`reasoning`)
- historique (`firstSeen`, `lastConfirmed`)

---

## Tests Sprint 5.1

`src/ai/memory/sprint51.test.ts` — 14 scénarios (A–N) :

- apprentissage profil
- tendances
- baisse confiance (Faux)
- validation (Exact / Plus tard)
- missions jour/hebdo
- adaptation durées
- niveau connaissance
- insights + mémoire vivante

---

## Migrations

Aucune — persistance via `profile_facts` existant.

---

## Correctif critique — `/spiritual` (boutons inactifs)

### Causes identifiées

1. **`AddToDayModal`** utilisait la classe inexistante `modal-backdrop` (pas de overlay fixed/z-index) → la modal était invisible ou hors écran après « Ajouter à ma journée ».
2. **`useEffect` sur `engineInput`** réinitialisait immédiatement le contenu après « Afficher une autre proposition / prière » → effet visuel nul.
3. **Chips « Prendre un temps »** sans suggestion correspondante → clic silencieux.
4. Handlers dispersés sans feedback d'erreur unifié.

### Correctifs

| Fichier | Correction |
|---------|------------|
| `AddToDayModal.tsx` | `modal-overlay` + `createPortal(document.body)` |
| `RelaxationPlayerModal.tsx` | Expérience guidée (chrono, démarrer, pause, terminer) |
| `spiritualSpaceActions.ts` | Inventaire central + `logSpiritualAction` (dev) |
| `SpiritualSpacePage.tsx` | Handlers centralisés, feedback succès/erreur, anti-répétition |

### Actions mappées

`refreshSuggestion`, `addSuggestionToDay`, `startRelaxation`, `addFavorite`, `removeFavorite`, `showAnotherPrayer`, `openSpotify`, `savePreferences`, `addCalmTime`, `focusPreferences`

### Tests

`src/lib/spiritual/spiritualSpaceFix.test.ts` — scénarios A–R

---

## Migrations (spiritual)

Aucune — table `spiritual_favorites` déjà en place.

---

## Fichiers clés

| Fichier | Rôle |
|---------|------|
| `src/types/livingMemory.ts` | Types LivingMemory, LivingHabitProfile, missions |
| `src/ai/memory/livingMemoryEngine.ts` | Orchestrateur |
| `src/ai/memory/habitTrendEngine.ts` | Tendances |
| `src/ai/memory/dailyMissionEngine.ts` | Mission jour |
| `src/ai/memory/weeklyMissionEngine.ts` | Mission hebdo |
| `src/services/livingMemoryService.ts` | Chargement async |
| `src/pages/MyAiPage.tsx` | UI enrichie |
| `src/components/coach/DailyMissionBanner.tsx` | Accueil |
| `src/styles/sprint51.css` | Styles |
