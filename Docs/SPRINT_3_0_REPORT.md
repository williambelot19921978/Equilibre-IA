# Sprint 3.0 — Life Engine V1

> **Date :** 15 juillet 2026  
> **Statut :** ✅ Code livré — aucune nouvelle page  
> **Objectif :** comprendre le type de journée **avant** de construire le planning

---

## 1. Résumé

| Capacité | Livraison |
|----------|-----------|
| `LifeContext` — cerveau unique | ✅ `src/types/lifeContext.ts` |
| Life Engine | ✅ `src/ai/lifeEngine.ts` |
| Types de journée (7) | ✅ WORKDAY, RESTDAY, VACATION, TRAVEL, PARENT_ALONE, WEEKEND, SPECIAL |
| Travail = contrainte dure | ✅ trajets + Travail même sans Google |
| Repos à la place du travail | ✅ bloc `rest_day` |
| Vacances / déplacement visuels | ✅ bannières + couleurs timeline |
| Créneaux libres découpés | ✅ `splitFreeSlots.ts` (max 120 min) |
| Propositions avec raison | ✅ sport, étude, calme, famille, spiritualité, repos… |
| Moteur unique | ✅ planning, accueil, suggestions, espace spirituel |
| Panneau debug (dev) | ✅ `LifeDebugPanel.tsx` |
| Tests Sprint 3.0 | ✅ `lifeEngine.test.ts` (20 cas) |

**209 tests** — build/lint OK. `verify:schema` : `spiritual_favorites` absent (migration 00009 Sprint 2.8, inchangé).

---

## 2. Architecture

```
profile_facts + family_context_periods + calendar_items + jour semaine
                              │
                              ▼
                    resolveLifeContext()
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
         dayType        freeSlots[]      proposals[]
              │               │               │
              └───────────────┴───────────────┘
                              │
                              ▼
              planningEngine / suggestions / spiritual / accueil
```

**Règle absolue :** aucune suggestion ni placement sans `LifeContext` enrichi.

---

## 3. Fichiers créés

| Fichier | Rôle |
|---------|------|
| `src/types/lifeContext.ts` | Types `LifeDayType`, `LifeContext`, `ScoredFreeSlot`, `LifeProposal` |
| `src/ai/lifeEngine.ts` | `determineDayType`, `resolveLifeContext`, `generateLifeProposals`, `scoreFreeSlot` |
| `src/lib/planning/splitFreeSlots.ts` | Découpe des créneaux libres (> 120 min) |
| `src/lib/planning/lifeProposalAdapter.ts` | `LifeProposal` → `FreeTimeSuggestion` |
| `src/components/planning/LifeDebugPanel.tsx` | Debug dev uniquement |
| `src/ai/lifeEngine.test.ts` | 20 tests couvrant tous les cas demandés |

---

## 4. Intégrations

| Zone | Modification |
|------|--------------|
| `planningEngine.ts` | Travail/repos/vacances/déplacement via `lifeContext` |
| `buildDisplayDayView.ts` | Enrichissement LifeContext avant/après contraintes |
| `planningService.ts` | `lifeContext` retourné avec le plan affiché |
| `freeTimeSuggestionEngine.ts` | Délègue à LifeContext si présent |
| `spiritualSuggestionEngine.ts` | `buildSpiritualInputFromLifeContext()` |
| `HomePage` / `PlanningPage` / `SpiritualSpacePage` | `loadPlanningContextWithLife()` |
| `DayTimeline.tsx` + `calendarColors.ts` | Code couleur travail / repos / vacances / déplacement |
| `index.css` | Styles `.life-debug-panel`, `.day-timeline-*` |

---

## 5. Types de journée

| Type | Déclencheurs principaux |
|------|-------------------------|
| **VACATION** | `userVacation` ou `childrenVacation` |
| **TRAVEL** | période `work_travel` active |
| **PARENT_ALONE** | `soloParentWithChildren` ou `partner_absent` |
| **WORKDAY** | jour ouvré profil + pas de vacances |
| **WEEKEND** | samedi / dimanche sans travail |
| **SPECIAL** | événement familial ou horaires exceptionnels |
| **RESTDAY** | pas de travail, pas vacances |

---

## 6. Comportements clés

### Travail (WORKDAY)

- Blocs obligatoires : Trajet aller → Travail → Trajet retour
- Horaires profil ou estimation 09:00–17:00 avec message `incompleteData`

### Repos (RESTDAY / WEEKEND)

- Bloc **Repos** à la place du travail
- Propositions : sport, courses, révisions, calme, famille

### Vacances

- Plus de travail, école, trajets
- Bannière « Vacances » + propositions famille / sortie / repos

### Déplacement

- Énergie basse, sport limité
- Proposition « Récupération trajet » toujours conservée (priorité haute)

### Parent seul

- `maxFillRatio` réduit + raisonnement explicite dans `LifeContext.reasoning`

### Temps libre

- Fini les blocs « Temps libre 8h–19h »
- Titres : « Créneau libre — X min »
- Chaque créneau scoré (0–100) avec `scoreReason`

---

## 7. Panneau debug (dev)

Visible uniquement si `import.meta.env.DEV` :

- Type de journée + pourquoi
- Énergie, temps libre, temps bloqué
- Créneaux scorés, propositions, raisonnement

---

## 8. Quality gate

| Commande | Résultat |
|----------|----------|
| `npm run test` | ✅ 209 tests |
| `npm run build` | ✅ |
| `npm run lint` | ✅ |
| `npm run verify:supabase` | ✅ |
| `npm run verify:schema` | ⚠️ `spiritual_favorites` (migration 00009 non appliquée) |
| `npm run preview` | ✅ |

---

## 9. Critères de fin — validés

- [x] L'application raisonne d'abord (`LifeContext`), puis construit la journée
- [x] Travail visible les jours ouvrés (trajets inclus)
- [x] Repos à la place du travail les jours off
- [x] Créneaux libres découpés et scorés
- [x] Suggestions unifiées via LifeContext
- [x] Espace spirituel branché sur LifeContext
- [x] Panneau debug en développement
- [x] Aucune nouvelle page créée
