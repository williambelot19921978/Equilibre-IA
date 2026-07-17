# Sprint 0.5 — Rapport de navigation automatique

> **Date :** 12 juillet 2026  
> **Statut :** ✅ Terminé  
> **Contrainte respectée :** logique métier uniquement — aucun nouveau design, aucune nouvelle fonctionnalité

---

## Résumé

Le Sprint 0.5 supprime toutes les redirections codées en dur et centralise la décision de navigation dans un moteur unique. L'application détecte automatiquement l'état d'avancement de l'utilisateur (foyer, enfants, profil, découverte, `onboarding_completed`) et l'envoie vers la bonne route. Le Memory Engine dispose désormais d'une vision complète du foyer.

**Build :** `npm run build` ✅  
**Lint :** `npm run lint` ✅ (0 avertissement)  
**TypeScript :** 0 erreur

---

## Architecture choisie

### Principe : une seule fonction décide

```
loadUserProgress(userId)
        ↓
UserProgressState
        ↓
resolveNavigationRoute(progress)   ← point unique de décision
        ↓
AppRoute (/login, /onboarding/..., /discovery, /home)
```

La navigation impérative (`navigate`) n'existe plus que dans `useAppNavigation.ts`, qui appelle toujours `resolveNavigationRoute` après un rafraîchissement de l'état.

### Couches

| Couche | Fichier(s) | Rôle |
|--------|------------|------|
| **Routes** | `src/lib/navigation/routes.ts` | Constantes `AppRoutes`, liste `POST_ONBOARDING_ROUTES` |
| **État** | `src/lib/navigation/types.ts` | `UserProgressState`, `EMPTY_USER_PROGRESS` |
| **Vérifications** | `src/lib/navigation/progressChecks.ts` | `isBaseProfileComplete()`, `isDiscoveryComplete()` |
| **Moteur** | `src/lib/navigation/navigationEngine.ts` | `resolveNavigationRoute()`, `isRouteAllowed()` |
| **Chargement** | `src/services/userProgressService.ts` | Agrège foyer, enfants, facts, profil |
| **Cache React** | `src/contexts/UserProgressProvider.tsx` | État global, `resolvedRoute`, `refreshProgress()` |
| **Hook navigation** | `src/hooks/useAppNavigation.ts` | `goToResolvedRoute()`, `goToLogin()`, `goToRoute()`, `completeDiscoveryAndContinue()` |
| **Garde routeur** | `src/app/router/AppRouter.tsx` | `RootRedirect`, `PublicAuthRoute`, `ProtectedRoute` |
| **Mémoire enrichie** | `src/services/memoryContextService.ts` + `src/ai/memoryEngine.ts` | Contexte foyer complet pour l'IA |

### Schéma de flux

```mermaid
flowchart TD
    A[Ouverture app /] --> B{Connecté ?}
    B -->|Non| C[/login]
    B -->|Oui| D[loadUserProgress]
    D --> E{onboarding_completed ?}
    E -->|Oui + foyer| F[/home]
    E -->|Oui sans foyer| G[/onboarding/household]
    E -->|Non| H{Foyer ?}
    H -->|Non| G
    H -->|Oui| I{Enfant ?}
    I -->|Non| J[/onboarding/children]
    I -->|Oui| K{Profil base ?}
    K -->|Non| L[/onboarding/profile]
    K -->|Oui| M{Découverte ?}
    M -->|Non| N[/discovery]
    M -->|Oui| F
```

---

## Logique de navigation

### États détectés (`UserProgressState`)

| Champ | Source | Signification |
|-------|--------|---------------|
| `hasHousehold` | `household_members` | Foyer créé |
| `hasChildren` | `children` (count > 0) | Au moins un enfant |
| `hasBaseProfile` | `profile_facts` — clé `main_priority` | Profil de base complété |
| `discoveryComplete` | `profile_facts` + `discoveryQuestions` | Toutes les questions discovery répondues |
| `onboardingCompleted` | `profiles.onboarding_completed` | Source de vérité finale |

### Règle `resolveNavigationRoute`

Ordre strict (connecté) :

1. `onboarding_completed = true` → `/home` (sauf si foyer supprimé → `/onboarding/household`)
2. Pas de foyer → `/onboarding/household`
3. Foyer sans enfant → `/onboarding/children`
4. Enfant(s) sans profil base → `/onboarding/profile`
5. Profil base sans découverte → `/discovery`
6. Tout terminé → `/home`

