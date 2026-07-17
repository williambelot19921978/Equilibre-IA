# Sprint 4.4 — Journée réaliste, actions flexibles et reprise après annulations

> **Date :** 16 juillet 2026  
> **Statut :** ✅ Livré (migration `00013` à appliquer sur Supabase distant)  
> **Objectif :** alléger l'accueil, intégrer les repas, limiter le soir à 1–2 activités, générer de vraies séances sport, actions sur chaque bloc et reprise progressive après annulations

---

## Contraintes respectées

| Contrainte | Statut |
|------------|--------|
| Pas de nouvelle IA externe / LLM | ✅ Moteurs déterministes purs |
| Planning Engine traçable | ✅ `buildDayConstraints` + replanification existante |
| Formulations non culpabilisantes | ✅ `recoveryPriorityEngine` + `buildRecoveryMessage` |
| Quality gate local | ✅ build, lint, 497 tests |
| Migration versionnée | ✅ `00013_sprint44_realistic_day.sql` |

---

## 1. Accueil allégé — calendrier hors centre

### Changements

| Fichier | Rôle |
|---------|------|
| `src/types/homePreferences.ts` | `calendar_widget_position` / `_mobile` ; `calendar` retiré des widgets visibles par défaut |
| `src/components/home/HeaderCalendarWidget.tsx` | Mini-calendrier compact en haut à droite (desktop) |
| `src/components/navigation/DrawerCalendarSection.tsx` | Mini-calendrier dans le drawer si préférence `drawer` |
| `src/pages/HomePage.tsx` | Calendrier central supprimé ; header + stack épuré |

### Préférences `calendar_widget_position`

| Valeur | Desktop (défaut) | Mobile (défaut) |
|--------|------------------|-----------------|
| `header_right` | ✅ | — |
| `hidden` | — | ✅ |
| `drawer` | Option | Option (menu ☰) |

La page **Calendrier** (`/calendar`) reste la source principale pour la vue mensuelle complète.

---

## 2. Repas explicites dans le planning

### Configuration

**Mon quotidien** → `MealSettingsSection` :

- Petit déjeuner : activé/désactivé, durée, horaire habituel facultatif
- Dîner : durée, heure habituelle, avant routine du soir

Persistance : `user_home_preferences.meal_settings` (jsonb).

### Placement

| Fichier | Rôle |
|---------|------|
| `src/lib/planning/mealPlacement.ts` | `placeBreakfast`, `placeDinner` |
| `src/ai/planningEngine.ts` | Contraintes `breakfast` et `dinner` |
| `src/types/planning.ts` | Types `breakfast`, `dinner`, `evening_transition` |

**Règles :**

- Matin : réveil → petit déjeuner → préparation → départ
- Soir : retour → dîner → routine enfants → coucher enfants → activités soir
- Incohérences horaires : pas de chevauchement silencieux (warnings via placement)

---

## 3. Soirée : maximum 2 activités

### Moteur réécrit

`src/ai/eveningOpportunityEngine.ts` — Sprint 4.4 :

- **Max 2 activités** planifiées (hors `wind_down` et `keep_free`)
- Créneau court : 1 activité max
- Créneau long : 2 activités max + temps libre
- Fatigue élevée / parent seul : activité légère ou aucune
- Marge 20–30 min avant coucher adulte (`wind_down`)
- Temps libre conservé (≥ 45 min)
- `suggestions_only` reste le mode par défaut

Compatible Sprint 4.3 : `fillRatio ≤ 0.6` conservé pour les tests existants.

---

## 4. Sport : séance concrète `WorkoutSession`

| Fichier | Rôle |
|---------|------|
| `src/types/workoutSession.ts` | Structure complète (warmup, rounds, cooldown…) |
| `src/ai/sportSessionGenerator.ts` | `generateWorkoutSession()` |
| `src/components/planning/WorkoutSessionPanel.tsx` | Détail + bouton « Voir la séance » |
| Persistance | `calendar_items.metadata.workout_session` |

**Garde-fous :** pas de séance intense tard le soir (`isIntenseSportBlocked`) ; fatigue élevée → intensité `gentle`.

---

## 5. Actions sur chaque bloc

| Action | Comportement |
|--------|--------------|
| Décaler | Plus tard aujourd'hui / demain / personnalisé → replanification |
| Je n'ai pas le temps | Modal : annuler / reporter / réduire 10–15 min / garder |
| Modifier | Via `EditBlockModal` (page Planning) |
| Terminer | Marque tâche `done`, reset `consecutive_cancellations` |
| Annuler | Incrémente compteurs + reprise progressive |

| Fichier | Rôle |
|---------|------|
| `src/components/planning/BlockActionsMenu.tsx` | UI actions + modals |
| `src/services/blockActionService.ts` | `applyBlockAction` |
| `src/lib/planning/blockActionHelpers.ts` | `isHardConstraint`, explications |
| `src/hooks/useDayPlan.ts` | `handleBlockAction` |
| `DayTimeline` + `TodayTimelineWidget` | Actions visibles sur timeline |

**Contraintes dures** (travail, sync calendrier) : annulation bloquée avec message explicite.

---

## 6. Reprise après annulations

| Fichier | Rôle |
|---------|------|
| `src/ai/recoveryPriorityEngine.ts` | `resolveRecoveryRecommendation` |
| `src/types/recoveryPriority.ts` | `RecoveryRecommendation` |
| Colonnes `tasks` | `cancellation_count`, `consecutive_cancellations`, `last_cancelled_at`, `last_completed_at` |

