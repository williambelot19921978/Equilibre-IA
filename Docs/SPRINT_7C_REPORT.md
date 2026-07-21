# Sprint 7C — Rapport EPIC Aura Design System & Brand Identity

## Objectif

Transformer l'identité visuelle en marque premium **Aura** — design system, rebranding UI, thème, assets, documentation. Aucune logique métier ni moteur IA ajouté.

## Livrables

### Design System

- Tokens Aura : `src/styles/aura-tokens.css` (palette nuit / violet→bleu / doré)
- Composants & motion : `src/styles/aura-design-system.css`
- Brand constants : `src/design-system/aura/brand.ts`
- Thème clair / sombre / système : `ThemeProvider`, `themeStore`, réglages dans `/settings`
- Architecture sons (sans fichiers audio) : `soundEngine.ts`

### Composants Aura

- `AuraStar` — signature sémantique (coach, insight, success, loading, achievement)
- `AuraLogo` / `AuraHeaderMark`
- `AuraIllustration` — états vides, succès, erreur, bienvenue, découverte, offline
- `BrandName`, `AuraThemeSettings`
- `Card` prop `glass`, `EmptyState` prop `aura`

### Assets (`public/aura/`)

- logo-light, logo-dark, logo-monochrome
- icon.svg, favicon.svg, splash-mobile.svg

### Rebranding UI

- `appConfig.name` → **Aura**
- Remplacement des libellés « Équilibre IA » dans `src/` (UI, notifications, onboarding, auth…)
- `index.html`, `manifest.webmanifest`, `vite.config.ts` (PWA), `capacitor.config.json`
- Package npm `equilibre-ia` et URLs techniques **inchangés**

### Pages

- Accueil premium Aura : `HomePremiumDashboard` (glass, AuraStar coach)
- `/about` — mission, vision, valeurs, pourquoi Aura
- Paramètres — section Apparence + sélecteur de thème

### Documentation

- `Docs/AURA_DESIGN_SYSTEM.md`

## Fichiers impactés (principaux)

| Zone | Fichiers |
|------|----------|
| DS | `src/design-system/aura/*`, `src/styles/aura-*.css` |
| Composants | `src/components/aura/*`, `Card`, `EmptyState`, `HomePremiumDashboard`, `AppShell` |
| Config | `src/config/app.ts`, `index.html`, `manifest`, `vite.config.ts`, `capacitor.config.json` |
| Routes | `routes.ts`, `AppRouter`, `lazyPages`, `AboutPage` |
| Providers | `AppProviders`, `main.tsx` (init thème) |
| Tests | `src/design-system/aura/aura.test.ts`, e2e mobile-offline |

## Tests

```bash
npm run test:aura-design-system   # 4 tests
npm test                          # suite complète
npm run build
npm run lint
```

## Points de test manuel

1. Ouvrir `/home` — hero glass, étoile coach, dégradé discret
2. `/settings` — basculer Clair / Sombre / Système
3. `/about` — contenu marketing Aura
4. Auth (login) — brand name « Aura »
5. PWA manifest / favicon `/aura/favicon.svg`
6. Header app — AuraStar + nom Aura

## Limites connues

- Icônes emoji legacy encore présentes dans certaines zones (migration progressive)
- Fichiers audio non fournis — architecture prête dans `soundEngine`
- Stores Android/iOS : icônes SVG ; PNG dédiés stores à générer avant publication
- Docs constitution / roadmap historiques non renommés (références techniques)

## Qualité

- Aucun commit, merge ou déploiement (attente validation utilisateur)
- Vérifier Guardian après validation

## Statut

**Prêt pour revue utilisateur.**
