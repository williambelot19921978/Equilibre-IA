# Sprint 2.0 — Rapport « Accueil centré sur la journée »

> **Date :** 13 juillet 2026  
> **Statut :** ✅ Code livré — ⚠️ tests navigateur non exécutés automatiquement  
> **Objectif :** afficher le planning complet du jour sur l’accueil, cohérent avec `/planning`

---

## Cause de la disparition des blocs

| Symptôme | Cause exacte |
|----------|--------------|
| Réveil, travail, trajets, routines absents après génération / F5 | `useDayPlan.loadPlan` basculait sur `calendarItemsToDayPlan()` dès qu’**un** `calendar_item` existait en base |
| Conséquence | Seuls les blocs **persistés** (`task`, `buffer`, `event`) étaient affichés |
| Contraintes calculées | Jamais réinjectées (non stockées dans `calendar_items`) |
| Home vs Planning | `HomePage` utilisait `loadDayPlanSummary` (résumé chiffré) sans timeline ; `PlanningPage` partageait le bug ci-dessus |

**Étape fautive :** chargement affichage (`load` / mapping UI), pas le moteur ni la sauvegarde.

---

## Architecture timeline unifiée

```
loadDisplayedDayPlan()
  ├─ loadPlanningContextForDate
  ├─ loadCalendarItemsForDate
  ├─ getTasksForPlanning
  └─ buildDisplayDayView()
        ├─ buildDayConstraints()     → contraintes calculées
        ├─ generateDayPlan()           → métadonnées + preview tâches
        ├─ mergePersistedIntoDisplayPlan()
        └─ buildDisplayedDayTimeline()
              ├─ entrées computed (réveil, routines, travail, trajets, sommeil)
              ├─ entrées persisted (RDV, tâches, marges)
              └─ dedupeTimelineEntries()
```

### Fichiers clés

| Fichier | Rôle |
|---------|------|
| `src/lib/planning/displayedDayTimeline.ts` | `buildDisplayedDayTimeline`, déduplication, types visuels |
| `src/lib/planning/buildDisplayDayView.ts` | Fusion contraintes + persistance |
| `src/lib/planning/calendarBlockMapping.ts` | Mapping DB → `PlannedBlock` |
| `src/services/planningService.ts` | `loadDisplayedDayPlan` |
| `src/hooks/useDayPlan.ts` | Hook partagé Home + Planning |
| `src/components/planning/DayTimeline.tsx` | Composant timeline mobile-first |

---

## Changements HomePage

Nouvel ordre des sections :

1. **Aujourd’hui** — timeline complet + contexte actif + régénérer / modifier
2. **Prochaine activité** — activité suivante + prochain créneau libre
3. **Actions rapides** — Calendrier, Tâches, Mon quotidien, Planning
4. **Tâches importantes**
5. **Contexte familial actif** (si hints)
6. **« Ce que l’application a compris »** — section repliée (mémoire + découverte)

État vide :

> « Ta journée n’est pas encore organisée. » + bouton **Générer ma journée**

---

## Changements PlanningPage

- Utilise `useDayPlan` + `DayTimeline` (même source que l’accueil)
- Section unique **Timeline du jour** à la place des listes séparées contraintes / tâches / marges
- Conserve adaptations, alertes, éléments à corriger, tâches non planifiables

---

## Tests automatisés exécutés

| ID | Scénario | Résultat |
|----|----------|----------|
| A | Réveil + coucher | ✅ |
| B | Routine enfants | ✅ |
| C | Travail + trajets | ✅ |
| D | Rendez-vous manuel | ✅ |
| E | Tâche planifiée | ✅ |
| F | Fusion sans doublon RDV | ✅ |
| G | Ordre chronologique | ✅ |
| J | Contexte vacances | ✅ |
| K | Parent seul | ✅ |
| L | Contrainte manuelle → appointment | ✅ |

**Suite complète :** 81 tests Vitest ✅

Tests H et I (F5 / état vide) couverts par logique unitaire + hook ; pas de test E2E navigateur.

---

## Tests navigateur réels

| Scénario | Statut |
|----------|--------|
| Journée complète 6h30 → coucher sur /home et /planning | ❌ Non exécuté (agent) |
| F5 conserve timeline | ❌ Non exécuté |
| Régénération conserve cohérence | ❌ Non exécuté |

---

## Qualité

| Commande | Résultat |
|----------|----------|
| `npm run build` | ✅ |
| `npm run lint` | ✅ |
| `npm test` | ✅ 81/81 |
| `npm run verify:schema` | ✅ |
| `npm run verify:supabase` | ✅ |

---

## Limites restantes

1. **Travail + trajets fusionnés** par `mergeOverlappingConstraints` : un seul bloc visuel « Trajet » peut englober travail + trajets (titre combiné).
2. **Tâches preview vs persistées** : sans génération, les tâches proposées restent un preview moteur ; après génération, seules les tâches en base sont affichées.
3. **Tests E2E** journée complète à valider manuellement sur http://localhost:5174/
4. **Section mémoire** repliée par défaut — l’utilisateur doit cliquer pour l’ouvrir.

---

## Critère de fin

✅ Timeline unifiée branchée sur Home et Planning  
✅ Contraintes calculées + blocs persistés fusionnés  
✅ Accueil recentré sur « Aujourd’hui »  
⚠️ Validation manuelle navigateur recommandée
