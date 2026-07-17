# Sprint 4.7 — Accomplissements, encouragements et objectifs réalisés en avance

> **Date :** 16 juillet 2026  
> **Statut :** ✅ Livré — aucune migration Supabase requise (données dans `calendar_items.details` + `task_activity_events.metadata`)  
> **Objectif :** statut terminé visible, feedback positif varié, reconnaissance des réalisations en avance, persistance après F5

---

## Contraintes respectées

| Contrainte | Statut |
|------------|--------|
| Aucun modèle IA externe | ✅ Moteurs déterministes uniquement |
| Pas de régression | ✅ 578 tests (+17 sprint 4.7) |
| Quality gate local | ✅ build, lint, test, verify:schema, verify:supabase |
| Preview | ✅ build OK ; port 4173 déjà occupé en local |

---

## 1. Pipeline unifié de complétion

| Fichier | Rôle |
|---------|------|
| `src/services/activityCompletionService.ts` | `completeActivityWithFeedback()` — timing, feedback, `details`, événement, replan |
| `src/services/blockActionService.ts` | Action « Terminer » déléguée au service unifié |
| `src/services/workoutSessionService.ts` | Fin de séance sport → même pipeline |

Flux : évaluation timing → encouragement → merge `details` (préserve `workoutSession`) → `task_activity_events` → replan si fin en avance → retour feedback + timeline.

---

## 2. Statut terminé visible

| Fichier | Rôle |
|---------|------|
| `src/lib/planning/resolveCompletionStatusLabel.ts` | Labels par type : « Séance effectuée », « Tâche terminée », etc. |
| `src/lib/planning/displayedDayTimeline.ts` | Mappe `details` → `completed`, `completionStatusLabel`, `actualCompletedAt` |
| `src/components/planning/DayTimeline.tsx` | Badge, coche, mention « en avance », message compact |
| `src/components/planning/BlockActionsMenu.tsx` | Masque les actions si bloc déjà terminé |
| `src/styles/sprint47.css` | Style distinct pour blocs accomplis |

Persistance F5 : champs stockés dans `calendar_items.details` (`completion_status_label`, `actual_completed_at`, `completion_timing`, etc.).

---

## 3. Heures réelles & timing

| Fichier | Rôle |
|---------|------|
| `src/lib/planning/evaluateCompletionTiming.ts` | Fonction pure ±5 min → `early` / `on_time` / `late` / `unscheduled` |
| `src/types/achievementFeedback.ts` | `ActivityCompletionDetails` |

Champs enregistrés dans `details` :

- `scheduled_starts_at`, `scheduled_ends_at`
- `actual_started_at`, `actual_completed_at`
- `completion_delta_minutes`, `completion_timing`
- `freed_minutes` si fin en avance

---

## 4. Moteur d'encouragement

| Fichier | Rôle |
|---------|------|
| `src/ai/achievementFeedbackEngine.ts` | `resolveAchievementFeedback()` — variantes, tons, niveaux de célébration |
| `src/types/achievementFeedback.ts` | Types `AchievementFeedback`, `CelebrationLevel` |

Entrées : type d'activité, timing, durée, priorité, reports, fatigue (`daily_checkins`), séance sport.

Anti-répétition : historique des 8 derniers `feedbackId` en `sessionStorage`.

Niveaux : `discrete` (micro-tâche), `normal` (défaut), `important` (priorité, reprise après reports, avance nette, séance complète).

---

## 5. Fin en avance & temps libéré

| Fichier | Rôle |
|---------|------|
| `src/lib/planning/releaseEarlyFinishTime.ts` | Calcule minutes libérées, raccourcit le bloc |
| `src/lib/planning/absorbDurationChangeWithFreeTime.ts` | Réutilisé — ne déplace pas les contraintes dures |

Comportement : `ends_at` mis à l'heure réelle de fin ; créneau restant libéré ; message proposant pause / avancer une priorité — **sans remplissage automatique**.

