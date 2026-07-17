# Sprint 4.6 — Sport exécutable, ressenti utilisateur & replanification dynamique

> **Date :** 16 juillet 2026  
> **Statut :** ✅ Livré (migration `00016_daily_checkins.sql` à appliquer sur Supabase distant)  
> **Objectif :** reconnaître le sport manuel, exécuter une vraie séance avec chrono, capter le ressenti du jour et replanifier réellement quand un bloc bouge ou s'allonge

---

## Contraintes respectées

| Contrainte | Statut |
|------------|--------|
| Aucun modèle IA externe | ✅ Moteurs déterministes uniquement |
| Pas de régression | ✅ 552 tests (+22 sprint 4.6) |
| Quality gate local | ✅ build, lint, test, verify:schema, verify:supabase |

---

## 1. Classification centralisée des activités

| Fichier | Rôle |
|---------|------|
| `src/lib/planning/classifyCalendarItemActivity.ts` | Fonction pure `classifyCalendarItemActivity(item)` |

Retourne : `activityCategory`, `isSport`, `sportType`, `isManual`, `isEditable`, `isCancellable`, `isMovable`, `isCompletable`, `visualType`, `hasWorkoutSession`.

Sources : `item_type`, `title`, `details.businessType`, `details.activityType`, `details.suggestionType`, `details.workoutSession`, `details.category`, `blockType` — **pas le titre seul**.

Intégration : `displayedDayTimeline.ts` (`mapPersistedItemToVisualType`, `persistedItemToTimelineEntry`).

---

## 2. RDV Sport manuel (formulaire calendrier)

| Fichier | Rôle |
|---------|------|
| `src/lib/calendar/manualConstraint.ts` | `buildSportManualDetails()` — `businessType: "sport"`, `activityType: "workout"`, `workoutSession` optionnel |
| `src/services/calendarService.ts` | Création / mise à jour avec paramètres séance |
| `src/pages/CalendarPage.tsx` | Type Sport + case « Générer une séance sportive » |

`item_type` Supabase reste compatible avec le CHECK existant (`task` pour sport manuel).

---

## 3. Actions sur activité sport manuelle

| Fichier | Rôle |
|---------|------|
| `src/components/planning/BlockActionsMenu.tsx` | Faire la séance, Voir la séance, Générer / Autre séance, Modifier, Décaler, Je n'ai pas le temps, Annuler, Terminer |
| `src/services/blockActionService.ts` | Actions sans masquage pour `source=user` ou `locked=true` |

Items manuels verrouillés : action autorisée ; confirmation sur modifications importantes côté UI existante.

---

## 4. Player de séance + chronomètre guidé

| Fichier | Rôle |
|---------|------|
| `src/components/planning/WorkoutSessionPlayer.tsx` | Panneau plein écran — exercice en cours, suivant, tours, pause/reprise, passer/précédent, arrêter/terminer |
| `src/hooks/useWorkoutTimer.ts` | États `idle` / `running` / `paused` / `completed` / `cancelled` ; compte à rebours ; avance auto ; persistance `sessionStorage` ; vibration / son optionnels (jamais auto) |
| `src/lib/workout/workoutSessionSteps.ts` | Aplatissement `WorkoutSession` → étapes timer |
| `src/services/workoutSessionService.ts` | Génération, attachement, fin de séance + `task_activity_events` |

Câblage : `useDayPlan`, `HomePage`, `PlanningPage`, `DayTimeline`, `TodayTimelineWidget`.

---

## 5. Fin / arrêt anticipé de séance

- **Terminée** → statut `completed`, événement `task_activity_events`, message positif, suggestion récupération courte
- **Arrêt anticipé** → choix : partiellement terminé, interrompu, trop difficile, manque de temps — enregistré sans culpabilisation

Persistance `details.workoutSession` + statut après F5.

---

## 6. Ressenti sur l'accueil

| Fichier | Rôle |
|---------|------|
| `src/components/home/DailyCheckinWidget.tsx` | « Comment te sens-tu ? » — compact sur `HomePage` |
| `src/types/dailyCheckin.ts` | Humeurs + `resolveCheckinPlanningImpact()` |
| `src/services/dailyCheckinService.ts` | Chargement / sauvegarde |
| `supabase/migrations/00016_daily_checkins.sql` | Table `daily_checkins` + RLS (une ligne / utilisateur / jour) |

Humeurs : En pleine forme, Bien, Moyen, Fatigué, Épuisé, Stressé, Malade — intensité facultative 1–5.

---

## 7. Impact Life Engine

| Fichier | Rôle |
|---------|------|
| `src/ai/lifeEngine.ts` | `predictEnergy()`, `resolveLifeContext()` utilisent le check-in du jour |
| `src/ai/memoryEngine.ts` | `dailyCheckin` dans `PlanningContext` |
| `src/services/memoryContextService.ts` | Chargement check-in |

