# Sprint 1.5 — Rapport « Une journée parfaite »

> **Date :** 13 juillet 2026  
> **Statut :** ✅ Terminé  
> **Objectif :** rendre le Planning Vivant réellement utilisable au quotidien

---

## Résumé

Le Sprint 1.5 ajoute deux pages de configuration (**Mon quotidien**, **Calendrier**), enrichit le moteur de placement (micro-sessions 20/15/10 min, explications contextualisées), et transforme l’accueil en tableau de bord actionnable.

**Build :** `npm run build` ✅  
**Lint :** `npm run lint` ✅  
**Tests :** `npm test` ✅ (10 tests)

---

## Livrables

### 1. Page « Mon quotidien » (`/daily-routine`)

Formulaire unique pour modifier :

| Donnée | Clé `profile_facts` |
|--------|---------------------|
| Réveil / coucher | `sleep_schedule` |
| Jours travaillés | `work_days` |
| Horaires travail | `work_schedule` |
| Trajet | `commute_duration` |
| Énergie après travail | `after_work_energy` |
| Départ enfants | `children_departure_time` |
| Durée matin enfants | `morning_children_duration` |
| Routine soir | `children_evening_routine` |
| Concentration idéale | `preferred_focus_duration` |
| Priorité principale | `main_priority` |

**Service :** `dailyRoutineService.ts` → upsert immédiat en base.  
**Effet :** la prochaine génération de planning lit ces facts via `buildPlanningContext()`.

### 2. Page « Calendrier » (`/calendar`)

CRUD des contraintes manuelles dans `calendar_items` :

- Types : travail exceptionnel, rendez-vous, école, activité enfant, médecin, sport, vacances, déplacement, événement libre
- `locked=true`, `source=manual`
- Le Planning Engine ne supprime ni ne déplace ces blocs

**Service :** `calendarService.ts`

### 3. Planning Engine amélioré

| Avant | Après |
|-------|-------|
| « Aucun créneau compatible » générique | Explication précise (`explainUnplannableReason`) |
| Un seul segment par tâche | `buildSegmentsToTry()` : normal + 20 + 15 + 10 min |
| Explications basiques | `buildPlacementSummary()` contextualisé (période, énergie, études, reports) |

### 4. Accueil enrichi (`/home`)

Résumé journalier :

- Prochaine activité
- Prochain créneau libre
- Tâches importantes restantes (priorité ≥ 4)
- Remplissage de la journée (%)
- Temps libre conservé
- Liens : Planning, Mon quotidien, Calendrier, Tâches

**Utilitaire :** `lib/planning/daySummary.ts`

---

## Architecture

```
DailyRoutinePage ──► dailyRoutineService ──► profile_facts
CalendarPage     ──► calendarService     ──► calendar_items (locked)
                          ↓
              loadHouseholdMemoryContext / buildPlanningContext
                          ↓
                   planningEngine (fallbacks + explications)
                          ↓
                   planningService → calendar_items (engine)
                          ↓
              HomePage / PlanningPage / useDayPlan
```

---

## Fichiers créés

| Fichier |
|---------|
| `src/config/dailyRoutineOptions.ts` |
| `src/types/dailyRoutine.ts` |
| `src/services/dailyRoutineService.ts` |
| `src/services/calendarService.ts` |
| `src/lib/planning/daySummary.ts` |
| `src/pages/DailyRoutinePage.tsx` |
| `src/pages/CalendarPage.tsx` |
| `docs/SPRINT_1_5_REPORT.md` |

## Fichiers modifiés

| Fichier | Changement |
|---------|------------|
| `src/ai/planningEngine.ts` | Fallbacks, explications, `explainUnplannableReason` |
| `src/ai/planningEngine.test.ts` | +2 tests (fallback, explication) |
| `src/services/profileFactsService.ts` | `upsertProfileFacts()` |
| `src/services/planningService.ts` | Résumé accueil enrichi |
| `src/services/tasksService.ts` | `getImportantRemainingTasks()` |
| `src/pages/HomePage.tsx` | Tableau de bord complet |
| `src/pages/PlanningPage.tsx` | Liens quotidien / calendrier |
| `src/lib/navigation/routes.ts` | `/daily-routine`, `/calendar` |
| `src/lib/navigation/navigationEngine.ts` | Routes post-onboarding |
| `src/app/router/AppRouter.tsx` | Nouvelles routes |
| `src/index.css` | Styles formulaires |

---

## Tests unitaires (10/10 ✅)

| Test | Résultat |
|------|----------|
| Contraintes journée travail + enfants | ✅ |
| Créneaux libres sans chevauchement | ✅ |
| Protection sommeil | ✅ |
| Découpage 120 min splittable | ✅ |
| skip_count ≥ 3 → session courte | ✅ |
| Micro-session pour tâche 600 min non splittable | ✅ |
| Limite 80 % remplissage | ✅ |
| Pas de chevauchement | ✅ |
| Segments fallback 20/15/10 | ✅ |
| Explication tâche spiritualité disabled | ✅ |

---

## Tests manuels recommandés

1. `/daily-routine` → modifier réveil → `/planning` → Générer → contraintes mises à jour
2. `/calendar` → ajouter rendez-vous verrouillé → régénérer → bloc préservé
3. Tâche longue non splittable → placée en 20 min avec explication
4. `/home` → résumé complet après génération
5. F5 sur chaque page → données persistées

---

## Limites restantes

- Pas d’acceptation/déplacement de blocs (Sprint 2)
- Routine soir : durée encore estimée si pas d’horaire explicite
- Pas de vue hebdomadaire
- RLS `calendar_items` non versionnée

---

## Prochaine étape

**Sprint 2 — Modification conversationnelle sans LLM** : accepter, reporter, déplacer des blocs via commandes prédéfinies.