---

## 6. UI feedback immédiat

| Fichier | Rôle |
|---------|------|
| `src/components/home/RecentAchievementWidget.tsx` | Carte compacte temporaire sur l'accueil |
| `src/hooks/useDayPlan.ts` | État `recentAchievement` — sport + action « Terminer » |
| `src/pages/HomePage.tsx` | Widget accomplissement |
| `src/pages/PlanningPage.tsx` | Même widget sur le planning |

Timeline mise à jour sans F5 via `setBaseTimeline` / `loadPlan` après complétion.

---

## 7. Événements `task_activity_events`

Type DB : `completed` (CHECK existant).

Métadonnées enrichies :

- `completedEarly`, `completedOnTime`, `completedLate`
- `workoutCompleted`, `partialCompletion`
- `scheduledStart`, `scheduledEnd`, `actualStart`, `actualEnd`
- `deltaMinutes`, `feedbackId`, `freedMinutes`

---

## 8. Tests automatisés (A–Q)

Fichier : `src/lib/work/sprint47.test.ts` — 17 tests couvrant labels, timing, libération temps, variantes, persistance documentée, priorité, célébration discrète.

Test Sprint 4.6 I mis à jour : `completeActivityWithFeedback` remplace l'appel direct à `recordTaskActivityEvent` dans `workoutSessionService`.

---

## Quality gate (16 juillet 2026)

| Commande | Résultat |
|----------|----------|
| `npm run build` | ✅ |
| `npm run lint` | ✅ (warnings hooks préexistants) |
| `npm test` | ✅ 589 tests |
| `npm run verify:schema` | ✅ |
| `npm run verify:supabase` | ✅ |
| `npm run preview` | ⚠️ port 4173 déjà utilisé |

---

## Tests manuels recommandés

1. Lancer une séance sportive → terminer avant l'horaire  
2. Vérifier « Séance effectuée », message positif, mention « en avance »  
3. Vérifier créneau libéré sur la timeline  
4. F5 → statut et message persistés  
5. Terminer une tâche classique → message différent  
6. Terminer une séance sport → vérifier qu'aucune autre proposition sportive n'apparaît dans les créneaux libres  

---

## Correctif — une seule séance sportive proposée par jour

### Règle métier

Après une séance sportive réalisée (complète, partielle validée, ou manuelle terminée), l'objectif sport du jour est atteint. Aucune nouvelle proposition sportive automatique jusqu'au lendemain (date locale).

### Implémentation

| Fichier | Rôle |
|---------|------|
| `src/lib/planning/hasCompletedWorkoutForDate.ts` | Détection pure (`calendar_items.details`, `task_activity_events`) |
| `src/ai/lifeEngine.ts` | `workoutCompletedToday`, `sportPossible = false`, filtre loisirs sport |
| `src/lib/planning/sportProposalAttachment.ts` | Pas de `proposedWorkoutSession` si séance déjà faite |
| `src/ai/freeTimeSuggestionEngine.ts` | Pas de suggestion « Sport court » legacy |
| `src/lib/planning/lifeProposalAdapter.ts` | Filtre propositions sport du LifeContext |
| `src/services/taskActivityEventService.ts` | `loadTaskActivityEventsForDate()` |
| `src/pages/CalendarPage.tsx` | Confirmation avant 2e séance manuelle |
| `src/hooks/useDayPlan.ts` | Reset `sportProposalOverrides` après complétion |

### Tests A–K

Fichier : `src/lib/work/sprint47-workout-once.test.ts`

---

## Correctif — cohérence temporelle & planning simplifié

### Règles métier

- Une séance sportive prévue **un autre jour** ne peut ni être lancée ni terminée.
- La complétion est autorisée uniquement si la **date locale du bloc = aujourd'hui** (horloge appareil).
- Un grand créneau libre reste **un seul bloc « Temps libre »** avec **au plus une suggestion** facultative.
- Les durées proposées suivent la nature de l'activité (couple = soirée entière, film = long, sport = court).
- Les catégories déjà réalisées dans la journée ne sont plus reproposées automatiquement.