Règles : allègement progressif (Fatigué → Épuisé), marges si Stressé, planning minimal si Malade, pas de sport intense si fatigue.

---

## 8. Replanification dynamique & temps libre tampon

| Fichier | Rôle |
|---------|------|
| `src/lib/planning/replanAfterBlockMove.ts` | `replanAfterBlockMove(...)` — contraintes dures, flexibles, temps libres, sans chevauchement ni doublon |
| `src/lib/planning/absorbDurationChangeWithFreeTime.ts` | Allongement : absorption temps libre après → avant → marges → déplacement flexible → report |
| `src/types/flexibleBuffer.ts` + `src/lib/planning/flexibleBuffer.ts` | Type `FlexibleBuffer` — buffer absorbable avec minimum conservé |
| `src/services/dynamicReplanService.ts` | Application des mises à jour Supabase |
| `src/services/blockAdjustmentService.ts` | Décaler / rallonger → replan dynamique puis moteur |

Action « Je n'ai pas le temps » : réduire, reporter, annuler, déplacer, garder — modifications réelles en base.

---

## 9. Tests automatisés (A → U)

Fichier : `src/lib/work/sprint46.test.ts`

| ID | Cas |
|----|-----|
| A | Activité Sport manuelle reconnue |
| B | Modifiable |
| C | Annulable |
| D | Séance générée depuis RDV sport |
| E | Bouton Faire la séance ouvre le player |
| F | Timer démarre |
| G | Pause / reprise |
| H | Exercice suivant automatique |
| I | Fin de séance enregistrée |
| J | Check-in « Fatigué » |
| K | Check-in « Épuisé » |
| L | Planning allégé après check-in |
| M | Déplacement plus tard aujourd'hui |
| N | Allongement absorbé par temps libre suivant |
| O | Déplacement sans chevauchement |
| P | Report en dernier recours |
| Q | Pas de doublon |
| R | Persistance après F5 (details séance) |
| S | « Je n'ai pas le temps » fonctionne |
| T | Durée activité conservée |
| U | Temps libre minimum conservé |

---

## Migration requise

`supabase/migrations/00016_daily_checkins.sql`

---

## Quality gate (16 juillet 2026)

| Commande | Résultat |
|----------|----------|
| `npm run build` | ✅ |
| `npm run lint` | ✅ (warnings hooks préexistants) |
| `npm test` | ✅ 552+ tests |
| `npm run verify:schema` | ✅ |
| `npm run verify:supabase` | ✅ |

---

## Correctif hotfix — « Faire la séance » inopérant (v2)

### Causes identifiées

1. Séances persistées mappées sur `proposedWorkoutSession` → mauvais flux UI.
2. Propositions sur créneaux libres (`visualType: "free"`) rejetées comme `not_sport` sans feedback visible.
3. Player monté localement dans HomePage/PlanningPage — pas de provider global ni bannière d'erreur.

### Correctifs

- `WorkoutPlayerProvider` dans `AuthenticatedAppLayout` (toutes les pages auth)
- `handleStartWorkout` → `isWorkoutPlayerOpen = true` + portal sur `document.body`
- Bannière `workout-feedback-banner` si échec (z-index 1001)
- `isSportTimelineEntry` inclut les propositions libres
- `stopPropagation` sur les boutons « Faire la séance »
- Test interaction DOM : `WorkoutPlayerContext.test.ts` (clic → overlay + « Démarrer »)
- E2E Playwright : `e2e/workout-player.spec.ts` (`PLAYWRIGHT_TEST_EMAIL/PASSWORD`)

### Chemin d'exécution

`BlockActionsMenu` → `openWorkoutSessionForEntry` → `handleStartWorkout` → `openPlayer` → portal `WorkoutSessionPlayer`

### Validation automatisée

- `npm test` — **561 tests** ✅
- `npm run build` — ✅
- `npm run test:e2e` — skip sans credentials Playwright

---

## Tests manuels recommandés

1. Créer RDV Sport manuel → reconnu, actions visibles  
2. Générer séance → Faire la séance → chrono pause/reprise/terminer  
3. Accueil → Fatigué → planning allégé  
4. Décaler un bloc → replanification visible  
5. Rallonger un bloc → temps libre suivant absorbé  
6. F5 → persistance séance et check-in  

---

## Fichiers clés

```
src/lib/planning/classifyCalendarItemActivity.ts
src/lib/planning/replanAfterBlockMove.ts
src/lib/planning/absorbDurationChangeWithFreeTime.ts
src/lib/planning/flexibleBuffer.ts
src/hooks/useWorkoutTimer.ts
src/components/planning/WorkoutSessionPlayer.tsx
src/components/home/DailyCheckinWidget.tsx
src/services/dailyCheckinService.ts
src/services/dynamicReplanService.ts
src/services/workoutSessionService.ts
src/lib/work/sprint46.test.ts
supabase/migrations/00016_daily_checkins.sql
src/styles/sprint46.css
```
