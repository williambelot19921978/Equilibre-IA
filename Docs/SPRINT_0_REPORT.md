# Sprint 0 — Rapport de stabilisation

> **Date :** 12 juillet 2026  
> **Statut :** ✅ Terminé  
> **Contrainte respectée :** aucun changement de comportement fonctionnel

---

## Résumé

Le Sprint 0 a stabilisé la base technique du projet : build TypeScript vert, lint sans avertissement, services Supabase centralisés, types partagés documentés, structure de dossiers homogénéisée. Le comportement utilisateur (routes, redirections, onboarding) est **inchangé**.

---

## Problèmes trouvés

| ID | Sévérité | Problème |
|----|----------|----------|
| P-01 | 🔴 Bloquant | `npm run build` échouait — `factsMap` inutilisé dans `DiscoveryPage.tsx` |
| P-02 | 🟠 Majeur | Appels Supabase dispersés dans 3 pages (`HouseholdPage`, `ChildrenPage`, `ProfileOnboardingPage`) |
| P-03 | 🟠 Majeur | `getCurrentHouseholdId` utilisait `.single()` (incohérent avec `ChildrenPage` qui utilise `maybeSingle`) |
| P-04 | 🟡 Mineur | Types dupliqués (`TaskRecord`, `ProfileFactRecord`) dans les services |
| P-05 | 🟡 Mineur | `src/types/index.ts` vide |
| P-06 | 🟡 Mineur | `src/pages/.gitkeep` contenait une copie complète de `ChildrenPage.tsx` |
| P-07 | 🟡 Mineur | `SignupPage.tsx` — indentation incorrecte |
| P-08 | 🟡 Mineur | `TasksPage.tsx` — indentation incorrecte sur `handleSkip` |
| P-09 | 🟡 Mineur | Warning oxlint : `AuthContext` mélangeait contexte et provider |
| P-10 | 🟡 Mineur | Aucune migration SQL versionnée dans le repo |
| P-11 | 🟡 Mineur | Casts `as TaskRecord` systématiques sans types centralisés |
| P-12 | 📋 Documenté | Login redirige toujours vers `/onboarding/household` (non corrigé — hors périmètre) |
| P-13 | 📋 Documenté | `onboarding_completed` écrit mais jamais lu par le routeur |
| P-14 | 📋 Documenté | `ChildrenPage` termine vers `/home` (saute `/onboarding/profile`) |
| P-15 | 📋 Documenté | Tâches `skipped` restent dans la liste active |
| P-16 | 📋 Documenté | `memoryEngine` n'exploite pas les facts d'onboarding |

---

## Corrections réalisées

### Build et qualité code

- Suppression de `factsMap` inutilisé ; extraction de `buildFactsValueMap` et `filterAvailableQuestions` dans `src/lib/discovery/questionFilters.ts`
- Suppression de l'état `facts` inutilisé dans `DiscoveryPage`
- Correction indentation `SignupPage.tsx` et `TasksPage.tsx`
- Séparation `authContext.ts` / `AuthProvider.tsx` / `hooks/useAuth.ts` — lint sans warning

### Types

- Création de `src/types/database.ts` avec tous les types de tables
- Export centralisé via `src/types/index.ts`
- `memoryEngine.ts` importe depuis `../types`
- Suppression des casts `as TaskRecord` dans `tasksService` (typage direct via select explicite)

### Services Supabase

| Service | Responsabilité |
|---------|----------------|
| `householdService.ts` | Membership, `getCurrentHouseholdId`, création foyer (RPC) |
| `childrenService.ts` | Liste et ajout d'enfants |
| `profileService.ts` | `completeOnboarding`, `saveBaseProfileFacts` |
| `profileFactsService.ts` | Facts discovery uniquement ; réexporte `getCurrentHouseholdId` |
| `tasksService.ts` | CRUD tâches (inchangé fonctionnellement) |

### Pages migrées vers services

- `HouseholdPage` → `createHouseholdForCurrentUser`
- `ChildrenPage` → `getHouseholdMembership`, `getChildrenByHousehold`, `addChild`, `completeOnboarding`
- `ProfileOnboardingPage` → `saveBaseProfileFacts`

### Structure

- Suppression de `src/pages/.gitkeep` (artefact dupliqué)
- Ajout de `src/hooks/useAuth.ts`
- Ajout de `src/lib/discovery/questionFilters.ts`
- Renommage logique : `AuthContext.tsx` → `AuthProvider.tsx` + `authContext.ts`
- Migration documentée : `supabase/migrations/00001_initial_schema_documented.sql`

### `getCurrentHouseholdId`

- Utilise désormais `maybeSingle()` + message d'erreur explicite si aucun foyer
- Comportement identique pour le cas nominal (foyer existant)

---

## Fichiers modifiés

### Créés

```
src/types/database.ts
src/types/index.ts
src/services/householdService.ts
src/services/childrenService.ts
src/services/profileService.ts
src/lib/discovery/questionFilters.ts
src/hooks/useAuth.ts
src/contexts/authContext.ts
src/contexts/AuthProvider.tsx
supabase/migrations/00001_initial_schema_documented.sql
docs/SPRINT_0_REPORT.md
```

