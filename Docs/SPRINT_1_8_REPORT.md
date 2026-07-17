# Sprint 1.8 — Rapport « Planning robuste face aux rendez-vous manuels »

> **Date :** 13 juillet 2026  
> **Statut :** ✅ Code corrigé — ⚠️ tests navigateur Supabase non exécutés automatiquement  
> **Objectif :** permettre génération / régénération du planning après ajout, modification ou suppression d’un rendez-vous manuel dans `/calendar`, avec erreurs exploitables

---

## Cause exacte

| Symptôme | Cause | Étape |
|----------|-------|-------|
| « Impossible de générer le planning » sans détail | `saveDayPlan` insérait `source: "engine"` ou `"manual"` → **violation CHECK** Supabase (`user \| ai \| calendar_sync \| system`) | **save** |
| Régénération impossible après 1ère génération | `deleteAutoProposalsForDate` ne supprimait que `source === "engine"`, pas `source === "ai"` → doublons / conflits | **save** |
| Rendez-vous manuel « disparaît » après génération | `useDayPlan` faisait `setItems(savedItems)` avec **uniquement** les inserts moteur, pas le rechargement complet | **save / UI** |
| Tentative de réinsertion du RDV manuel | `generateDayPlan` inclut les contraintes manuelles dans `plan.blocks` ; `saveDayPlan` persistait **tous** les blocs dont `constraint` | **save** |
| Créneaux incohérents possibles | Contraintes brutes sans validation ni fusion des chevauchements (travail + RDV, deux RDV, etc.) | **normalize / generate** |

**Champ / entité responsable principal :** `calendar_items.source` à l’INSERT (`"engine"` au lieu de `"ai"`) + persistance de blocs `constraint` déjà présents en base.

---

## Corrections appliquées

### 1. Mapping source Supabase

**Fichiers :** `src/services/planningService.ts`, `src/config/calendarSources.ts`

- INSERT moteur → `source: "ai"` (`ENGINE_CALENDAR_SOURCE`)
- INSERT manuel (si jamais requis) → `source: "user"`
- `isAutoCalendarSource()` : `ai` + legacy `engine`

### 2. Régénération sans doublon

**Fichier :** `src/lib/planning/persistenceHelpers.ts`

- `shouldDeleteAutoCalendarItem` : supprime `ai` / `engine`, conserve `locked`, `user`, `completed`
- `getPersistableEngineBlocks` : ne persiste que `task`, `buffer`, `margin` avec `source === "engine"`
- Les rendez-vous manuels (`user`, `locked=true`) ne sont **jamais** réinsérés

### 3. Rechargement complet après save

**Fichiers :** `src/services/planningService.ts`, `src/hooks/useDayPlan.ts`

- Après INSERT : `loadCalendarItemsForDate` → manual + auto
- `mergePersistedPlan` : fusionne stats moteur (tâches non planifiables, remplissage…) avec blocs persistés

### 4. Normalisation des contraintes

**Fichier :** `src/lib/planning/normalizeCalendarConstraint.ts`

- `validateCalendarItemForPlanning` : id, titre, dates ISO, `ends_at > starts_at`, règles manuel (`user`, `locked`, `constraint`)
- `normalizeCalendarItemToConstraint(item, targetDate)` : troncature jour / réveil / coucher, rejet hors date
- Item invalide → ignoré avec diagnostic (`ignoredCalendarItems`), **sans** bloquer la génération

### 5. Fusion des chevauchements

**Fichier :** `src/lib/planning/mergeOverlappingConstraints.ts`

- Tri par début, fusion intervalles qui se chevauchent ou se touchent
- Titres fusionnés pour l’explication
- Intégré dans `buildDayConstraints` (`planningEngine.ts`)

### 6. Erreurs exploitables

**Fichier :** `src/types/planningGenerationError.ts`

- `PlanningGenerationError` : `code`, `userMessage`, `technicalDetails`, `entityId?`, `step` (`load | normalize | generate | save`)
- Messages Supabase formatés : `[calendar_items] DELETE — … code=42501`
- `getPlanningErrorMessage()` utilisé dans `useDayPlan`

### 7. UI « Éléments à corriger »

**Fichier :** `src/pages/PlanningPage.tsx`

- Section affichant titre + raison pour chaque `ignoredCalendarItem`

### 8. Logs DEV utiles

**Fichier :** `src/services/planningService.ts`

