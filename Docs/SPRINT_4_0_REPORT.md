# Sprint 4.0 — Refonte UX/UI Premium

> **Date :** 15 juillet 2026  
> **Statut :** ✅ Livré  
> **Objectif :** transformer Equilibre IA en application premium (One UI, Apple Calendar, Headspace)

---

## Contraintes respectées

| Interdit | Statut |
|----------|--------|
| Logique métier | ✅ Aucune modification des moteurs planning / life / NLP |
| Tables Supabase | ✅ Aucune migration |
| Moteur IA | ✅ Intouché |
| Calculs | ✅ Aucun nouveau calcul — affichage uniquement |

---

## 1. Design System

### Tokens (`src/styles/tokens.css`)

- Palette brand (sauge `#568d79`) + neutrals
- Identités par espace (Accueil, Planning, Calendrier, Sport, Spirituel, Profil, Famille)
- Couleurs cellules calendrier (travail, repos, vacances, week-end, déplacement, chargé, spécial)
- Couleurs blocs timeline (travail, repos, sport, spiritualité, famille, étude, libre)
- Espacements, rayons, ombres, typographie, touch targets 44 px, animations

### Composants UI (`src/components/ui/`)

| Composant | Rôle |
|-----------|------|
| `Card` | Cartes réutilisables (default / elevated / ghost / interactive) |
| `SectionHeader` | En-têtes de section avec label, titre, actions |
| `PageContainer` | Conteneur page max-width |
| `Chip` | Puces sélectionnables |
| `Button`, `BetaBadge` | Existants, compatibles tokens |

### Styles premium (`src/styles/sprint40.css`)

- Composants design system
- Layout shell (header, sidebar, bottom nav)
- Dashboard accueil, timeline premium, calendrier, profil, espace spirituel
- Animations GPU (fade, slide, hover) + `prefers-reduced-motion`
- Breakpoints : mobile → tablette (768 px) → desktop (1024 px+)

---

## 2. Header global fixe

**Fichier :** `src/components/navigation/AppShell.tsx`

| Élément | Détail |
|---------|--------|
| ☰ | Ouvre le drawer **réglages avancés** |
| Logo + « Équilibre IA » | Identité visible (desktop) |
| Titre page | Depuis `AppLayoutContext` ou route |
| Notifications | Placeholder désactivé (futur) |
| Avatar | Initiale → `/profile` |

Header `position: fixed`, blur backdrop, hauteur 56 px.

---

## 3. Menu principal permanent

| Viewport | Navigation |
|----------|------------|
| **Desktop (≥768 px)** | Colonne gauche fixe 240 px — `AppSidebar` |
| **Mobile** | Barre inférieure 5 onglets — `BottomNav` |

**Entrées principales** (`src/design-system/spaceThemes.ts`) :

Accueil · Planning · Calendrier · Spirituel · Profil

**Drawer** (`AppDrawer`) — réglages avancés uniquement :

- Organisation : Tâches, Mon quotidien, Contexte familial, Vacances, Enfants
- Personnalisation : Découverte, Paramètres profil
- Déconnexion

---

## 4. Identité visuelle par espace

`AuthenticatedAppLayout` applique `data-space="{id}"` sur le layout.

| Espace | Couleur | Attribut |
|--------|---------|----------|
| Accueil | Vert sauge | `home` |
| Planning | Bleu | `planning` |
| Calendrier | Orange | `calendar` |
| Spirituel | Violet | `spiritual` |
| Profil | Turquoise | `profile` |
| Famille | Vert tendre | `family` |

Le fond de page et les accents header/nav s'adaptent via CSS variables `--space-current-*`.

---

## 5. Calendrier — MonthCalendar

**Fichier :** `src/components/calendar/MonthCalendar.tsx`  
**Helper visuel :** `src/design-system/dayCellVisual.ts`

- Cellules remplies par type de journée (données existantes `monthOverview`)
- Icônes et badges discrets en mode compact
- Événements secondaires (chips réduits)
- Hover / sélection / aujourd'hui avec coins arrondis style Samsung Calendar

| Type | Couleur fill |
|------|--------------|
| Travail | Orange `#f5dcc8` |
| Repos | Vert clair |
| Vacances | Vert soutenu |
| Week-end | Bleu |
| Déplacement | Jaune |
| Journée chargée | Rouge clair |
| Spéciale | Violet |

---

## 6. Timeline — DayTimeline

