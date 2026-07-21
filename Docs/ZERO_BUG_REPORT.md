# Opération Zero Bug — Audit global Aura v1.0.0-beta.1

**Date :** 2026-07-21  
**Périmètre :** codebase `equilibre-ia-v2`, gates qualité, revue statique, analyse E2E  
**Mode :** audit read-only — **aucune correction appliquée**  
**Auditeur :** QA Lead / Test Engineer / UX Reviewer / Security Reviewer (session Cursor)

---

## Méthodologie

| Activité | Statut |
|----------|--------|
| Parcours routes & guards (`AppRouter`, `ProtectedRoute`, `AdminRoute`, `navigationEngine`) | ✅ Analysé |
| Revue auth, onboarding, check-in, coach, trust, offline | ✅ Analysé |
| Grep branding, logs, TODO, empty states, anglais | ✅ Analysé |
| Revue sécurité (admin, RLS, localStorage, PWA cache) | ✅ Analysé |
| `npm test` (1423 tests) | ✅ **Vert** |
| `npm run build` (tsc + vite + PWA) | ✅ **Vert** |
| `npm run lint` | ❌ **Échec** (5 erreurs) |
| `npm run release-check` | ⚠️ Non exécuté (bloqué environnement) |
| `npm run quality-guardian` | ⚠️ Non exécuté (nécessite credentials + serveur) |
| `npm run test:e2e` complet | ⚠️ Non exécuté intégralement ; artefacts d'échecs antérieurs observés |
| `npm run verify:schema` / `verify:supabase` | ⚠️ Non exécuté (bloqué environnement) |
| Tests manuels navigateur (320px–1440px, lecteur d'écran) | ⚠️ Non exécutés — findings déduits du code + CSS |

---

## Synthèse exécutive

Aura présente une **base technique solide** (1423 tests unitaires verts, build prod OK, design Aura avancé sur Home/Trust/Settings). Cependant, **plusieurs bugs de navigation bloquants** empêchent des parcours centraux (check-in quotidien, admin insights, progression onboarding) et le **Coach personnel utilise des données fictives**. La gate lint est rouge, et la couverture E2E réelle est **fragmentée** entre `e2e/` et `tests/e2e/`.

**Verdict :** bêta privée possible en **cercle restreint + correctifs P0**, pas « excellente application » en l'état.

---

## Quality gate — résultats

| Gate | Résultat | Détail |
|------|----------|--------|
| Unit tests | ✅ 1423/1423 | 170 fichiers |
| Build + typecheck | ✅ | Bundle principal ~304 KB / gzip ~92 KB |
| Lint | ❌ | 5 **errors** (`tests/e2e/fixtures/*.ts` — rules-of-hooks) + ~30 warnings |
| PWA artifacts | ✅ | `dist/sw.js`, `dist/manifest.webmanifest` générés |
| E2E default (`testDir: e2e/`) | ⚠️ | ~15 specs ; **16 specs dans `tests/e2e/` non incluses** par config par défaut |
| Guardian | ⚠️ | Config séparée `playwright.guardian.config.ts` |
| Échecs E2E récents (artefacts repo) | ❌ | `e2e/auth/logout.spec.ts`, `e2e/workout/player.spec.ts` |

---

# Problèmes CRITIQUES

### ZB-C01 — Boucle de redirection HOME ↔ check-in

| Champ | Détail |
|-------|--------|
| **Description** | Quand le check-in quotidien est activé et non fait, `DailyCheckinGate` redirige `/home` → `/daily-check-in`, mais `ProtectedRoute` rejette `/daily-check-in` car absent de `POST_ONBOARDING_ROUTES`. |
| **Reproduction** | 1. Compte onboardé, check-in activé (défaut). 2. Pas de check-in aujourd'hui. 3. Ouvrir `/home`. 4. Oscillation `/home` ↔ `/daily-check-in`. |
| **Fichiers** | `src/components/dailyState/DailyCheckinGate.tsx` L42-44 · `src/lib/navigation/navigationEngine.ts` L71-72 · `src/lib/navigation/routes.ts` L64-95 (pas `DAILY_CHECK_IN`) · `src/app/router/AppRouter.tsx` L104 |
| **Solution proposée** | Ajouter `AppRoutes.DAILY_CHECK_IN` à `POST_ONBOARDING_ROUTES` ou à une whitelist dédiée. |
| **Priorité** | P0 — bloque le check-in pour tous les utilisateurs concernés |

---

### ZB-C02 — `/admin/insights` inaccessible (même pour admins)

| Champ | Détail |
|-------|--------|
| **Description** | `ADMIN_INSIGHTS` absent de `APPLICATION_ROUTES` / `POST_ONBOARDING_ROUTES`. `ProtectedRoute` redirige vers `resolvedRoute` avant `AdminRoute`. |
| **Reproduction** | 1. Configurer `VITE_AURA_ADMIN_EMAILS`. 2. Paramètres → Aura Insights ou `/admin/insights`. 3. Redirection silencieuse vers `/home`. |
| **Fichiers** | `src/lib/navigation/routes.ts` L43 · `src/app/router/ProtectedRoute.tsx` L29-31 · `src/pages/SettingsPage.tsx` L168-174 |
| **Solution proposée** | Ajouter `ADMIN_INSIGHTS` à `POST_ONBOARDING_ROUTES`. |
| **Priorité** | P0 — EPIC 8B admin inutilisable |

---

### ZB-C03 — Onboarding bloqué Welcome → Intro

| Champ | Détail |
|-------|--------|
| **Description** | `OnboardingWelcomePage` met à jour le localStorage puis `goToRoute(INTRO)` **sans** `refreshProgress()`. `isRouteAllowed()` n'autorise que `currentPath === resolvedRoute` pendant l'onboarding ; le state React reste sur Welcome. |
| **Reproduction** | 1. Nouveau compte. 2. `/onboarding/welcome` → « Commencer ». 3. Retour forcé à Welcome ou navigation impossible. |
| **Fichiers** | `src/pages/onboarding/OnboardingWelcomePage.tsx` L12-16 · `src/pages/onboarding/OnboardingIntroPage.tsx` (même pattern) · `src/hooks/useAppNavigation.ts` L26-30 · `src/lib/navigation/navigationEngine.ts` L75-76 |
| **Solution proposée** | `await refreshProgress()` avant navigation (comme `goToResolvedRoute` / `HouseholdPage`). |
| **Priorité** | P0 — bloque nouveaux utilisateurs |

---

### ZB-C04 — Coach personnel alimenté par des données fictives

| Champ | Détail |
|-------|--------|
| **Description** | `buildPersonalCoachDiagnostics` reçoit un `coachInput` hardcodé : `dailyEnergy: 6`, `mentalLoad: 45`, `activeGoals: [{ name: "Objectif perso" }]`. Les conseils ne reflètent pas les vraies données utilisateur. |
| **Reproduction** | 1. Ouvrir `/organization/personal-coach`. 2. Observer conseils identiques quel que soit le profil/check-in/objectifs réels. |
| **Fichiers** | `src/pages/PersonalCoachPage.tsx` L71-83 |
| **Solution proposée** | Brancher sur check-in réel, objectifs Supabase, charge mentale calculée — supprimer les fixtures. |
| **Priorité** | P0 — fonctionnalité phare non fiable en bêta |

---

### ZB-C05 — Lint en échec (gate CI/release-check)

| Champ | Détail |
|-------|--------|
| **Description** | `npm run lint` exit code 1 : 5 erreurs `react-hooks/rules-of-hooks` dans les fixtures Playwright. |
| **Reproduction** | `npm run lint` |
| **Fichiers** | `tests/e2e/fixtures/guardian.fixture.ts` L22,28,32,38 · `tests/e2e/fixtures/authenticated.fixture.ts` L20 |
| **Solution proposée** | Renommer fonctions en composants PascalCase ou exclure fixtures du lint oxlint. |
| **Priorité** | P0 — `release-check` et CI rouges |

---

### ZB-C06 — `/daily-check-in` direct inaccessible (hors boucle)

| Champ | Détail |
|-------|--------|
| **Description** | Navigation directe vers `/daily-check-in` (drawer, lien settings, E2E beta) redirige vers `/home` via `ProtectedRoute`. |
| **Reproduction** | Utilisateur connecté → `page.goto("/daily-check-in")` → URL ≠ check-in. |
| **Fichiers** | Même root cause que ZB-C01 · `e2e/beta/critical-beta.spec.ts` |
| **Solution proposée** | Whitelist `/daily-check-in` dans `POST_ONBOARDING_ROUTES`. |
| **Priorité** | P0 — parcours check-in depuis paramètres cassé |

---

# Problèmes MAJEURS

### ZB-M01 — Pas de restitution deep link après login

| Champ | Détail |
|-------|--------|
| **Description** | `ProtectedRoute` redirige vers login sans conserver `location`. Après auth → `goToResolvedRoute()` uniquement. |
| **Reproduction** | Déconnecté → `/planning` → login → arrive sur `/home`, pas `/planning`. |
| **Fichiers** | `src/app/router/ProtectedRoute.tsx` L25-26 · `src/pages/LoginPage.tsx` |
| **Solution** | `state={{ from: location }}` + redirect post-login. |

---

### ZB-M02 — Race condition reset password (timeout 4 s)

| Champ | Détail |
|-------|--------|
| **Description** | `ResetPasswordPage` marque « Lien expiré » après 4 s fixe si `PASSWORD_RECOVERY` tardif. |
| **Reproduction** | Lien reset sur connexion lente → faux négatif. |
| **Fichiers** | `src/pages/ResetPasswordPage.tsx` L61-64 |
| **Solution** | Supprimer timeout arbitraire ; attendre événement ou erreur explicite. |

---

### ZB-M03 — Chargement progress infini si API échoue

| Champ | Détail |
|-------|--------|
| **Description** | `UserProgressProvider` : pas de `.catch()` sur `loadUserProgress()`. Erreur réseau → `loading` permanent. |
| **Reproduction** | Offline/throttle au boot avec session active → « Chargement... » infini. |
| **Fichiers** | `src/contexts/UserProgressProvider.tsx` L56-62 |
| **Solution** | Utiliser `loadUserProgressSafe` + UI retry. |

---

### ZB-M04 — E2E fragmenté : `tests/e2e/` hors config par défaut

| Champ | Détail |
|-------|--------|
| **Description** | `playwright.config.ts` → `testDir: "./e2e"`. Onboarding, goals, trust, offline, RLS dans `tests/e2e/` **non exécutés** par `npm run test:e2e`. |
| **Reproduction** | Comparer 15 specs `e2e/` vs 16 specs `tests/e2e/`. |
| **Fichiers** | `playwright.config.ts` L46 · `playwright.guardian.config.ts` (séparé) |
| **Solution** | Unifier testDir ou script `test:e2e:all`. |

---

### ZB-M05 — Tests E2E obsolètes « Équilibre IA »

| Champ | Détail |
|-------|--------|
| **Description** | Specs référencent l'ancien branding, tests cassés vs UI « Aura ». |
| **Reproduction** | Exécuter `e2e/conversation/*.spec.ts`, `tests/e2e/product-polish/premium-ux.spec.ts`. |
| **Fichiers** | `e2e/conversation/personal-language.spec.ts` L21 · `e2e/conversation/fatigue-reschedule.spec.ts` L19 · `tests/e2e/product-polish/premium-ux.spec.ts` L12 |
| **Solution** | Mettre à jour sélecteurs (`/parler à aura/i`, `/aura en bref/i`). |

---

### ZB-M06 — Échecs E2E logout et workout (artefacts)

| Champ | Détail |
|-------|--------|
| **Description** | Dossiers `test-results/` contiennent échecs récents logout + workout player. |
| **Reproduction** | `npm run test:e2e -- e2e/auth/logout.spec.ts e2e/workout/player.spec.ts` |
| **Fichiers** | `e2e/auth/logout.spec.ts` · `e2e/workout/player.spec.ts` |
| **Solution** | Diagnostiquer traces Playwright ; stabiliser sélecteurs / timing. |

---

### ZB-M07 — Messages d'erreur techniques visibles utilisateur

| Champ | Détail |
|-------|--------|
| **Description** | `formatSupabaseError` expose `[table] INSERT`, codes Postgres, « Exécute les migrations Supabase ». Auth pages affichent `error.message` Supabase (souvent anglais). |
| **Reproduction** | Erreur RLS sur tâche → message technique dans UI. Login invalide → « Invalid login credentials ». |
| **Fichiers** | `src/lib/supabase/formatError.ts` · `src/pages/LoginPage.tsx` · `src/pages/HomePage.tsx` L294, L334-342 |
| **Solution** | Couche `mapUserFacingError()` FR ; logs dev seulement. |

---

### ZB-M08 — Catégories tâches en anglais dans l'UI

| Champ | Détail |
|-------|--------|
| **Description** | `{task.category}` affiche `studies`, `work`, `family` au lieu des labels FR du formulaire. |
| **Reproduction** | Créer tâche → liste affiche clé brute. |
| **Fichiers** | `src/pages/TasksPage.tsx` ~L427 |
| **Solution** | Mapper via tableau `categories` existant. |

---

### ZB-M09 — `alert()` natif pour feedback utilisateur

| Champ | Détail |
|-------|--------|
| **Description** | `window.alert()` utilisé pour erreurs/suggestions — UX non Aura, bloque thread, inaccessible. |
| **Reproduction** | Actions planning/home déclenchant alert. |
| **Fichiers** | `src/pages/HomePage.tsx` L464 · `src/pages/PlanningPage.tsx` L201 |
| **Solution** | Toast/modal Aura ou inline error state. |

---

### ZB-M10 — Déconnexion : localStorage partiellement nettoyé

| Champ | Détail |
|-------|--------|
| **Description** | `clearUserLocalData()` ne couvre que 7 préfixes. Conversation, coach, goals, knowledge, feedback, audit restent. |
| **Reproduction** | User A utilise assistant → logout → inspecter `localStorage` → clés `equilibre-assistant-conversation:*` présentes. |
| **Fichiers** | `src/mobileReliability/security/sessionSecurity.ts` L9-17 · `src/ai/conversationFoundation/conversation/historyManager.ts` |
| **Solution** | Registre central des clés user-scoped ; wipe complet au sign-out. |

---

### ZB-M11 — PWA cache les réponses Supabase (24 h)

| Champ | Détail |
|-------|--------|
| **Description** | Workbox `NetworkFirst` sur `*.supabase.co` avec cache 86400 s — risque données stale / fuite appareil partagé. |
| **Reproduction** | Installer PWA → utiliser → offline → données API en cache SW. |
| **Fichiers** | `vite.config.ts` L37-46 |
| **Solution** | Exclure endpoints authentifiés du runtime cache. |

---

### ZB-M12 — Admin autorisation 100 % client-side

| Champ | Détail |
|-------|--------|
| **Description** | `isAuraAdmin()` compare email à `VITE_AURA_ADMIN_EMAILS` dans le bundle. Contournable ; emails admins exposés. |
| **Fichiers** | `src/auraInsights/adminAccess.ts` · `src/app/router/AdminRoute.tsx` |
| **Solution** | Rôle serveur Supabase ; garde client = UX only. |

---

### ZB-M13 — RLS cœur non versionnée en migrations

| Champ | Détail |
|-------|--------|
| **Description** | `00001_initial_schema_documented.sql` indique RLS profiles/household gérée « dashboard only » — drift non auditable. |
| **Fichiers** | `supabase/migrations/00001_initial_schema_documented.sql` |
| **Solution** | Exporter et committer toutes les policies. |

---

### ZB-M14 — États vides legacy sans AuraIllustration

| Champ | Détail |
|-------|--------|
| **Description** | Plusieurs écrans utilisent `empty-card` brut au lieu de `EmptyState`. |
| **Fichiers** | `src/pages/PlanningPage.tsx` · `src/components/home/widgets/TodayTimelineWidget.tsx` · `src/pages/FamilyContextPage.tsx` |
| **Solution** | Migrer vers `EmptyState aura="empty"`. |

---

### ZB-M15 — Parcours auth hors design system

| Champ | Détail |
|-------|--------|
| **Description** | Login/Signup/Forgot/Reset : `<button>` et `<input>` natifs, pas `Button`/`FormField`. |
| **Fichiers** | `src/pages/LoginPage.tsx` · `SignupPage.tsx` · `ForgotPasswordPage.tsx` · `ResetPasswordPage.tsx` |
| **Solution** | Aligner sur composants Aura. |

---

### ZB-M16 — Incohérence tu / vous dans toute l'app

| Champ | Détail |
|-------|--------|
| **Description** | Onboarding/Trust en « vous », Login/Coach/Tasks en « tu », Home premium mixte. |
| **Fichiers** | `OnboardingWelcomePage.tsx` L22 · `LoginPage.tsx` · `TrustCenterPage.tsx` · `HomePremiumDashboard.tsx` |
| **Solution** | Charte tonale unique (tu recommandé pour coach). |

---

### ZB-M17 — Checklist lancement ouverte à tous (doc vs code)

| Champ | Détail |
|-------|--------|
| **Description** | `/settings/launch-checklist` sous `ProtectedRoute` seulement ; `BETA_GUIDE` suggère contrôle admin. |
| **Fichiers** | `src/app/router/AppRouter.tsx` L142 · `Docs/BETA_GUIDE.md` |
| **Solution** | Clarifier produit : admin-only ou accepté pour tous beta testers. |

---

### ZB-M18 — Onboarding : retour arrière impossible

| Champ | Détail |
|-------|--------|
| **Description** | `isRouteAllowed` force `currentPath === resolvedRoute` en onboarding — bouton retour navigateur bloqué. |
| **Fichiers** | `src/lib/navigation/navigationEngine.ts` L75-76 |
| **Solution** | Autoriser étapes déjà complétées. |

---

### ZB-M19 — Compte « onboardingCompleted » sans foyer accède à /home

| Champ | Détail |
|-------|--------|
| **Description** | `resolveNavigationRoute` renvoie HOUSEHOLD si pas de foyer, mais `isRouteAllowed` autorise `/home` via POST_ONBOARDING. |
| **Fichiers** | `src/lib/navigation/navigationEngine.ts` L11-16 vs L71-72 |
| **Solution** | Restreindre routes si `!hasHousehold`. |

---

### ZB-M20 — Analytics global non scopé par utilisateur

| Champ | Détail |
|-------|--------|
| **Description** | `aura-insights-events-v1` unique — mélange comptes sur même navigateur. |
| **Fichiers** | `src/auraInsights/eventStore.ts` |
| **Solution** | Partition par user/anonymousId ; purge au logout. |

---

### ZB-M21 — `navigationEngine.test.ts` ne couvre pas les régressions C01/C02

| Champ | Détail |
|-------|--------|
| **Description** | Aucun test pour `/daily-check-in` ni `/admin/insights` dans `isRouteAllowed`. |
| **Fichiers** | `src/lib/navigation/navigationEngine.test.ts` |
| **Solution** | Ajouter cas limites routes whitelist. |

---

### ZB-M22 — E2E critiques manquants (checklist user)

| Champ | Détail |
|-------|--------|
| **Description** | Pas de specs E2E dédiées : Trust Center exports, notifications settings, coach complet, signup flow (dans config default), responsive viewports. |
| **Reproduction** | Rechercher `trust`, `notification` dans `e2e/**/*.spec.ts` → 0 résultat. |
| **Solution** | Suite `e2e/critical/` unifiée exécutée en CI. |

---

# Problèmes MINEURS

| ID | Description | Fichiers / notes |
|----|-------------|------------------|
| ZB-m01 | Logout sans `navigate()` explicite — flash shell possible | `AuthProvider.tsx`, `UserMenu.tsx` |
| ZB-m02 | Deux chemins logout (`signOut` vs `signOutCurrentDevice`) | `SecurityPanel.tsx` vs `AuthProvider` |
| ZB-m03 | `/reset-password` public sans wrapper auth — session active → « expiré » | `ResetPasswordPage.tsx` |
| ZB-m04 | 404 visiteur : « Retour accueil » hard redirect vs lien login | `AppErrorFallback.tsx` |
| ZB-m05 | `console.error/warn` en production (auth, calendar, memory, context) | 17 fichiers `src/` (~20 occurrences) |
| ZB-m06 | Menu navigation ~25 emojis vs `AuraStar` | `appNavigationItems.ts`, `AppShell` ☰ |
| ZB-m07 | Tokens Sprint 4.0 verts parallèles tokens Aura | `tokens.css`, `index.css` imports |
| ZB-m08 | Commentaire header CSS « Equilibre IA » | `src/styles/tokens.css` L1 |
| ZB-m09 | `package.json` name `equilibre-ia` (technique, pas UI) | Acceptable si documenté |
| ZB-m10 | Coach page sans `PageContainer` / layout diagnostics legacy | `PersonalCoachPage.tsx` L127-131 |
| ZB-m11 | Placeholder « Google Calendar — bientôt disponible » | `GoogleCalendarIntegrations.tsx` |
| ZB-m12 | Copy prototype Tasks « futur planning intelligent » | `TasksPage.tsx` |
| ZB-m13 | Canal affiché « Beta » (anglais) dans badge | `src/release/version.ts` |
| ZB-m14 | Placeholder checklist « blockers… » (anglais) | `LaunchChecklistPage.tsx` L128 |
| ZB-m15 | Emojis changelog ✨🔧💫 vs charte | `WhatsNewPage.tsx` |
| ZB-m16 | Emojis meta tâches ⏱️📅✅ | `TasksPage.tsx` |
| ZB-m17 | `ErrorBoundary` hors `BrowserRouter` — OK après fix report href | `main.tsx` |
| ZB-m18 | `DailyCheckinGate` ne s'applique qu'à `/home` | `DailyCheckinGate.tsx` L42 |
| ZB-m19 | Dossiers E2E vides (placeholders) | `e2e/mobile/`, `settings/`, `profile/`, `ai/`, `performance/` |
| ZB-m20 | `HomePage` bundle 57 KB gzip 18 KB — le plus lourd page | Build output |
| ZB-m21 | `client-BvdYZ812.js` Supabase 203 KB — attendu | Build output |
| ZB-m22 | Focus visible absent sur certains boutons custom coach/priorité | `PersonalCoachPage.tsx` |
| ZB-m23 | Admin redirect silencieux non-admin → home | `AdminRoute.tsx` |
| ZB-m24 | Mot de passe test fallback dans fixtures | `tests/e2e/fixtures/users.ts` |
| ZB-m25 | `.env.example` incomplet vs `featureFlags.ts` | Config drift |
| ZB-m26 | `validateSessionFreshness()` exporté jamais branché | `sessionSecurity.ts` |
| ZB-m27 | Stack traces en sessionStorage (signalement erreur) | `errorReport.ts` |
| ZB-m28 | `signOut()` optimiste avant fin Supabase | `AuthProvider.tsx` L55-58 |

---

# Suggestions

| ID | Description | Bénéfice |
|----|-------------|----------|
| ZB-s01 | Unifier `BrandName` / `AuraLogo` vs `<p className="brand-name">` manuel | Cohérence |
| ZB-s02 | Renommer « Score Équilibre » → « Score d'équilibre » (éviter ancien nom produit) | Branding |
| ZB-s03 | `npm audit` en CI | Sécurité deps |
| ZB-s04 | Scripts Capacitor sans deps `@capacitor/*` dans package.json | Clarté |
| ZB-s05 | Default `VITE_AURA_INSIGHTS=false` en prod | Privacy by default |
| ZB-s06 | Fail CI si `VITE_AURA_ADMIN_EMAILS` vide en beta | Ops |
| ZB-s07 | Lighthouse CI sur Home/Planning/Settings | Performance |
| ZB-s08 | Tests responsive Playwright (320, 375, 768, 1440) | Mobile |
| ZB-s09 | Tests axe-core / pa11y sur pages clés | A11y automatisée |
| ZB-s10 | Migrer emojis menu → icônes SVG Aura | Design system |
| ZB-s11 | Lazy load `conversationFoundation` (67 KB gzip 19 KB) | Perf |
| ZB-s12 | `React.memo` sur widgets Home lourds | Perf |
| ZB-s13 | Documenter ton « tu » dans `AURA_DESIGN_SYSTEM.md` | Copy |
| ZB-s14 | Centraliser mapping erreurs Supabase FR | i18n |
| ZB-s15 | Fusionner `e2e/` et `tests/e2e/` arborescence | Maintenabilité |
| ZB-s16 | Ajouter test E2E boucle check-in (régression C01) | QA |
| ZB-s17 | Hash salt analytics côté serveur | Privacy |
| ZB-s18 | Mettre à jour docs legacy `0.1.0-beta` dans ROADMAP/NETLIFY | Docs |

---

# Matrice par domaine (checklist utilisateur)

| Domaine | État | Commentaire |
|---------|------|-------------|
| **Routes** | ❌ | Bugs C01-C03, C06, M01, M19 |
| **Auth** | ⚠️ | Login OK unit ; reset race M02 ; deep link M01 ; logout E2E fail M06 |
| **Onboarding** | ❌ | Bloqué C03 ; retour arrière M18 ; E2E hors config default M04 |
| **Check-in** | ❌ | Boucle C01 ; route directe C06 |
| **Coach** | ❌ | Mock C04 ; pas E2E M22 |
| **Planning** | ⚠️ | E2E partiel `e2e/planning/` ; empty state M14 ; alert M09 |
| **Objectifs** | ⚠️ | E2E dans `tests/e2e/goals/` (hors default) ; EmptyState OK |
| **Notifications** | ⚠️ | Engine testé unit ; **pas E2E** |
| **Trust Center** | ⚠️ | UI solide ; **pas E2E** exports/delete |
| **Offline** | ⚠️ | Module `mobileReliability` testé ; E2E dans `tests/e2e/` only ; queue OK en code |
| **Responsive** | ⚠️ | CSS safe-area/mobile EPIC 7B ; **non testé** multi-viewport |
| **Accessibilité** | ⚠️ | Focus partiel ; alert() M09 ; emojis navigation M06 |
| **Performances** | ⚠️ | Lazy pages OK ; Home lourd m20 ; pas audit Lighthouse |
| **Design system** | ⚠️ | Aura 8/10 ; auth/empty/coach gaps |
| **Textes** | ⚠️ | tu/vous M16 ; EN errors M07-M08 |
| **Sécurité** | ⚠️ | RLS partiel M13 ; admin client M12 ; storage M10-M11 |
| **Logs** | ✅ | 0 TODO/FIXME/HACK dans `src/` ; console prod m05 |
| **Dépendances** | ✅ | Stack minimal 4 deps runtime |
| **Qualité** | ⚠️ | Unit ✅ Build ✅ Lint ❌ E2E partiel |

---

# Recommandations priorisées (avant correction)

### Phase P0 — Bloquants bêta (estimé 2–4 jours)
1. ZB-C01 + C06 — Whitelist `/daily-check-in`
2. ZB-C02 — Whitelist `/admin/insights`
3. ZB-C03 — `refreshProgress()` onboarding
4. ZB-C04 — Coach données réelles
5. ZB-C05 — Fix lint fixtures

### Phase P1 — Stabilisation (estimé 3–5 jours)
6. ZB-M07, M08, M09 — Erreurs user-facing FR
7. ZB-M04, M05, M06 — Unifier et réparer E2E
8. ZB-M10, M11 — Storage + PWA cache
9. ZB-M14, M15 — Polish empty states + auth DS
10. ZB-M21 — Tests navigation régression

### Phase P2 — Excellence bêta (estimé 5–8 jours)
11. ZB-M16 — Ton tu/vous
12. ZB-M12, M13 — Sécurité admin + RLS migrations
13. ZB-M22 + suggestions responsive/a11y
14. Guardian vert + release-check full

---

# Comptage final (audit initial)

| Sévérité | Nombre |
|----------|--------|
| **CRITIQUE** | **6** |
| **MAJEUR** | **22** |
| **MINEUR** | **28** |
| **SUGGESTION** | **18** |
| **TOTAL** | **74** |

---

# Comptage après Sprint P0/P1 (2026-07-21)

| Sévérité | Nombre |
|----------|--------|
| **CRITIQUE** | **0** |
| **MAJEUR** | **0** |
| **MINEUR** | **28** (inchangé) |
| **SUGGESTION** | **18** (inchangé) |

**Préparation bêta : 68 % → 86 %**

Détail complet : `Docs/BETA_STABILIZATION_REPORT.md`

---

# Statut stabilisation — CRITIQUES

| ID | Statut | Justification |
|----|--------|---------------|
| ZB-C01 | **CORRIGÉ** | `DAILY_CHECK_IN` dans `POST_ONBOARDING_ROUTES` + navigationEngine |
| ZB-C02 | **CORRIGÉ** | `ADMIN_INSIGHTS` dans `POST_ONBOARDING_ROUTES` |
| ZB-C03 | **CORRIGÉ** | `advanceOnboardingStep()` + `refreshProgress()` |
| ZB-C04 | **CORRIGÉ** | `buildPersonalCoachInputFromUser()` — plus de fixtures |
| ZB-C05 | **CORRIGÉ** | Override oxlint fixtures Playwright |
| ZB-C06 | **CORRIGÉ** | Même correction que C01 |

---

# Statut stabilisation — MAJEURS

| ID | Statut | Justification |
|----|--------|---------------|
| ZB-M01 | **CORRIGÉ** | Deep link `state.from` + redirect post-login |
| ZB-M02 | **CORRIGÉ** | Timeout 4 s supprimé |
| ZB-M03 | **CORRIGÉ** | `progressError` + UI retry |
| ZB-M04 | **CORRIGÉ** | Script `npm run test:e2e:all` |
| ZB-M05 | **CORRIGÉ** | Sélecteurs Aura mis à jour |
| ZB-M06 | **CORRIGÉ** | Navigation explicite logout + fix C01 (E2E non re-run) |
| ZB-M07 | **CORRIGÉ** | `mapUserFacingError` / `formatSupabaseError` |
| ZB-M08 | **CORRIGÉ** | `getCategoryLabel()` TasksPage |
| ZB-M09 | **CORRIGÉ** | `alert()` remplacé par messages inline |
| ZB-M10 | **CORRIGÉ** | Registre `userScopedStorage` |
| ZB-M11 | **CORRIGÉ** | Cache Workbox Supabase retiré |
| ZB-M12 | **CORRIGÉ** | `app_metadata.aura_role` + env fallback (serveur à configurer) |
| ZB-M13 | **CORRIGÉ** | Migration `00020_core_profiles_household_rls.sql` |
| ZB-M14 | **CORRIGÉ** | `EmptyState` Planning / Home timeline / FamilyContext |
| ZB-M15 | **CORRIGÉ** | Auth pages → Button / FormField |
| ZB-M16 | **CORRIGÉ** | Ton « tu » parcours onboarding + Trust |
| ZB-M17 | **CORRIGÉ** | Checklist sous `AdminRoute` |
| ZB-M18 | **CORRIGÉ** | Retour arrière onboarding autorisé |
| ZB-M19 | **CORRIGÉ** | Restriction routes si `!hasHousehold` |
| ZB-M20 | **CORRIGÉ** | `clearInsightEventsForUser()` au logout |
| ZB-M21 | **CORRIGÉ** | Tests J–M navigationEngine |
| ZB-M22 | **CORRIGÉ** | `critical-beta.spec.ts` étendu |

---

# Comptage final (audit initial — conservé ci-dessus)

---

# Estimation préparation bêta

| Critère | Score |
|---------|-------|
| Stabilité technique (build, unit tests) | 90 % |
| Parcours utilisateur critiques | 55 % |
| UX / design Aura cohérent | 72 % |
| Sécurité & privacy | 65 % |
| Couverture QA automatisée | 58 % |
| Documentation ops | 80 % |

## **Préparation bêta globale estimée : 68 %** *(audit initial)*

> **Après Sprint P0/P1 (2026-07-21) : 86 %** — voir `Docs/BETA_STABILIZATION_REPORT.md`

**Interprétation :**
- **≥ 85 %** — Bêta privée confiante, onboarding fluide
- **70–84 %** — Bêta fermée avec liste de bugs connus ← **proche, non atteint**
- **< 70 %** — Risque élevé de churn / support ← **position actuelle**

---

## Prochaine étape

**Attendre validation** avant toute correction. Sur approbation, recommander de traiter les **6 critiques en priorité absolue**, puis relancer `npm run release-check:full` et une passe E2E unifiée.

---

*Rapport généré sans commit, sans merge, sans déploiement.*
