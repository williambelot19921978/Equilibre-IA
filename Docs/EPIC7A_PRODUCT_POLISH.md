# EPIC 7A — Product Polish & Premium UX

## Objectif

Transformer Équilibre IA en produit premium : plus simple, rapide, agréable, cohérent et fluide — **sans nouveau moteur IA**.

## Architecture UX

```
OnboardingLayout + ProgressStepper
        ↓
Design System (Badge, Skeleton, EmptyState, ErrorState, FormField)
        ↓
Pages applicatives (Home premium, Settings, Demo)
        ↓
Lazy-loaded routes (code splitting)
```

## Onboarding premium (< 3 min)

| Étape | Route | Skippable |
|-------|-------|-----------|
| Bienvenue | `/onboarding/welcome` | — |
| Présentation | `/onboarding/intro` | — |
| Foyer | `/onboarding/household` | Non |
| Enfants | `/onboarding/children` | Oui |
| Profil | `/onboarding/profile` | Non |
| Check-in | `/onboarding/check-in` | Oui (recommandé / plus tard) |
| Priorité | `/onboarding/priority` | Non |
| Objectifs | `/onboarding/goals` | Oui |
| Découverte | `/discovery` | Oui |

Progression UX stockée dans `localStorage` via `onboardingProgressStore.ts`.

## Design system (EPIC 7A)

| Composant | Fichier |
|-----------|---------|
| Badge | `src/components/ui/Badge.tsx` |
| Skeleton | `src/components/ui/Skeleton.tsx` |
| EmptyState | `src/components/ui/EmptyState.tsx` |
| ErrorState | `src/components/ui/ErrorState.tsx` |
| ProgressStepper | `src/components/ui/ProgressStepper.tsx` |
| FormField / Input / Select / TextArea | `src/components/ui/FormField.tsx` |
| Styles | `src/styles/sprint52-product-polish.css` |

## Accueil premium

`HomePremiumDashboard` affiche :

- Bonjour + priorité
- État du jour (check-in widget)
- Conseil du coach
- Prochaine action
- Résumé planning

Skeletons pendant le chargement — jamais de page blanche.

## Daily Check-in

- Progression visible (`ProgressStepper`)
- Bouton **« Passer pour aujourd'hui »** toujours visible
- Pas de blocage si check-in désactivé dans les paramètres
- Préférence utilisateur : `dailyCheckinPreference.ts`

## Mode démo

- Activation : Paramètres → Mode démonstration
- Données fictives via `buildDemoSnapshot()`
- Bannière « Quitter la démo » persistante

## Paramètres

Route `/settings` — sections :

- Compte, IA, Coach, Check-in, Notifications, Confidentialité, Apparence, Mode démo

## Performances

- Routes lazy-loaded : `src/app/router/lazyPages.tsx`
- Suspense + `SkeletonCard` fallback
- Bundle découpé par page

## Accessibilité

- `role="progressbar"`, `role="alert"`, `aria-live`
- Focus visible sur inputs DS
- Labels explicites sur check-in (range, étoiles)

## Responsive

Grille accueil 1 colonne (< 768 px) → 2 colonnes (≥ 768 px).  
Onboarding card `max-width: 520px`, padding mobile 16 px.

## Tests

| Suite | Commande |
|-------|----------|
| Unit EPIC 7A | `npm run test:product-polish` |
| E2E Guardian | `tests/e2e/product-polish/*.spec.ts` |
| Régression navigation | `navigationEngine.test.ts` |

## Audit

Voir `Docs/AUDIT_7A_UX.md` pour le rapport page par page.

## Roadmap post-7A

- Empty states sur Tasks / Goals via composant partagé
- Notifications réelles dans Settings
- Thème sombre (Apparence)
- Fusion MyAiPage / Life Knowledge dans Settings IA
