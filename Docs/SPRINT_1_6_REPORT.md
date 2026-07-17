# Sprint 1.6 — Rapport « Contexte familial daté »

> **Date :** 13 juillet 2026  
> **Statut :** ✅ Terminé  
> **Objectif :** permettre au Planning Vivant de comprendre les changements temporaires de situation familiale sur une plage de dates, avec couchers enfants explicites

---

## Résumé

Le Sprint 1.6 introduit les **périodes de contexte familial** (`family_context_periods`), les **routines par enfant** (`child_routines`), et branche le moteur sur un `PlanningContext` daté via `loadPlanningContextForDate()`.

**Build :** `npm run build` ✅  
**Lint :** `npm run lint` ✅  
**Tests :** `npm test` ✅ (24 tests)  
**Supabase :** `npm run verify:supabase` ✅

---

## Livrables

### 1. Périodes de contexte (`family_context_periods`)

Migration `00003_family_context_periods.sql` — 13 types, RLS par foyer.

| Champ | Rôle |
|-------|------|
| `context_type` | vacances, déplacement, parent seul, enfant malade… |
| `starts_at` / `ends_at` | Plage datée (heures facultatives) |
| `user_id` | Adulte concerné (ex. déplacement William) |
| `affected_member_id` | Enfant concerné |
| `impact` | jsonb complémentaire |
| `status` | `active` / `cancelled` |

**Service :** `familyContextService.ts`  
**Moteur :** `familyContextEngine.ts` — fusion d’impacts, chevauchements, bannières accueil

### 2. Interface `/family-context`

Page `FamilyContextPage.tsx` :

- Ajouter / modifier / annuler / supprimer une période
- Dates + heures facultatives
- Sélection adulte ou enfant concerné
- Liste des périodes actives et futures

### 3. Impact sur le planning

| Type | Effet moteur |
|------|--------------|
| `user_vacation` | Pas de contraintes travail / trajets |
| `work_travel` | Utilisateur indisponible — aucune tâche assignée |
| `solo_parent` | Max 60 % remplissage, moins de tâches perso |
| `children_vacation` | Pas de départ école/crèche automatique |
| `child_sick` | Micro-tâches ≤ 20 min, charge réduite |

Adaptations exposées dans `DayPlan.contextAdaptations` et affichées sur `/planning`.

### 4. Heures de coucher explicites

Migration `00004_child_routines.sql` + champs foyer dans `profile_facts` :

- `evening_routine_start`
- `evening_routine_manager`
- `average_evening_routine_minutes`
- Par enfant : `bedtime_weekday`, `bedtime_weekend`, `evening_routine_minutes`, `wake_time`

**Formule routine du soir :**

```
start = coucher le plus tôt − durée moyenne routine
end   = coucher le plus tard
```

Exemple : 19:45 & 20:30, routine 60 min → **18:45–20:30**

**Module :** `lib/planning/eveningRoutine.ts`

### 5. Memory context daté

`HouseholdMemoryContext` inclut désormais :

- `familyContextPeriods`
- `childRoutines`
- `householdEvening`

`loadPlanningContextForDate({ userId, date })` → `ResolvedFamilyContext` pour la date ciblée.

### 6. Accueil et planning

- `/home` : bandeau discret (`getHomeContextHints`) — ex. « William est en déplacement jusqu'au 24 juillet »
- `/planning` : section « Adaptations du jour »

### 7. Mon quotidien enrichi

`DailyRoutinePage` : section routine du soir foyer + fiche par enfant (couchers, durée routine).

---

## Tests (A–J)

| ID | Scénario | Fichier |
|----|----------|---------|
| A | Vacances → pas de travail | `planningEngine.test.ts` |
| B | William absent → tâche filtrée | `planningEngine.test.ts` |
| C | Parent seul → max 60 % | `planningEngine.test.ts` |
| D | Vacances enfants → pas départ école | `planningEngine.test.ts` |
| E | Couchers 19:45 & 20:30, routine 60 min | `eveningRoutine.test.ts` |
| F | Deux enfants horaires différents | `eveningRoutine.test.ts` |
| G | Données coucher absentes | `eveningRoutine.test.ts` |
| H | Période en cours de journée | `familyContextEngine.test.ts` |
| I | Chevauchement de périodes | `familyContextEngine.test.ts` |
| J | Période annulée ignorée | `familyContextEngine.test.ts` |

---

## Architecture

```
family_context_periods + child_routines
        ↓
loadPlanningContextForDate(userId, date)
        ↓
resolveFamilyContextForDate() + computeEveningRoutineWindow()
        ↓
planningEngine.buildDayConstraints() + generateDayPlan()
        ↓
calendar_items + bannières /home et /planning
```

---

## Hors périmètre (respecté)

- Chat IA
- Spotify / notifications
- Google Calendar sync
- Invitation conjoint / mode couple complet

---

## Critère de fin Sprint

✅ L'utilisateur peut déclarer une période de vacances, une absence (déplacement) et des heures précises de coucher des enfants — le planning s'adapte correctement.