**Fichier :** `src/components/planning/DayTimeline.tsx`

- Blocs avec icône dans `day-timeline-icon-wrap`
- Bordure gauche colorée par type visuel
- Coins très arrondis (`--radius-xl`)
- Badge statut, durée, explication
- Animation slide-up à l'apparition
- Marqueur « Maintenant » pulsant

---

## 7. Accueil — Dashboard

**Fichier :** `src/pages/HomePage.tsx`

Structure above-the-fold :

1. **Hero** — Bonjour {prénom}, météo (placeholder), état journée, prochaine activité
2. **Grille 2 colonnes (desktop)** :
   - Gauche : Timeline du jour + calendrier compact
   - Droite : Citation spirituelle, prochaine activité, contexte familial
3. Section mémoire IA repliable (inchangée fonctionnellement)

Suppression du header dupliqué (titre géré par AppShell).

---

## 8. Profil — Fiche premium

**Fichier :** `src/pages/ProfilePage.tsx`

- Hero : avatar, email, barre progression IA (`getDiscoveryProgressSummary`)
- Grille de cartes thématiques avec icône + couleur :
  - Identité, Travail, Sommeil, Études, Sport, Repos, Spiritualité, Priorités
- Bouton « Modifier » par carte (logique save inchangée)

---

## 9. Espace spirituel

**Fichier :** `src/pages/SpiritualSpacePage.tsx`

- Dégradé violet en haut de page (`spiritual-space-page::before`)
- Illustration discrète ✦
- Cartes glassmorphism (`spiritual-card` unifié)
- Aucune modification des moteurs de suggestion

---

## 10–13. Animations, Responsive, Accessibilité, Performance

| Axe | Implémentation |
|-----|----------------|
| Animations | `transform` + `opacity` (GPU), durées 150–350 ms |
| Responsive | Sidebar desktop / bottom nav mobile, grilles adaptatives |
| Accessibilité | Contraste tokens AA, touch 44 px, `aria-label`, `prefers-reduced-motion` |
| Performance | Pas de librairie animation lourde, composants nav mémorisés via callbacks |

---

## 14. Quality Gate

| Check | Résultat |
|-------|----------|
| `npm run build` | ✅ |
| `npm run lint` | ✅ (3 warnings Fast Refresh préexistants) |
| `npm test` | ✅ **304 tests** (+16 Sprint 4.0) |
| `npm run preview` | ✅ (build prod OK) |

### Tests Sprint 4.0

`src/lib/navigation/sprint40.test.ts` — 16 tests (tokens, shell, nav, espaces, calendrier, timeline, pages).

### Tests legacy mis à jour

- `sprint27.test.ts` — bouton menu → `app-header-menu-btn`
- `sprint28.test.ts` — Spirituel dans nav principale, plus dans drawer

---

## Fichiers créés / modifiés

### Créés

```
src/styles/tokens.css
src/styles/sprint40.css
src/design-system/spaceThemes.ts
src/design-system/dayCellVisual.ts
src/components/ui/Card.tsx
src/components/ui/SectionHeader.tsx
src/components/ui/PageContainer.tsx
src/components/ui/Chip.tsx
src/components/navigation/AppSidebar.tsx
src/components/navigation/BottomNav.tsx
src/lib/navigation/sprint40.test.ts
Docs/SPRINT_4_0_REPORT.md
```

### Modifiés (UI uniquement)

```
src/index.css
src/app/layouts/AuthenticatedAppLayout.tsx
src/components/navigation/AppShell.tsx
src/components/navigation/AppDrawer.tsx
src/components/calendar/MonthCalendar.tsx
src/components/planning/DayTimeline.tsx
src/pages/HomePage.tsx
src/pages/ProfilePage.tsx
src/pages/SpiritualSpacePage.tsx
src/lib/calendar/sprint27.test.ts
src/lib/spiritual/sprint28.test.ts
```

---

## Prochaines étapes suggérées (hors scope 4.0)

- Migrer les pages restantes (Planning, Calendar, Tasks) vers `SectionHeader` / `Card`
- Extraire `Modal`, `Input`, `Select` du CSS monolithique
- Intégration météo réelle dans le hero accueil
- Notifications push (placeholder header déjà en place)
- Code-splitting Vite pour réduire le bundle JS (>500 kB)

---

*Sprint 4.0 — Equilibre IA · UX/UI Premium · Juillet 2026*