### Implémentation

| Fichier | Rôle |
|---------|------|
| `src/lib/planning/resolveWorkoutAvailability.ts` | Statuts `available_now`, `future_workout`, `another_workout_today`, etc. |
| `src/lib/planning/resolveBlockCompletionAvailability.ts` | Garde-fou avant écriture Supabase |
| `src/lib/planning/dailyActivityCompletionState.ts` | `workoutDone`, `studyDone`, `coupleTimeDone`, … |
| `src/lib/planning/resolveSuggestedActivityDuration.ts` | Durées cohérentes par type |
| `src/lib/planning/mergeAdjacentFreeTimeBlocks.ts` | Fusion blocs Temps libre adjacents |
| `src/lib/planning/displayedDayTimeline.ts` | Soirée = 1 bloc + `primarySuggestion` (sans découpage) |
| `src/ai/eveningOpportunityEngine.ts` | Max 1 activité / soirée |
| `src/ai/lifeEngine.ts` | Max 1 proposition principale + filtre complétions |
| `src/components/planning/BlockActionsMenu.tsx` | Messages séance future, « Voir la séance d'aujourd'hui », « Faire aujourd'hui exceptionnellement » |

### Tests A–P

Fichier : `src/lib/work/sprint47-temporal.test.ts`

---

## Quality gate (16 juillet 2026 — correctif temporal)

| Commande | Résultat |
|----------|----------|
| `npm run build` | ✅ |
| `npm run lint` | ✅ (warnings hooks préexistants) |
| `npm test` | ✅ 605 tests |
| `npm run verify:schema` | ✅ |
| `npm run verify:supabase` | ✅ |
| `npm run preview` | À lancer localement |

---

## Correctif — suggestions diversifiées & durées sportives cohérentes

### Règles métier

