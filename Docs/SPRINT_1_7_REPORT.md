# Sprint 1.7 — Rapport « Réparation complète et retour à une version stable »

> **Date :** 13 juillet 2026  
> **Statut :** ✅ Code corrigé — ⚠️ migrations Supabase distantes à exécuter  
> **Objectif :** restaurer la stabilité (progression, tâches, calendrier, isolation des erreurs)

---

## Diagnostic (causes probables)

| Bug constaté | Cause exacte |
|--------------|--------------|
| **Accueil à 0 %** | `HomePage` utilisait `calculateKnowledgeProgress(facts.length / 20)` — comptait **toutes** les lignes `profile_facts` (onboarding, quotidien) sur un dénominateur fixe de 20, **différent** de la logique Discovery (`filterAvailableQuestions` + `dependsOn`). Si `loadHouseholdMemoryContext` échouait, `memoryContext === null` → affichage forcé à 0 %. |
| **Discovery « tout est complet » vs 0 %** | Discovery marque une question répondue dès que la **clé existe** dans `profile_facts`, même avec valeur vide. Home et Discovery utilisaient des métriques **incompatibles**. |
| **Calendrier / actions métier en échec** | `CalendarPage` appelait `loadHouseholdMemoryContext` (qui charge `family_context_periods` + `child_routines`) **avant** le calendrier. Diagnostic `npm run verify:schema` : **`family_context_periods` et `child_routines` absents** sur Supabase distant. Erreur en cascade → page calendrier bloquée. |
| **Messages vagues** | Les services `throw error` Postgrest brut ou fallback générique « Impossible de charger le calendrier » sans table/opération. |
| **Erreurs en cascade** | `Promise.all` dans `loadHouseholdMemoryContext` et `loadDayPlanSummary` : une table manquante faisait échouer tout le chargement accueil/planning. |

### Diagnostic schéma exécuté (13 juillet 2026)

```
✅ profiles, households, household_members, children, profile_facts, tasks, calendar_items
❌ family_context_periods — PGRST205 (table absente)
❌ child_routines — PGRST205 (table absente)
```

---

## Corrections appliquées

### 1. Source de vérité progression

**Fichier :** `src/lib/navigation/progressChecks.ts`

- `getDiscoveryProgressSummary()` — réponses / questions **applicables** (respect `dependsOn`)
- `calculateDiscoveryProgress()` — pourcentage unique
- `hasMeaningfulFactAnswer()` — ignore les facts vides
- **HomePage** et **DiscoveryPage** utilisent la même fonction
- **Tests :** `src/lib/navigation/progressChecks.test.ts` (6 scénarios)

### 2. Chargements isolés

- `loadHouseholdMemoryContext` : `Promise.allSettled` pour `children`, `child_routines`, `family_context_periods` — échec partiel → tableaux vides + warning console
- `HomePage` : facts chargés via `loadProfileFactsSafe` **indépendamment** du contexte mémoire
- `loadDayPlanSummary` : `Promise.allSettled` calendrier / tâches
- Erreurs locales par section (mémoire, contexte familial, planning)

### 3. Calendrier découplé

- `CalendarPage` utilise `getCurrentHouseholdId()` directement — **ne dépend plus** de `loadHouseholdMemoryContext`
- Erreurs séparées : foyer vs contraintes vs formulaire

### 4. Messages d'erreur explicites

**Fichier :** `src/lib/supabase/formatError.ts`

Format : `[table] OPERATION — message (code)`

Appliqué à : `calendarService`, `tasksService`, `planningService`, `profileFactsService`, `familyContextService`, `childRoutineService`

### 5. Migration corrective idempotente

**Fichier :** `supabase/migrations/00005_calendar_items_rls_fix.sql`

- `CREATE TABLE IF NOT EXISTS calendar_items`
- Contraintes CHECK `item_type`, `source`
- Policies RLS idempotentes (SELECT/INSERT/UPDATE/DELETE par foyer)
- Policies RLS idempotentes pour `tasks`
- `GRANT` authenticated

### 6. Script diagnostic schéma

