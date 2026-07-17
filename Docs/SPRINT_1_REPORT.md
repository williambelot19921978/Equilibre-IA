# Sprint 1 — Rapport Planning vivant V1

> **Date :** 13 juillet 2026  
> **Statut :** ✅ Terminé  
> **Contrainte respectée :** moteur déterministe, aucune API LLM, aucune IA payante

---

## Résumé

Le Sprint 1 livre une première version fonctionnelle du **planning vivant** : génération automatique d'une journée à partir du foyer, des enfants, du profil, de la découverte et des tâches. Le moteur est purement déterministe, testé unitairement, persisté dans `calendar_items`, consultable sur `/planning` et résumé sur `/home`.

**Build :** `npm run build` ✅  
**Lint :** `npm run lint` ✅  
**Tests :** `npm test` ✅ (8 tests)  
**Supabase :** `npm run verify:supabase` ✅

---

## Audit initial (avant modification)

| Zone | État Sprint 0.5 | Gap Sprint 1 |
|------|-----------------|--------------|
| `HouseholdMemoryContext` | Foyer + enfants + facts + profil base | Manquait `PlanningContext` dédié |
| `memoryEngine` | Lit discovery + profil base | Helpers wake/bed/work à formaliser |
| `tasksService` | CRUD + skip_count | Pas de `getTasksForPlanning`, pas de `planned` |
| Types | `database.ts` partiel | Pas de types planning |
| Migrations | Schéma documenté Sprint 0 | `calendar_items` non documentée |
| `HomePage` | Placeholder planning | Pas de résumé jour |
| `AppRouter` | Navigation auto Sprint 0.5 | Pas de route `/planning` |
| Planning | — | Tout à construire |

**Décision clé :** utiliser `calendar_items` (table existante Supabase) plutôt que créer `plan_blocks`.

---

## Architecture choisie

```
HouseholdMemoryContext
        ↓
buildPlanningContext()
        ↓
planningEngine (fonctions pures)
  ├── buildDayConstraints()
  ├── findAvailableSlots()
  ├── scoreTask() / prioritizeTasks()
  ├── splitTaskIfNeeded()
  └── generateDayPlan()
        ↓
decisionEngine.validatePlannedBlock()
        ↓
planningService → calendar_items (Supabase)
        ↓
useDayPlan → PlanningPage / HomePage
```

| Couche | Fichier | Rôle |
|--------|---------|------|
| Types | `src/types/planning.ts` | `DayConstraint`, `AvailableSlot`, `PlannedBlock`, `DayPlan`, `PlanningResult`… |
| Temps | `src/lib/time/daySchedule.ts` | Combinaison date/heure, durées, chevauchements |
| Mémoire | `src/ai/memoryEngine.ts` | `PlanningContext`, `buildPlanningContext()`, helpers horaires |
| Moteur | `src/ai/planningEngine.ts` | Génération déterministe du plan |
| Décision | `src/ai/decisionEngine.ts` | Validation des blocs proposés |
| Service | `src/services/planningService.ts` | Lecture/écriture `calendar_items` |
| Hook | `src/hooks/useDayPlan.ts` | Chargement, génération, régénération |
| UI | `src/pages/PlanningPage.tsx` | Timeline journalière mobile-first |

---

## Algorithme

### 1. Contraintes dures (`buildDayConstraints`)

Générées uniquement à partir de données connues :

| Contrainte | Sources | Condition |
|------------|---------|-----------|
| Réveil / sommeil | `sleep_schedule` | Toujours (défaut 07:00 / 22:00 si absent + signal incomplet) |
| Routine matin enfants | `children_departure_time` + `morning_children_duration` | Si enfants + données complètes |
| Trajet aller/retour | `commute_duration` + `work_schedule` | Jour travaillé |
| Travail | `work_schedule` + `work_days` | Jour travaillé |
| Routine soir enfants | `children_evening_routine` + `bed_time` | Durée estimée (signalée) |
| Manuelles | `calendar_items` `locked=true` | Conservées telles quelles |

**Règle :** aucune heure inventée pour les routines enfants si donnée manquante.

### 2. Créneaux libres (`findAvailableSlots`)

- Journée = réveil → coucher
- Soustraction des contraintes + buffers 12 min
- Durées négatives ignorées
- Énergie estimée par période (matin haut, soir bas, après-travail selon `after_work_energy`)

### 3. Priorisation (`scoreTask` + `prioritizeTasks`)

Score basé sur :
- priorité 1–5 (×20)
- urgence échéance (0–50)
- alignement `main_priority` (+15)
- `skip_count` élevé → **bonus** (+25 si ≥3) pour proposer version courte, pas de pénalité
- splittable (+5)
- compatibilité énergie créneau (+10)

### 4. Découpage (`splitTaskIfNeeded`)

- `splittable` → segments de `preferred_focus_duration` ou 25 min, min 10 min
- `skip_count >= 3` → session unique 10–20 min « redémarrage doux »
- Titres : « Module X — partie 1/3 »