- **Plusieurs options** par créneau libre (max 5) — pas seulement sport/yoga.
- Catégories **répétables** selon limites quotidiennes (ex. révision jusqu'à 3×/jour, gap 90 min).
- **Sport automatique** : 1 seule proposition/jour ; manuel possible après confirmation.
- Durées sport **hors course** : 10–40 min par tranche de 5.
- Durées **course à pied** : 20–60 min par tranche de 10 (minimum 20 min).
- Rallongement d'une séance : **même structure**, ajout de rounds — pas de séance incohérente.

### Implémentation

| Fichier | Rôle |
|---------|------|
| `src/config/activityRepeatRules.ts` | Source de vérité `ACTIVITY_REPEAT_RULES`, `MAX_SLOT_SUGGESTIONS = 5` |
| `src/lib/planning/dailyActivityCompletionState.ts` | Compteurs journaliers + `canProposeCategoryAutomatically()` |
| `src/lib/planning/slotActivitySuggestionEngine.ts` | Scoring diversifié, `generateSlotActivitySuggestions()` |
| `src/lib/planning/lifeProposalAdapter.ts` | Modal « Me proposer une activité » → options par créneau |
| `src/lib/planning/resolveSportDuration.ts` | `snapSportDuration`, options 10–40 / 20–60 |
| `src/lib/planning/adaptWorkoutSessionDuration.ts` | `adaptWorkoutSessionDuration()` — rounds + durée exacte |
| `src/ai/workoutGenerationEngine.ts` | Durées via `snapSportDuration` |
| `src/components/planning/FreeTimeSuggestionModal.tsx` | Jusqu'à 5 choix pertinents |
| `src/components/planning/SportProposalCard.tsx` | Sélecteur durée + mise à jour immédiate |
| `src/hooks/useDayPlan.ts` | `changeSportDuration` via adaptation de séance |

### Matrice répétition (automatique / jour)

| Catégorie | Limite auto | Gap min | Manuel |
|-----------|-------------|---------|--------|
| Sport | 1 | — | ✅ |
| Révision | 3 | 90 min | ✅ |
| Lecture | 2 | — | ✅ |
| Temps calme | 2 | — | ✅ |
| Spiritualité | 2 | — | ✅ |
| Moment en couple | 1 | — | ✅ |
| Famille / Loisir | 2 | — | ✅ |
| Repos / Temps libre | illimité | — | ✅ |

### Tests A–P

Fichier : `src/lib/work/sprint47-diversity.test.ts`

Couverture : révision répétable, sport bloqué après séance, couple si conjoint présent, max 5 options, durées sport/course, adaptation 20→30→40 min, durée exacte, alternatives non-sport visibles.

---

## Quality gate (16 juillet 2026 — correctif diversité)

| Commande | Résultat |
|----------|----------|
| `npm run build` | ✅ |
| `npm run lint` | ✅ (warnings hooks préexistants) |
| `npm test` | ✅ 622 tests |
| `npm run verify:schema` | ✅ |
| `npm run verify:supabase` | ✅ |

---

## Correctif — révision visible & barre conversation en haut

### BUG 1 — Révision absente de la liste

**Cause :** `primarySuggestion` (soirée, `eveningOpportunityEngine`) et liste modal (`slotActivitySuggestionEngine`) étaient des pipelines indépendants ; la révision pouvait être recommandée en texte mais exclue par le filtre diversité (top 4 catégories).

**Correctif :**
- `ensurePrimarySuggestionInList.ts` — injecte la recommandation principale en 1re position avant la limite de 5
- `getWeeklyStudyProgress.ts` — temps planifié vs effectué (semaine locale, sans double comptage)
- Option Révision enrichie : titre, durée, raison, tâche, progression hebdomadaire
- Acceptation : `businessType: "study"`, `activityType: "revision"`, `task_id` lié
- Complétion : `studySession: true` dans `task_activity_events` — temps effectué uniquement à la terminaison

### BUG 2 — Chevauchement barre conversation (v1)

**Correctif initial :**
- `FloatingConversationBar` déplacée dans `AppShell`, sous le header (`app-conversation-band`)
- Panneau s'ouvre vers le bas ; espace réservé via `--conversation-bar-height`

---

## Correctif ciblé — durée révision, insertion planning, assistant compact

### BUG 1 — Durée révision imposée à 35 min

**Cause :** la durée recommandée était utilisée directement à l'acceptation, sans sélecteur utilisateur dans la modal.

**Correctif :**
- `resolveStudyRevisionDuration.ts` — options 10–60 min + personnalisé (min 5, max créneau), recommandation contextuelle (fatigue, heure, `preferred_focus_duration`, objectif hebdo)
- `FreeTimeSuggestionModal.tsx` — chips durée + mode personnalisé ; `chosenDurationMinutes` transmis à l'acceptation
- Durée recommandée mise en évidence, jamais imposée

### BUG 2 — Révision validée mais absente du planning

**Cause exacte :** le créneau soirée (`evening_available`) était ajouté en bloc **Temps libre complet** (ex. 20:30–23:30) via `freeSlotEntries.ts`, **sans tenir compte** d'une révision déjà insérée au début. L'item existait en base mais était masqué/noyé par le grand bloc Temps libre.

**Correctif :**
- `computeEveningFreeSegments.ts` — scinde la soirée autour des blocs occupés (révision acceptée)
- `freeSlotEntries.ts` — utilise les segments restants au lieu du slot soirée entier
- `displayedDayTimeline.ts` — révision affichée comme `visualType: "task"`, titre « Révision »
- `suggestionAcceptanceService.ts` — `acceptStudyRevisionSuggestion()` : INSERT dédié (`source=user`, `userAccepted: true`, `locked: true`), **sans** `generateAndSaveDayPlan` ; message « Révision ajoutée de HH:MM–HH:MM »
- `persistenceHelpers.ts` — protection `userAccepted === true` contre suppression auto lors de regénération

**Exemple attendu :** 20:30–21:00 Révision + 21:00–23:30 Temps libre (pas de nouveau petit bloc auto).

### BUG 3 — Barre conversation chevauchant le contenu

**Cause :** bande horizontale `app-conversation-band` sous le header + padding réservé créaient un chevauchement permanent.

**Correctif :**
- `ConversationHeaderTrigger` dans `AppShell` (`app-header-end`) — bouton compact ~260–340 px, « Parler à Équilibre IA »
- Panneau popover ancré au clic (desktop ~380–460 px, mobile plein écran / bottom sheet)
- Suppression de `app-conversation-band` et `--conversation-bar-height`
- Fermeture : clic extérieur, Échap ; z-index sous modales critiques

### Tests A–R

| Fichier | Couverture |
|---------|------------|
| `sprint47-revision-duration.test.ts` | A–I (durée, INSERT, segmentation soirée, affichage) |
| `sprint47-revision.test.ts` | J–K (plannedMinutes, completedMinutes) + liste modal |
| `conversation-layout.test.ts` | L–R (assistant compact header) |

---

## Quality gate (16 juillet 2026 — correctif ciblé)

| Commande | Résultat |
|----------|----------|
| `npm run build` | ✅ |
| `npm run lint` | ✅ (warnings hooks préexistants) |
| `npm test` | ✅ 648 tests |
| `npm run verify:schema` | ✅ |
| `npm run verify:supabase` | ✅ |

---

## Quality gate (16 juillet 2026 — révision & conversation v1)

| Commande | Résultat |
|----------|----------|
| `npm run build` | ✅ |
| `npm run lint` | ✅ |
| `npm test` | ✅ 641 tests |
| `npm run verify:schema` | ✅ |
| `npm run verify:supabase` | ✅ |

---

## Tests (révision v1)

- `sprint47-revision.test.ts` (A–J)
- `conversation-layout.test.ts` (A–I v1)

---

## Fichiers clés

```
src/ai/achievementFeedbackEngine.ts
src/services/activityCompletionService.ts
src/lib/planning/evaluateCompletionTiming.ts
src/lib/planning/resolveCompletionStatusLabel.ts
src/lib/planning/releaseEarlyFinishTime.ts
src/lib/planning/classifyCalendarItemActivityFromEntry.ts
src/components/home/RecentAchievementWidget.tsx
src/components/planning/DayTimeline.tsx
src/lib/work/sprint47.test.ts
src/lib/work/sprint47-workout-once.test.ts
src/lib/work/sprint47-temporal.test.ts
src/lib/work/sprint47-diversity.test.ts
src/config/activityRepeatRules.ts
src/lib/planning/slotActivitySuggestionEngine.ts
src/lib/planning/resolveSportDuration.ts
src/lib/planning/adaptWorkoutSessionDuration.ts
src/lib/planning/ensurePrimarySuggestionInList.ts
src/lib/planning/getWeeklyStudyProgress.ts
src/lib/planning/resolveStudyRevisionDuration.ts
src/lib/planning/computeEveningFreeSegments.ts
src/lib/work/sprint47-revision-duration.test.ts
src/lib/work/sprint47-revision.test.ts
src/lib/navigation/conversation-layout.test.ts
src/services/suggestionAcceptanceService.ts
src/components/conversation/FloatingConversationBar.tsx
src/components/navigation/AppShell.tsx
src/lib/planning/resolveWorkoutAvailability.ts
src/lib/planning/resolveBlockCompletionAvailability.ts
src/lib/planning/dailyActivityCompletionState.ts
src/lib/planning/mergeAdjacentFreeTimeBlocks.ts
src/lib/planning/hasCompletedWorkoutForDate.ts
src/styles/sprint47.css
```