Non connecté : géré par le routeur (`RootRedirect`, `ProtectedRoute`) → `/login`.

### Garde de routes (`isRouteAllowed`)

- **Pendant l'onboarding** : seule la route résolue est accessible (pas de saut d'étape).
- **Après onboarding** (`onboarding_completed = true`) : accès libre à `/home`, `/discovery`, `/tasks`, `/onboarding/profile`.

### `onboarding_completed` — changement de comportement

| Avant (Sprint 0) | Après (Sprint 0.5) |
|----------------|-------------------|
| Écrit dans `ChildrenPage` à la fin des enfants | Écrit uniquement quand la découverte est complète (`completeDiscoveryAndContinue`) |
| Jamais lu par le routeur | Source de vérité : si `true`, l'utilisateur ne revient pas aux écrans d'onboarding |

---

## Memory Engine enrichi

### Avant

`memoryEngine` ne lisait que les `profile_facts` pour construire un `MemoryProfile`.

### Après

Nouveau type `HouseholdMemoryContext` :

```typescript
{
  householdId: string | null;
  children: ChildRecord[];
  facts: ProfileFactRecord[];
  baseProfile: BaseProfileMemory;   // partner, horaires, priorité
  userProfile: { onboarding_completed } | null;
  profile: MemoryProfile;           // profil discovery existant
}
```

Service dédié : `loadHouseholdMemoryContext(userId)` — utilisé par `HomePage`.

Fonctions ajoutées dans `memoryEngine.ts` :
- `buildBaseProfileMemory()`
- `buildHouseholdMemoryContext()`

---

## Fichiers modifiés

### Créés

| Fichier | Description |
|---------|-------------|
| `src/lib/navigation/routes.ts` | Constantes de routes |
| `src/lib/navigation/types.ts` | Type `UserProgressState` |
| `src/lib/navigation/progressChecks.ts` | Critères profil / découverte |
| `src/lib/navigation/navigationEngine.ts` | Moteur de navigation |
| `src/services/userProgressService.ts` | Chargement de l'état utilisateur |
| `src/services/memoryContextService.ts` | Chargement contexte mémoire foyer |
| `src/contexts/userProgressContext.ts` | Contexte React (séparé du provider) |
| `src/contexts/UserProgressProvider.tsx` | Provider progression |
| `src/hooks/useUserProgress.ts` | Hook d'accès au contexte |
| `src/hooks/useAppNavigation.ts` | Hook de navigation centralisé |

### Modifiés

| Fichier | Changement |
|---------|------------|
| `src/app/router/AppRouter.tsx` | Gardes `RootRedirect`, `PublicAuthRoute`, `ProtectedRoute` |
| `src/app/providers/AppProviders.tsx` | Ajout `UserProgressProvider` |
| `src/pages/LoginPage.tsx` | `goToResolvedRoute()` après connexion |
| `src/pages/SignupPage.tsx` | `goToResolvedRoute()` après inscription |
| `src/pages/HouseholdPage.tsx` | `goToResolvedRoute()` après création foyer |
| `src/pages/ChildrenPage.tsx` | `goToResolvedRoute()` — suppression `completeOnboarding` |
| `src/pages/ProfileOnboardingPage.tsx` | `goToResolvedRoute()` après profil |
| `src/pages/DiscoveryPage.tsx` | `completeDiscoveryAndContinue()` / `goToResolvedRoute()` |
| `src/pages/HomePage.tsx` | `loadHouseholdMemoryContext()`, `goToRoute()` pour liens internes |
| `src/pages/TasksPage.tsx` | `goToResolvedRoute()` pour retour |
| `src/services/profileService.ts` | Ajout `getUserProfile()` |
| `src/ai/memoryEngine.ts` | `HouseholdMemoryContext`, `buildBaseProfileMemory`, `buildHouseholdMemoryContext` |
| `src/types/index.ts` | Export `UserProgressState` |

### Supprimés

| Fichier | Raison |
|---------|--------|
| `src/contexts/UserProgressContext.tsx` | Séparé en context + provider + hook (lint) |

### Redirections en dur supprimées