**Commande :** `npm run verify:schema`

- Probe non destructif de 9 tables
- Support optionnel `VERIFY_TEST_EMAIL` / `VERIFY_TEST_PASSWORD` pour tests RLS authentifiés
- Exit code 1 si tables manquantes

---

## Migrations à exécuter dans Supabase (SQL Editor)

**Ordre obligatoire :**

1. `supabase/migrations/00003_family_context_periods.sql`
2. `supabase/migrations/00004_child_routines.sql`
3. `supabase/migrations/00005_calendar_items_rls_fix.sql`

> Sans 00003 et 00004, le contexte familial et les routines enfants restent indisponibles (l'app continue grâce au chargement résilient, mais ces fonctionnalités seront vides).

---

## Policies RLS vérifiées (dans les migrations)

| Table | Policies |
|-------|----------|
| `calendar_items` | select/insert/update/delete par `household_members` |
| `tasks` | select/insert/update/delete par `household_members` |
| `family_context_periods` | (00003) |
| `child_routines` | (00004) |

---

## Qualité

| Commande | Résultat |
|----------|----------|
| `npm run build` | ✅ |
| `npm run lint` | ✅ |
| `npm test` | ✅ 30 tests |
| `npm run verify:supabase` | ✅ connexion OK |
| `npm run verify:schema` | ⚠️ 2 tables manquantes (00003/00004 non appliquées) |

---

## Tests navigateur (honnêteté)

Les tests A–J **n'ont pas été exécutés en navigateur** dans cette session (pas de session utilisateur authentifiée disponible pour l'agent).

| ID | Scénario | Statut |
|----|----------|--------|
| A | Connexion utilisateur existant | ⏸ Non exécuté (nécessite login manuel) |
| B | Accueil et progression mémoire | ⏸ Non exécuté |
| C | Ouverture Discovery | ⏸ Non exécuté |
| D | Création tâche | ⏸ Non exécuté |
| E | Report tâche | ⏸ Non exécuté |
| F | Ouverture calendrier | ⏸ Non exécuté |
| G | Création contrainte | ⏸ Non exécuté |
| H | Mon quotidien | ⏸ Non exécuté |
| I | Génération planning | ⏸ Non exécuté |
| J | Rafraîchissement pages | ⏸ Non exécuté |

**Pour valider manuellement :**

1. Exécuter les 3 migrations SQL ci-dessus dans Supabase
2. `npm run dev`
3. Se connecter → vérifier accueil (progression cohérente avec Discovery)
4. Créer une tâche, ouvrir calendrier, ajouter une contrainte
5. Optionnel : ajouter `VERIFY_TEST_EMAIL` / `VERIFY_TEST_PASSWORD` dans `.env.local` puis `npm run verify:schema`

---

## Bugs restants ouverts

| Bug | Statut |
|-----|--------|
| Tables Sprint 1.6 absentes sur Supabase distant | **Action utilisateur** — exécuter migrations 00003/00004 |
| Tests navigateur A–J | **À valider manuellement** après migrations |

---

## Fichiers modifiés (principaux)

- `src/lib/navigation/progressChecks.ts` + test
- `src/lib/discovery/questionFilters.ts`
- `src/lib/supabase/formatError.ts`
- `src/services/memoryContextService.ts`
- `src/pages/HomePage.tsx`, `DiscoveryPage.tsx`, `CalendarPage.tsx`
- `src/services/calendarService.ts`, `tasksService.ts`, `planningService.ts`
- `supabase/migrations/00005_calendar_items_rls_fix.sql`
- `scripts/verify-schema.mjs`

---

## Critère de fin Sprint

| Critère | Statut |
|---------|--------|
| Progression profil cohérente (code) | ✅ |
| Tâches indépendantes du calendrier (code) | ✅ |
| Calendrier découplé du contexte mémoire (code) | ✅ |
| Erreurs isolées par module (code) | ✅ |
| Migrations documentées | ✅ |
| **Validation bout en bout en production** | ⚠️ Après exécution SQL 00003–00005 |