| Annulations | Stratégie |
|-------------|-----------|
| 1 | Autre créneau |
| 2 | Durée réduite |
| 3 | Micro-version 10–15 min |
| 4+ | Question sur la cause (7 options) |

Formulation type : *« J'ai remarqué que cette activité a été annulée plusieurs fois. Je vais t'aider à la rendre plus facile à réaliser. »*

---

## 7. Historique comportemental

Table `task_activity_events` :

- Types : `created`, `planned`, `started`, `completed`, `skipped`, `cancelled`, `shortened`, `moved`
- RLS : lecture/insertion par `user_id`
- Service : `taskActivityEventService.ts` (appelé depuis `blockActionService`)

---

## Migration `00013`

```sql
-- Colonnes user_home_preferences
calendar_widget_position, calendar_widget_position_mobile, meal_settings

-- Colonnes tasks
cancellation_count, last_cancelled_at, consecutive_cancellations, last_completed_at

-- Table
task_activity_events (+ RLS)
```

> **À appliquer** : `verify:schema` signale `task_activity_events` absent sur le projet distant au moment du rapport.

---

## Tests automatisés (Sprint 4.4)

Fichier : `src/lib/work/sprint44.test.ts` — **21 cas** (A–U) :

| ID | Sujet |
|----|-------|
| A–C | Accueil / calendrier header / drawer |
| D–F | Repas matin et soir |
| G–I | Soirée 1–2 activités + temps libre |
| J–K | Séance sport + garde-fou soir |
| L–N | Actions bloc (helpers) |
| O–Q | Reprise progressive + ton |
| R–U | Doublons, persistance, events, contraintes dures |

**Total suite :** 497 tests (36 fichiers).

---

## Quality gate

| Commande | Résultat |
|----------|----------|
| `npm run build` | ✅ |
| `npm run lint` | ✅ (warnings préexistants hooks / fast-refresh) |
| `npm test` | ✅ **497 tests** (+19 sprint 4.4) |
| `npm run verify:schema` | ⚠️ **15/16** — `task_activity_events` absent (migration non appliquée) |
| `npm run verify:supabase` | ✅ Connexion OK |
| `npm run preview` | ⚠️ Non relancé (port 4173 souvent occupé) |

---

## Fichiers créés

- `supabase/migrations/00013_sprint44_realistic_day.sql`
- `src/types/mealSettings.ts`, `workoutSession.ts`, `recoveryPriority.ts`, `taskActivity.ts`
- `src/ai/recoveryPriorityEngine.ts`
- `src/lib/planning/mealPlacement.ts`, `blockActionHelpers.ts`
- `src/services/blockActionService.ts`, `taskActivityEventService.ts`
- `src/components/home/HeaderCalendarWidget.tsx`
- `src/components/navigation/DrawerCalendarSection.tsx`
- `src/components/planning/BlockActionsMenu.tsx`, `WorkoutSessionPanel.tsx`
- `src/components/profile/MealSettingsSection.tsx`
- `src/lib/work/sprint44.test.ts`

## Fichiers modifiés (principaux)

- `src/ai/eveningOpportunityEngine.ts`, `planningEngine.ts`, `sportSessionGenerator.ts`, `memoryEngine.ts`
- `src/pages/HomePage.tsx`, `PlanningPage.tsx`, `DailyRoutinePage.tsx`
- `src/components/planning/DayTimeline.tsx`
- `src/components/home/widgets/TodayTimelineWidget.tsx`
- `src/services/homePreferencesService.ts`, `memoryContextService.ts`
- `src/types/homePreferences.ts`, `planning.ts`
- `src/styles/sprint42.css`
- `scripts/verify-schema.mjs`

---

## Tests manuels recommandés

1. Accueil sans grand calendrier central ; mini-calendrier en haut à droite (desktop)
2. Menu ☰ avec mini-calendrier si préférence `drawer` (mobile)
3. Mon quotidien → repas → planning matin avec petit déjeuner
4. Planning soir : dîner avant routine enfants
5. Après coucher enfants : 1 activité + temps libre (pas 4–5 blocs)
6. Choisir Sport → séance complète avec échauffement / circuit / retour au calme
7. Décaler une activité → message explicatif + pas de doublon
8. « Je n'ai pas le temps » → modal choix → réduction 10 min
9. Annuler 3–4 fois → micro-version puis question cause
10. F5 → persistance séance sport et compteurs annulation

> Tests navigateur non exécutés automatiquement — validation par tests unitaires + quality gate.

---

## Critères d'acceptation

- [x] Calendrier n'encombre plus l'accueil (défaut : header_right desktop, hidden mobile)
- [x] Matin et soir incluent correctement les repas configurés
- [x] Soirée contient au maximum deux activités planifiées
- [x] Sport génère une vraie séance `WorkoutSession`
- [x] Chaque bloc peut être décalé ou annulé (contraintes dures protégées)
- [x] La journée se réorganise après action (`applyTimelineEditAndReplan`)
- [x] Annulations répétées déclenchent reprise progressive, jamais punitive
- [ ] Migration `00013` appliquée sur Supabase distant (action ops)

---

## Limites connues / suites

- UI de personnalisation accueil : pas encore de sélecteur `calendar_widget_position` dans la modale (valeurs DB + défauts)
- `recoveryPriorityEngine` consommé dans les actions bloc ; pas encore dans le placement automatique des tâches
- `daysSinceSport` pas encore alimenté dans `buildEveningOpportunityInput`
- Action « Modifier » sur timeline accueil : redirection vers Planning recommandée