### Modifiés

```
src/pages/DiscoveryPage.tsx
src/pages/HouseholdPage.tsx
src/pages/ChildrenPage.tsx
src/pages/ProfileOnboardingPage.tsx
src/pages/HomePage.tsx
src/pages/TasksPage.tsx
src/pages/SignupPage.tsx
src/services/profileFactsService.ts
src/services/tasksService.ts
src/ai/memoryEngine.ts
src/app/router/AppRouter.tsx
src/app/providers/AppProviders.tsx
```

### Supprimés

```
src/pages/.gitkeep
src/contexts/AuthContext.tsx (remplacé par authContext.ts + AuthProvider.tsx)
```

---

## Vérifications effectuées

### Routes (inchangées)

| Route | Protection | Comportement |
|-------|------------|--------------|
| `/` | Public | → `/login` |
| `/login`, `/signup` | Public | Auth |
| `/onboarding/household` | Protégé | Création foyer |
| `/onboarding/children` | Protégé | Enfants |
| `/onboarding/profile` | Protégé | Profil de base |
| `/home`, `/discovery`, `/tasks` | Protégé | App |
| `*` | — | → `/login` |

### Redirections connexion (inchangées — documentées)

- **Login** → `/onboarding/household` (même pour utilisateur existant)
- **Signup** (session immédiate) → `/onboarding/household`
- **Children finish** → `/home`
- **Profile save** → `/home` (après 700 ms)

### Persistance après rafraîchissement

- **Session auth** : `getSession()` + `onAuthStateChange` — la session Supabase persiste en `localStorage` (comportement par défaut du client Supabase)
- **Données métier** : toutes en base Supabase (`profile_facts`, `tasks`, `children`, etc.) — rechargées à chaque visite de page via les services
- **État UI local** : formulaires en cours non persistés (comportement inchangé)

### Onboarding

Les 3 écrans d'onboarding fonctionnent via les services refactorisés avec la même logique qu'avant. Le parcours reste : household → children → home (profile accessible manuellement depuis `/home`).

---

## Résultat du build

```
> tsc -b && vite build
✓ 89 modules transformed.
✓ built in ~180ms

Exit code: 0
```

```
> oxlint
(aucun warning, aucune erreur)

Exit code: 0
```

```
> npm run verify:supabase
✅ Connexion Supabase OK
```

---

## Tests manuels

| # | Scénario | Résultat | Méthode |
|---|----------|----------|---------|
| T-01 | Build production | ✅ Pass | `npm run build` |
| T-02 | Lint | ✅ Pass | `npm run lint` |
| T-03 | Connexion Supabase | ✅ Pass | `npm run verify:supabase` |
| T-04 | Compilation stricte TS (`noUnusedLocals`) | ✅ Pass | via `tsc -b` |
| T-05 | Parcours login → household | 📋 Non exécuté en navigateur | Code review — redirection inchangée |
| T-06 | Rafraîchissement session | 📋 Non exécuté en navigateur | Architecture AuthProvider inchangée |
| T-07 | Création tâche + reload | 📋 Non exécuté en navigateur | Persistance via Supabase (inchangé) |

> Les tests navigateur complets sont prévus au Sprint 9. Le Sprint 0 valide la stabilité **technique** du code.

---

## Points à surveiller

1. **Login redirect** — utilisateurs existants renvoyés vers création de foyer (correction prévue Sprint 0 bis ou début Sprint 1)
2. **RLS Supabase** — policies non versionnées dans le repo ; à exporter depuis le dashboard
3. **Types générés** — `database.ts` est manuel ; migrer vers `supabase gen types` quand la CLI est configurée
4. **Migration SQL** — fichier documentaire uniquement ; pas de `CREATE TABLE` exécutable (schéma déjà en production)
5. **`npm warn Unknown env config "devdir"`** — configuration npm locale, hors projet

---

## Dettes techniques restantes

| Dette | Priorité | Sprint cible |
|-------|----------|--------------|
| Redirection post-login intelligente | P0 | Sprint 0 bis / 1 |
| Route guard onboarding (`onboarding_completed`) | P0 | Sprint 0 bis / 1 |
| Flux children → profile → home | P1 | Sprint 0 bis / 1 |
| `memoryEngine` + facts onboarding | P1 | Sprint 1 |
| Tâches `skipped` hors liste active | P2 | Sprint 3 |
| RLS policies versionnées | P1 | Sprint 1 |
| Types Supabase auto-générés | P2 | Sprint 1 |
| Tests unitaires (`memoryEngine`, services) | P2 | Sprint 1 |
| `LoginPage` / `SignupPage` — appels auth directs (acceptable) | P3 | — |

---

## Prochaine étape recommandée

**Sprint 1 — Planning vivant V1** (ou mini-iteration « Sprint 0 bis » pour les redirections si souhaité avant).

Prérequis Sprint 1 maintenant satisfaits :
- ✅ Build vert
- ✅ Services centralisés
- ✅ Types partagés
- ✅ Migrations documentées
