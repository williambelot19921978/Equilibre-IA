# Aura Design System

Référence visuelle officielle du projet **Aura** (EPIC 7C).

## Identité

| Élément | Valeur |
|---------|--------|
| Nom produit | **Aura** |
| Tagline | Votre assistant de vie, en calme et en clarté. |
| Signature | Composant `AuraStar` — jamais décoratif, toujours porteur de sens |

Références techniques internes (`equilibre-ia`, URLs Netlify) conservées hors UI.

## Palette

| Token | Usage | Valeur |
|-------|-------|--------|
| `--aura-bg-deep` | Fond nuit profond | `#0b1020` |
| `--aura-bg-primary` | Surface principale | `#f4f6fb` (clair) / `#0b1020` (sombre) |
| `--aura-accent-start` | Dégradé accent | `#7c3aed` (violet) |
| `--aura-accent-end` | Dégradé accent | `#3b82f6` (bleu) |
| `--aura-accent-gold` | Accent lumineux discret | `#c9a962` |
| `--aura-text-body` | Texte principal | `#1a2235` / `#f1f5f9` |
| `--aura-text-muted` | Texte secondaire | `#64748b` / `#94a3b8` |

Couleurs agressives réservées aux alertes système uniquement.

## Typographie

Police : **Segoe UI**, system-ui (stack `--aura-font-display`).

| Classe | Usage |
|--------|-------|
| `.aura-h1` | Titres page |
| `.aura-h2` | Sections |
| `.aura-h3` | Sous-sections |
| `.aura-body` | Corps de texte |
| `.aura-caption` | Légendes, métadonnées |
| `.aura-button-text` | Libellés boutons |

## Espacements & rayons

Réutilise les tokens existants (`--radius-lg`, gaps DS). Glass cards : padding 20–24px, gap sections 18–20px.

## Glassmorphism

Classe `.aura-glass` ou prop `glass` sur `Card` :

- Fond semi-transparent (`--aura-bg-glass`)
- Flou 16px (`backdrop-filter`)
- Bordure légère (`--aura-glass-border`)
- Ombre douce (`--aura-glass-shadow`)

**Jamais excessif** — une couche de flou, pas d'empilement.

## Animations (150–300 ms)

| Classe | Effet | Durée |
|--------|-------|-------|
| `.aura-fade-in` | Fondu | 220ms |
| `.aura-rise-in` | Apparition + élévation | 220ms |
| `.aura-glow-valid` | Halo doré validation | 300ms |
| `.aura-star-loading` | Pulse chargement IA | 1.2s loop |

Easing : `cubic-bezier(0.22, 1, 0.36, 1)`.

## Logo & assets

Dossier `public/aura/` :

| Fichier | Usage |
|---------|-------|
| `logo-light.svg` | Fond clair |
| `logo-dark.svg` | Fond sombre |
| `logo-monochrome.svg` | Impression / contraste |
| `icon.svg` | App icon 512, PWA |
| `favicon.svg` | Navigateur |
| `splash-mobile.svg` | Splash Capacitor |

Composants React : `AuraLogo`, `AuraHeaderMark`.

## AuraStar

Variants sémantiques :

- `coach` — conseils coach
- `insight` — insights IA
- `success` — validation
- `loading` — chargement
- `achievement` — réussites

Prop `decorative` pour usage dans un titre déjà libellé.

## Thème

`AuraThemeProvider` + réglages `/settings` :

- Mode **clair**
- Mode **sombre**
- Mode **système** (accent automatique via `prefers-color-scheme`)

Stockage : `localStorage` clé `aura-theme-mode`.

## Sons (architecture)

Module `soundEngine.ts` — **aucun son par défaut**.

IDs futurs : `validation`, `success`, `coach`, `notification`.

Activer via `readSoundPreferences().enabled` + handler `setAuraSoundHandler`.

## Illustrations

`AuraIllustration` — kinds : `empty`, `success`, `error`, `welcome`, `discovery`, `offline`.

Style unifié : étoile Aura + glass card + texte calme.

## Composants UI

| Composant | Fichier |
|-----------|---------|
| Button | `src/components/ui/Button.tsx` + styles `.ui-button-primary` |
| Input / Select / TextArea | `src/components/ui/` |
| Card + glass | `Card.tsx` prop `glass` |
| Badge | `Badge.tsx` |
| EmptyState | prop `aura` |
| Dialogs / Menus | styles sprint existants + tokens Aura |

## Icônes

Emoji legacy progressivement remplacé par `AuraStar` là où sémantique. Nouvelles icônes : même épaisseur, 24px par défaut.

## Règles UX

1. **Calme** — pas de couleurs criardes hors alertes
2. **Respiration** — espacements généreux sur l'accueil premium
3. **Cohérence** — `appConfig.name` / `AURA_BRAND` pour tout libellé produit
4. **Pas de régression** — menu, conversation IA, planning toujours visibles
5. **Signature** — AuraStar uniquement avec intention (coach, insight, succès…)

## Fichiers clés

```
src/design-system/aura/     — brand, theme, sound
src/components/aura/        — AuraStar, AuraLogo, AuraIllustration
src/styles/aura-tokens.css
src/styles/aura-design-system.css
Docs/AURA_DESIGN_SYSTEM.md
```

## Page marketing

`/about` — Mission, Vision, Valeurs, Pourquoi Aura ?