- Log structuré `[planning] generate` : date, locked items, ignorés, blocs à persister (DEV uniquement)

---

## Tests automatisés exécutés

| ID | Scénario | Fichier | Résultat |
|----|----------|---------|----------|
| A | RDV manuel valide | `normalizeCalendarConstraint.test.ts` | ✅ |
| B | Fin avant début | `normalizeCalendarConstraint.test.ts` | ✅ |
| C | Traverse minuit | `normalizeCalendarConstraint.test.ts` | ✅ |
| D | Hors date ciblée | `normalizeCalendarConstraint.test.ts` | ✅ |
| E | Chevauche travail | `mergeOverlappingConstraints.test.ts` | ✅ |
| F | Deux RDV chevauchants | `mergeOverlappingConstraints.test.ts` | ✅ |
| G | Avant réveil | `normalizeCalendarConstraint.test.ts` | ✅ |
| H | Après coucher | `normalizeCalendarConstraint.test.ts` | ✅ |
| I | Régénération sans réinsertion manuel | `persistenceHelpers.test.ts` | ✅ |
| J | Conservation locked user | `persistenceHelpers.test.ts` | ✅ |
| K | Conservation completed | `persistenceHelpers.test.ts` | ✅ |
| L | Invalide ignoré sans crash | `normalizeCalendarConstraint.test.ts`, `manualPlanning.test.ts` | ✅ |

**Suite complète :** 54 tests Vitest ✅

---

## Tests navigateur réels (Supabase connectée)

| Étape | Statut |
|-------|--------|
| RDV 14:00–15:00 → générer → F5 | ❌ Non exécuté (agent) |
| Modifier 14:30–16:00 → régénérer | ❌ Non exécuté |
| Vérifier absence doublon | ❌ Non exécuté |
| Supprimer → régénérer → créneau libéré | ❌ Non exécuté |

À valider manuellement sur `/calendar` + `/planning`.

---

## Erreurs désormais visibles (exemples)

- `Le rendez-vous « Médecin » se termine avant ou à son heure de début.`
- `Une contrainte du calendrier contient une date de début invalide.`
- `Le planning n’a aucun intervalle disponible entre le réveil et le coucher.`
- `[calendar_items] INSERT — … violates check constraint … code=23514`
- `[calendar_items] DELETE — … code=42501`

---

## Qualité

| Commande | Résultat |
|----------|----------|
| `npm run build` | ✅ |
| `npm run lint` | ✅ |
| `npm test` | ✅ 54/54 |
| `npm run verify:schema` | ✅ 9 tables |
| `npm run verify:supabase` | ✅ |

---

## Limites restantes

1. **Tests E2E navigateur** non automatisés dans ce sprint.
2. **`loadCalendarItemsForDate`** filtre sur `starts_at` dans la journée — un RDV commençant la veille et finissant le matin peut ne pas être chargé (cas limite minuit).
3. **Fusion travail + RDV** : un seul bloc fusionné est affiché dans les contraintes (comportement voulu pour le calcul des créneaux, titre combiné).
4. **`totalFreeMinutes <= 0`** lève une erreur explicite — journée entièrement bloquée sans marge planifiable.

---

## Fichiers modifiés / ajoutés

| Fichier | Rôle |
|---------|------|
| `src/types/planningGenerationError.ts` | Type d’erreur structuré |
| `src/lib/planning/normalizeCalendarConstraint.ts` | Validation + normalisation |
| `src/lib/planning/mergeOverlappingConstraints.ts` | Fusion intervalles |
| `src/lib/planning/persistenceHelpers.ts` | Filtres save / delete |
| `src/services/planningService.ts` | Pipeline generate/save corrigé |
| `src/ai/planningEngine.ts` | Intégration normalize + merge |
| `src/hooks/useDayPlan.ts` | Messages + reload complet |
| `src/pages/PlanningPage.tsx` | Section « Éléments à corriger » |
| `src/types/planning.ts` | `ignoredCalendarItems` |
| `src/config/calendarSources.ts` | `isAutoCalendarSource` |
| `*.test.ts` (5 fichiers) | Tests A–L |

---

## Critère de fin de sprint

✅ Un rendez-vous manuel valide (`source=user`, `locked=true`, `item_type=constraint`) peut être pris en compte par le moteur sans bloquer la génération.  
✅ La persistance n’envoie plus de `source` invalide et ne duplique pas les contraintes manuelles.  
⚠️ Validation manuelle navigateur recommandée avant mise en production.