### 5. Placement + validation

- Max 80 % du temps libre
- Max 3 tâches par demi-journée
- Au moins une marge conservée
- `faith_importance=disabled` → aucune tâche spiritualité
- Pas de tâche longue (studies/work) si énergie faible
- Chaque bloc porte une `PlanningExplanation`

### 6. Persistance (`planningService`)

- Supprime uniquement les propositions `source=engine`, `locked=false`, `status≠completed`
- Insère le nouveau plan dans `calendar_items`
- Met les tâches placées en `status=planned`

---

## Fichiers créés

| Fichier |
|---------|
| `src/types/planning.ts` |
| `src/lib/time/daySchedule.ts` |
| `src/ai/planningEngine.ts` |
| `src/ai/decisionEngine.ts` |
| `src/ai/planningEngine.test.ts` |
| `src/services/planningService.ts` |
| `src/hooks/useDayPlan.ts` |
| `src/pages/PlanningPage.tsx` |
| `supabase/migrations/00002_calendar_items_documented.sql` |
| `vitest.config.ts` |
| `docs/SPRINT_1_REPORT.md` |

## Fichiers modifiés

| Fichier | Changement |
|---------|------------|
| `src/types/database.ts` | `CalendarItemRecord`, `CalendarItemDetails` |
| `src/types/index.ts` | Exports planning |
| `src/ai/memoryEngine.ts` | `PlanningContext`, `buildPlanningContext()`, helpers |
| `src/services/tasksService.ts` | `getTasksForPlanning()`, `markTasksAsPlanned()` |
| `src/pages/HomePage.tsx` | Résumé planning du jour |
| `src/lib/navigation/routes.ts` | Route `/planning` |
| `src/lib/navigation/navigationEngine.ts` | Accès post-onboarding |
| `src/app/router/AppRouter.tsx` | Route protégée PlanningPage |
| `src/index.css` | Styles planning |
| `package.json` | Scripts `test`, dépendance vitest |
| `docs/PROJECT_BIBLE.md` | `calendar_items` remplace `plan_blocks` |
| `docs/ROADMAP.md` | Sprint 1 coché |

---

## Migrations

`supabase/migrations/00002_calendar_items_documented.sql` — documentation uniquement (table déjà existante côté Supabase). Aucune colonne supplémentaire requise : `details` JSONB porte `explanation`, `status`, `facts`, segments.

---

## Tests unitaires (8/8 ✅)

| Test | Résultat |
|------|----------|
| Contraintes journée travail + enfants | ✅ |
| Créneaux libres sans chevauchement | ✅ |
| Protection sommeil | ✅ |
| Découpage tâche 120 min splittable | ✅ |
| skip_count >= 3 → session courte | ✅ |
| Tâche non planifiable (600 min, non splittable) | ✅ |
| Limite remplissage 80 % | ✅ |
| Absence de chevauchement dans le plan | ✅ |

Commande : `npm test`

---

## Tests manuels

| Scénario | Statut | Notes |
|----------|--------|-------|
| A. Journée travail avec enfants | 📋 À valider en local | Contraintes générées par algorithme |
| B. Journée sans travail | 📋 À valider | `work_days` sans le jour courant |
| C. Tâche 120 min splittable | ✅ Test unitaire | |
| D. Tâche 120 min non splittable | ✅ Test unitaire | |
| E. Tâche reportée 3 fois | ✅ Test unitaire | |
| F. Énergie basse après travail | 📋 À valider | `after_work_energy=low` |
| G. Échéance proche | 📋 À valider | Score urgence intégré |
| H. Contrainte locked existante | 📋 À valider | Non supprimée à la régénération |
| I. Rafraîchissement après génération | 📋 À valider | Rechargement via `useDayPlan` |
| J. Recalcul sans doublon | 📋 À valider | `deleteAutoProposalsForDate` |

---

## Limites du sprint

- Pas d'acceptation/déplacement/report de blocs (Sprint 2)
- Pas de génération automatique à l'ouverture de `/home` (bouton explicite)
- Routine soir : durée estimée si pas d'horaire explicite
- Réveil/coucher : défaut 07:00/22:00 si absents (signalé comme incomplet)
- Pas de drag & drop, pas de vue hebdomadaire
- Pas de coach proactif sur les rejets

---

## Dettes techniques

| ID | Description |
|----|-------------|
| D-01 | `calendar_items` non typée via Supabase CLI |
| D-02 | RLS `calendar_items` non versionnée dans le repo |
| D-03 | Preview planning non sauvegardé si items existants (charge DB d'abord) |
| D-04 | `calculateKnowledgeProgress` inchangé (hors périmètre) |
| D-05 | Pas de tests E2E navigateur |

---

## Prochaine étape recommandée

**Sprint 2 — Modification conversationnelle sans LLM** : accepter/reporter/déplacer des blocs, commandes textuelles prédéfinies, replanification déclenchée par l'utilisateur.
