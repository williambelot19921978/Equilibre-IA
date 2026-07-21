# Sprint 9 — EPIC 9 Beta Readiness & Launch

**Date :** 2026-07-21  
**Statut :** Livré — en attente de validation  
**Contraintes respectées :** aucun commit, aucun merge, aucun déploiement

---

## Objectif

Finaliser, stabiliser et professionnaliser Aura pour une bêta privée — sans nouvelle fonctionnalité métier ni moteur IA.

---

## Livrables

### 1. Checklist de lancement centralisée

- Module : `src/release/launchChecklist.ts`
- Page : `/settings/launch-checklist` (`LaunchChecklistPage.tsx`)
- Champs : état, priorité, responsable, date, commentaire
- 12 items par défaut (Build, Tests, PWA, Android, iOS, Notifications, Trust, Analytics, Sauvegarde, RLS, Performance, A11y)
- Persistance localStorage

### 2. Mode bêta global

- Module : `src/release/betaMode.ts`, `src/release/version.ts`
- Badge discret : `ReleaseVersionBadge` dans l'en-tête (`AppShell`)
- Canal affiché : Alpha / Beta / Stable
- Version affichée dans Paramètres (`BetaReleaseSettings`)
- Env : `VITE_AURA_RELEASE_CHANNEL`, `VITE_AURA_BETA_MODE`

### 3. Versionning semver

- Version : `1.0.0-beta.1` (package.json + `src/release/version.ts`)
- Format affiché : `v1.0.0-beta.1`
- Rétrocompat : `src/config/appVersion.ts` réexporte le module release

### 4. Changelog — Quoi de neuf ?

- Module : `src/release/changelog.ts`
- Page : `/settings/whats-new` (`WhatsNewPage.tsx`)
- Accès : Paramètres → Bêta & version
- Catégories : nouveautés, corrections, améliorations
- Indicateur « Nouveau » si changelog non lu

### 5. Page d'erreur Aura

- `AppErrorFallback.tsx` refondu : illustration Aura, glass design
- Boutons : Réessayer, Retour accueil, **Signaler**
- Signalement : stash sessionStorage → Trust Center
- Compatible ErrorBoundary (hors Router)

### 6. États vides uniformisés

- `EmptyState` : `aura="empty"` par défaut
- Pages mises à jour : `TasksPage`, `GoalsPage`, `MyAiPage`

### 7. Performances

- `ReleaseVersionBadge` mémorisé (`memo`)
- Pages release en lazy loading (`lazyPages.tsx`)
- Pas de régression bundle (build vérifié)

### 8. Accessibilité

- Page erreur : `role="alert"`, `aria-live="assertive"`
- Checklist : labels associés, `role="progressbar"`
- Focus visibles sur champs checklist et boutons erreur

### 9. Commande `npm run release-check`

- Script : `scripts/release-check.mjs`
- Exécute : lint → tests → typecheck → build → vérif PWA
- Option : `--with-guardian` via `npm run release-check:full`
- Rapport : `reports/RELEASE_CHECK.md`

### 10. Tests E2E critiques

- `e2e/beta/critical-beta.spec.ts`
- Routes : home, settings, whats-new, trust, notifications, planning, check-in, coach, 404, offline
- Ajouté au match Playwright authenticated

### 11. Documentation

- `Docs/BETA_GUIDE.md` — installation, config, déploiement, checklist, support

---

## Fichiers impactés

| Fichier | Action |
| --- | --- |
| `src/release/*` | Nouveau module |
| `src/components/release/*` | Badge + settings bêta |
| `src/pages/WhatsNewPage.tsx` | Nouveau |
| `src/pages/LaunchChecklistPage.tsx` | Nouveau |
| `src/pages/SettingsPage.tsx` | Section bêta |
| `src/components/errors/AppErrorFallback.tsx` | Refonte Aura |
| `src/components/ui/EmptyState.tsx` | Default aura |
| `src/pages/TasksPage.tsx`, `GoalsPage.tsx`, `MyAiPage.tsx` | Empty states |
| `src/components/navigation/AppShell.tsx` | Badge version |
| `src/lib/navigation/routes.ts` | Nouvelles routes |
| `src/app/router/*` | Routes lazy |
| `src/styles/sprint56-beta-release.css` | Styles |
| `scripts/release-check.mjs` | Quality gate |
| `e2e/beta/critical-beta.spec.ts` | E2E |
| `package.json` | version + scripts |
| `Docs/BETA_GUIDE.md` | Doc |
| `Docs/SPRINT_9_REPORT.md` | Ce rapport |

---

## Points de test manuel

1. **Paramètres → Bêta & version** : version, canal, toggle badge
2. **Quoi de neuf ?** : liste changelog, lien retour
3. **Checklist** : modifier état/responsable, barre de progression
4. **Badge en-tête** : Beta + v1.0.0-beta.1 visible
5. **404** : `/route-fake` → illustration + 3 boutons
6. **Signaler** : redirige vers Trust Center (connecté)
7. **Tâches/Objectifs/Mon IA vides** : illustration Aura

---

## Commandes de validation

```bash
npm run test:release
npm test
npm run lint
npm run build
npm run release-check
npm run verify:schema
npm run verify:supabase
```

---

## Limites connues

- Checklist non synchronisée entre appareils (localStorage)
- Guardian exclu du release-check par défaut (durée)
- E2E beta requiert auth setup Playwright
- Audit perf/a11y : améliorations ciblées, pas d'audit Lighthouse automatisé dans ce sprint

---

## Quality gate (à exécuter avant merge)

- [ ] `npm test` — vert
- [ ] `npm run build` — vert
- [ ] `npm run release-check` — vert
- [ ] `npm run quality-guardian` — vert (validation manuelle recommandée)

**Aucun commit effectué — en attente de votre validation.**