Avant le sprint, les pages appelaient directement `navigate("/home")`, `navigate("/onboarding/...")`, etc.

Après le sprint, **seul** `useAppNavigation.ts` appelle `navigate()`, toujours via `resolveNavigationRoute()`.

Exception volontaire : `goToRoute(AppRoutes.*)` sur `HomePage` pour la navigation intra-app post-onboarding (discovery, tasks, profile) — protégée par `isRouteAllowed`.

---

## Scénarios testés

Tests validés par analyse du code + build/lint. Tests manuels UI recommandés en local avec Supabase.

| Scénario | Route attendue | Mécanisme | Statut |
|----------|----------------|-----------|--------|
| Nouvel utilisateur (inscription) | `/onboarding/household` | `goToResolvedRoute()` → pas de foyer | ✅ Logique validée |
| Utilisateur avec foyer uniquement | `/onboarding/children` | `hasHousehold=true`, `hasChildren=false` | ✅ Logique validée |
| Foyer + enfant(s), profil incomplet | `/onboarding/profile` | `main_priority` absent | ✅ Logique validée |
| Profil terminé, découverte incomplète | `/discovery` | `isDiscoveryComplete()=false` | ✅ Logique validée |
| Configuration complète | `/home` | Tous critères OK ou `onboarding_completed=true` | ✅ Logique validée |
| Déconnexion | `/login` | `goToLogin()` + `ProtectedRoute` | ✅ Logique validée |
| Reconnexion (utilisateur avancé) | Route résolue selon état DB | `refreshProgress()` au changement `user` | ✅ Logique validée |
| Rafraîchissement navigateur | Route résolue | `UserProgressProvider` recharge au mount | ✅ Logique validée |
| Accès URL interdite pendant onboarding | Redirection vers route résolue | `ProtectedRoute` + `isRouteAllowed` | ✅ Logique validée |
| Utilisateur `onboarding_completed=true` existant | `/home` direct | Raccourci moteur | ✅ Logique validée |

### Checklist manuelle recommandée

```
□ Nouvel utilisateur → household → children → profile → discovery → home
□ Utilisateur avec foyer uniquement → bloqué sur children
□ Utilisateur avec foyer + enfants → bloqué sur profile si incomplet
□ Utilisateur profil OK → discovery
□ Utilisateur complet → home, liens discovery/tasks/profile fonctionnels
□ Déconnexion → login
□ Reconnexion → reprise au bon écran
□ F5 sur chaque étape → pas de régression
□ Changement de compte → état réinitialisé
```

---

## Résultats

| Critère | Résultat |
|---------|----------|
| Redirections en dur supprimées | ✅ |
| Moteur centralisé (`resolveNavigationRoute`) | ✅ |
| `onboarding_completed` comme source de vérité | ✅ |
| Memory Engine enrichi (foyer + enfants + profil) | ✅ |
| Build TypeScript vert | ✅ |
| Lint sans avertissement | ✅ |
| Aucun nouveau design | ✅ |
| Aucune nouvelle fonctionnalité | ✅ |

---

## Points restant à améliorer

| ID | Priorité | Point |
|----|----------|-------|
| M-01 | 🟠 | **Migration utilisateurs existants** : ceux marqués `onboarding_completed=true` par l'ancien flux (`ChildrenPage`) iront directement à `/home` sans passer par profile/discovery. Script de correction ou reset manuel si nécessaire. |
| M-02 | 🟡 | `goToRoute()` sur `HomePage` reste une navigation directe (non résolue) — acceptable post-onboarding, mais pourrait être unifié dans un sprint ultérieur. |
| M-03 | 🟡 | `calculateKnowledgeProgress` compte tous les facts (onboarding inclus) — dette Sprint 0, hors périmètre. |
| M-04 | 🟡 | Pas de tests automatisés E2E pour les scénarios de navigation. |
| M-05 | 🟡 | Suppression de données (foyer/enfant) : le moteur gère le cas, mais pas de message UX explicite à l'utilisateur. |
| M-06 | 📋 | Route `*` redirige vers `/login` même pour utilisateur connecté — comportement conservateur, à affiner si besoin. |

---

## Prochain sprint suggéré

**Sprint 1 — Planning vivant** (selon `docs/ROADMAP.md`) : première fonctionnalité produit au-delà de la navigation automatique.
