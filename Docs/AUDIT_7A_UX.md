# Audit UX EPIC 7A — Équilibre IA

Date : 2026-07-21  
Périmètre : toutes les pages applicatives + onboarding + auth

## Synthèse

| Critère | Avant 7A | Après 7A |
|---------|----------|----------|
| Onboarding | 4 pages auth-card, sans progression | 9 étapes guidées, stepper, skip enfants/check-in/objectifs |
| Design system | 8 composants | +6 composants (Badge, Skeleton, Empty/Error, Form, Stepper) |
| Accueil | Header + widgets empilés | Dashboard premium structuré + skeletons |
| Check-in | Gate hard redirect | Préférence utilisateur + « Passer pour aujourd'hui » |
| Settings | Dispersés (profil) | Hub `/settings` |
| Demo | Aucun | Mode démo + bannière sortie |
| Chargement | Texte « Chargement... » | SkeletonCard sur routes lazy + onboarding |
| Code splitting | Import statique | Lazy routes |

## Pages auditées

### Auth (`/login`, `/signup`)
- **Cohérence** : auth-card existante — inchangée (hors scope minimal)
- **A11y** : labels présents
- **Action 7A** : migration FormField recommandée sprint ultérieur

### Onboarding (9 routes)
- **Avant** : sans stepper, enfants quasi obligatoires
- **Après** : OnboardingLayout, progression, skip explicites
- **Responsive** : card 520px max, OK 320–1440 px

### Accueil (`/home`)
- **Avant** : surcharge banners + widgets
- **Après** : HomePremiumDashboard + widgets configurables conservés
- **Perf** : lazy + skeleton

### Planning / Calendrier / Tâches
- **État** : patterns `.empty-card` existants
- **Action 7A** : ErrorState/Skeleton réutilisables disponibles — migration progressive

### Check-in (`/daily-check-in`)
- **Après** : stepper, animations, skip visible, styles DS

### Organisation (Coach, Life Knowledge, etc.)
- **État** : PageContainer existant — cohérent
- **Action** : liens depuis Settings hub

### Profil / Settings
- **Après** : `/settings` hub central

## Responsive (checklist)

| Breakpoint | Statut |
|------------|--------|
| 320 px | OK onboarding card + home grid 1 col |
| 375 px | OK |
| 390 px | OK |
| 430 px | OK |
| 768 px | Home grid 2 col |
| 1024 px | Shell sidebar existant |
| 1440 px | OK |

## Accessibilité

- Contraste badges/erreurs : WCAG AA visé
- Focus `:focus-visible` sur inputs DS
- ProgressStepper : `role="progressbar"`
- Demo banner : `role="status"`

## Performances

- Lazy loading toutes pages route-level
- Suspense fallback skeleton
- Pas de changement logique métier / requêtes

## Limites connues

- Empty states non migrés sur toutes les pages
- Auth pages pas refondues visuellement
- Notifications section placeholder
- Guardian e2e product-polish nécessite `GUARDIAN_E2E`
