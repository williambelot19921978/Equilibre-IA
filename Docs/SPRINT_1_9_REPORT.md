# Sprint 1.9 — Rapport « item_type + F5 routing »

> **Date :** 13 juillet 2026  
> **Statut :** ✅ Code corrigé — ⚠️ migration 00007 à exécuter sur Supabase — ⚠️ tests navigateur non exécutés  
> **Objectif :** régénération sans violation `item_type_check` + F5 conserve la route protégée

---

## BUG 1 — `calendar_items_item_type_check`

### Diagnostic

| Élément | Constat |
|---------|---------|
| **Erreur** | `[calendar_items] INSERT — violates check constraint "calendar_items_item_type_check" — code=23514` |
| **Valeur fautive** | **`margin`** envoyée telle quelle via `item_type: block.blockType` dans `blockToCalendarInsert` |
| **Valeur fautive secondaire** | **`constraint`** pour les rendez-vous manuels (schéma distant typique) |
| **Étape** | `save` → `saveDayPlan` → INSERT des blocs moteur (`task`, `buffer`, **`margin`**) |

Le code Sprint 1.8 mappait correctement `source` (`ai` / `user`) mais passait encore le type interne React (`margin`, `constraint`) directement à PostgreSQL.

### Valeurs réellement autorisées

**Migration locale 00005** (si contrainte absente) : `constraint`, `task`, `buffer`, `margin`

**Schéma distant probable** (d’après erreurs précédentes + convention projet) : `task`, `event`, `routine`, `buffer`

**Migration corrective 00007** (cible unifiée) :

```
task, event, routine, buffer, constraint, margin
```

### Script diagnostic

```bash
npm run diagnose:calendar-checks
```

- Lit `get_calendar_items_check_definitions()` (RPC PostgreSQL) après migration 00007
- Affiche les `item_type` / `source` observés en base

**Résultat au 13/07/2026 :** RPC indisponible tant que 00007 n’est pas exécutée ; table `calendar_items` vide côté anon.

### Corrections

| Fichier | Changement |
|---------|------------|
| `src/config/calendarItemTypes.ts` | Source de vérité unique + mapping moteur → Supabase |
| `src/lib/calendar/validateCalendarInsert.ts` | Validation avant INSERT (source, item_type, dates, foyer, user) |
| `src/services/planningService.ts` | `margin` → `buffer`, `constraint` → `event` via mapping |
| `src/lib/calendar/manualConstraint.ts` | RDV manuel → `item_type: event` |
| `src/services/calendarService.ts` | SELECT manuels sur `event` + `constraint` (legacy) |
| `src/lib/planning/daySummary.ts` | Marge détectée via `buffer` + `details.blockType=margin` |
| `supabase/migrations/00007_calendar_items_type_check_fix.sql` | Extension idempotente du CHECK + fonction diagnostic |

### Mapping appliqué

| Type interne moteur | `item_type` Supabase |
|---------------------|----------------------|
| `task` | `task` |
| `routine` | `routine` |
| `buffer` | `buffer` |
| `margin` | `buffer` (+ `details.blockType=margin`) |
| `rest` | `buffer` |
| `sport` | `task` |
| `manual_constraint` / `constraint` | `event` |

### Message d’erreur exploitable (exemple)

> Le type de bloc « margin » n’est pas autorisé par calendar_items. Valeurs acceptées : task, event, routine, buffer, constraint, margin.

(Levée **avant** l’appel Supabase si un type non mappé est envoyé.)

---

## BUG 2 — F5 renvoie vers `/home`

### Cause exacte

**Race condition** dans `UserProgressProvider` au rafraîchissement :

1. Auth restaure la session (`user` défini, `authLoading=false`)
2. Le progress est encore `EMPTY_USER_PROGRESS` (`onboardingCompleted=false`) car le fetch async n’a pas démarré
3. `loading=false` (mis à `false` quand `user` était encore `null`)
4. `ProtectedRoute` évalue `isCurrentRouteAllowed("/planning")` → **false**
5. Redirection vers `resolvedRoute` → **`/home`**

La logique `isRouteAllowed` était correcte pour un utilisateur configuré ; le problème venait du **chargement prématuré** considéré comme terminé.

### Correction

**`UserProgressProvider.tsx`**

- `loadedUserId` : le progress n’est « prêt » que pour l’utilisateur courant
- `loading = authLoading || fetchingProgress || (user && loadedUserId !== user.id)`
- Plus de `loading=false` tant que le progress du user connecté n’est pas chargé

**`navigationEngine.ts`**

- Utilise `POST_ONBOARDING_ROUTES` pour les routes autorisées après onboarding
- Redirection automatique limitée aux cas onboarding / racine `/` (inchangé dans `AppRouter`)

---

## Tests automatisés exécutés

| ID | Scénario | Résultat |
|----|----------|----------|
| A–G | Mapping item_type | ✅ `calendarItemTypes.test.ts` |
| H | Régénération sans `margin` brut | ✅ `persistenceHelpers.test.ts` |
| A–H | Routage F5 / onboarding | ✅ `navigationEngine.test.ts` |

**Suite complète :** 70 tests Vitest ✅

---

## Tests navigateur réels (Supabase)

| Étape | Statut |
|-------|--------|
| F5 sur `/calendar` | ❌ Non exécuté (agent) |
| F5 sur `/planning` | ❌ Non exécuté |
| Régénération sans `item_type_check` | ❌ Non exécuté |
| F5 après régénération | ❌ Non exécuté |

**Action requise :** exécuter `00007_calendar_items_type_check_fix.sql` dans Supabase SQL Editor, puis valider manuellement.

---

## Qualité

| Commande | Résultat |
|----------|----------|
| `npm run build` | ✅ |
| `npm run lint` | ✅ |
| `npm test` | ✅ 70/70 |
| `npm run verify:schema` | ✅ |
| `npm run verify:supabase` | ✅ |

---

## Limites restantes

1. **Migration 00007** non appliquée automatiquement sur le projet distant — à exécuter manuellement.
2. **Diagnostic RPC** indisponible tant que 00007 n’est pas déployée.
3. **Tests E2E navigateur** non automatisés dans ce sprint.
4. **Legacy `constraint`** conservé en lecture pour compatibilité ; les nouveaux INSERT utilisent `event`.

---

## Fichiers modifiés / ajoutés

| Fichier | Rôle |
|---------|------|
| `src/config/calendarItemTypes.ts` | Source de vérité item_type |
| `src/lib/calendar/validateCalendarInsert.ts` | Validation pré-INSERT |
| `src/contexts/UserProgressProvider.tsx` | Fix race F5 |
| `src/lib/navigation/navigationEngine.ts` | Règles refresh |
| `supabase/migrations/00007_calendar_items_type_check_fix.sql` | CHECK étendu + RPC diagnostic |
| `scripts/diagnose-calendar-checks.mjs` | Lecture contraintes réelles |
| `*.test.ts` (3 fichiers) | Tests A–H |

---

## Critère de fin

✅ Code : mapping + validation empêchent l’envoi de `margin` / `constraint` bruts  
✅ Code : F5 ne redirige plus tant que le progress n’est pas chargé  
⚠️ Production : exécuter migration 00007 + test manuel régénération / F5
