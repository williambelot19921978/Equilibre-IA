# Guide bêta Aura — EPIC 9

Ce document décrit l'installation, la configuration et la validation de la bêta privée Aura.

## Installation

```bash
git clone <repo-url>
cd equilibre-ia-v2
npm install
cp .env.example .env.local   # si présent
npm run dev
```

L'application est servie sur **http://localhost:5173** (port strict, ne pas modifier).

## Configuration

### Variables d'environnement

| Variable | Description | Défaut |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | URL Supabase | requis |
| `VITE_SUPABASE_ANON_KEY` | Clé anonyme Supabase | requis |
| `VITE_AURA_RELEASE_CHANNEL` | Canal : `alpha`, `beta`, `stable` | déduit de la version |
| `VITE_AURA_BETA_MODE` | Active le mode bêta (`false` pour désactiver) | activé si version beta |
| `VITE_AURA_ADMIN_EMAILS` | Emails admin (insights, checklist) | vide |
| `VITE_AURA_INSIGHTS` | Analytics anonymisés | `true` |
| `PLAYWRIGHT_TEST_EMAIL` | E2E — compte test | optionnel |
| `PLAYWRIGHT_TEST_PASSWORD` | E2E — mot de passe | optionnel |

### Version & canal

- Version semver : `1.0.0-beta.1` (package.json + `src/release/version.ts`)
- Canaux : **Alpha**, **Beta**, **Stable**
- Affichage : badge discret dans l'en-tête + section **Paramètres → Bêta & version**

## Déploiement

1. Vérifier les variables Netlify / hébergeur (Supabase, admin, canal)
2. Exécuter la quality gate :

```bash
npm run release-check
npm run release-check:full   # inclut Guardian
```

3. Build de production :

```bash
npm run build
npm run preview
```

4. PWA : vérifier `dist/manifest.webmanifest` et `dist/sw.js`

5. Mobile natif (Capacitor) :

```bash
npm run cap:sync
npm run cap:open:android
npm run cap:open:ios
```

## Checklist de lancement

Accessible dans l'app : **Paramètres → Checklist de lancement** (`/settings/launch-checklist`).

Chaque item possède : état, priorité, responsable, date, commentaire.

Items par défaut :

- Build OK, Tests OK, PWA OK
- Android OK, iOS OK
- Notifications OK
- Trust Center validé, Analytics validés
- Sauvegarde testée, RLS validées
- Performance validée, Accessibilité validée

Progression persistée en localStorage (`aura-launch-checklist-v1`).

## Commandes qualité

| Commande | Rôle |
| --- | --- |
| `npm run lint` | Oxlint |
| `npm test` | Vitest (suite complète) |
| `npm run test:release` | Module release EPIC 9 |
| `npm run build` | Typecheck + Vite build |
| `npm run verify:schema` | Schéma Supabase |
| `npm run verify:supabase` | Connexion Supabase |
| `npm run release-check` | Gate unique (lint, test, tsc, build, PWA) |
| `npm run quality-guardian` | E2E Guardian |

Rapport généré : `reports/RELEASE_CHECK.md`

## Tests E2E critiques

```bash
npm run test:e2e -- e2e/beta/critical-beta.spec.ts
```

Parcours couverts : accueil, paramètres, changelog, Trust Center, notifications, planning, check-in, coach, 404, offline.

## Support bêta

- **Quoi de neuf ?** : Paramètres → Quoi de neuf ?
- **Signaler un bug** : bouton Signaler sur la page d'erreur → Trust Center
- **Feedback** : widget « Donner mon avis » dans l'en-tête
- **Trust Center** : export, suppression, préférences confidentialité

## Fichiers clés

| Fichier | Rôle |
| --- | --- |
| `src/release/` | Version, mode bêta, checklist, changelog |
| `src/pages/WhatsNewPage.tsx` | Changelog utilisateur |
| `src/pages/LaunchChecklistPage.tsx` | Checklist centralisée |
| `src/components/errors/AppErrorFallback.tsx` | Page d'erreur Aura |
| `scripts/release-check.mjs` | Quality gate EPIC 9 |
| `Docs/SPRINT_9_REPORT.md` | Rapport de sprint |

## Limites connues

- Checklist et changelog v1 : stockage local (pas de sync équipe backend)
- Guardian non inclus par défaut dans `release-check` (option `--with-guardian`)
- E2E critiques nécessitent un compte test configuré
