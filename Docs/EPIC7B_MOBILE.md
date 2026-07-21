# EPIC 7B — Mobile Native, Notifications & Reliability

## Objectif

Application mobile premium : stabilité, rapidité, offline, notifications — **sans nouveau moteur IA**.

## Architecture

```
mobileReliability/
├── connectivity/     — online / offline / degraded
├── offline/          — mutation queue (localStorage)
├── sync/             — drain queue + status
├── recovery/         — retry exponentiel
├── notifications/    — prefs + engine + bridge proactive
├── security/         — secureSignOut, session validation
├── crash/            — CrashReporter, LogEngine, AnalyticsBridge
└── pwa/              — update helpers
```

## PWA

| Élément | Fichier |
|---------|---------|
| Plugin | `vite-plugin-pwa` dans `vite.config.ts` |
| Manifest | `public/manifest.webmanifest` |
| SW | auto-généré (Workbox) |
| Update | `registerSW` dans `main.tsx` |
| Install prompt | `PwaInstallPrompt.tsx` |

Stratégie cache :
- App shell : precache assets statiques
- Supabase API : NetworkFirst (timeout 8s)

## Capacitor (Android / iOS)

Config : `capacitor.config.json` — **sans casser le web**.

```bash
npm run build
npx cap add android   # ou ios — une fois Capacitor CLI installé
npm run cap:sync
npm run cap:open:android
```

La version web reste la source de vérité (`webDir: dist`).

## Notifications

Canaux : Coach, Check-in, Planning, Objectifs, Digest.

**Source unique** : Proactive Engine via `NotificationDispatcher.setDispatchListener`.

Règles avant envoi :
- Préférences utilisateur (tout / important / silencieux / aucune)
- Heures calmes
- Max 3 / jour
- Canal activé

Page réglages : `/settings/notifications`

## Offline

- `enqueueOfflineMutation()` — file d'attente par utilisateur
- `SyncEngine.syncNow()` — drain à la reconnexion
- `OfflineBanner` — bannière hors ligne
- `SyncStatusIndicator` — Synchronisé / En attente / Hors ligne

## Error recovery

`withRetry()` — backoff exponentiel (4 tentatives max).

Auto-sync au retour `online` via `startAutoSync()`.

## Sécurité

- Tokens : Supabase JS default (localStorage `sb-*-auth-token`)
- Logout : `secureSignOut()` — purge queue + inbox + prefixes locaux
- Session : `validateSessionFreshness()`

## Crash reporting (architecture)

| Module | Rôle |
|--------|------|
| `CrashReporter` | Capture errors + unhandledrejection |
| `LogEngine` | Logs in-memory (500 max) |
| `AnalyticsBridge` | Stub events — no external SDK |

## Mobile UX

CSS : `sprint53-mobile-reliability.css`

- Safe areas (`env(safe-area-inset-*)`)
- Bottom nav padding
- Touch targets 44px
- Keyboard scroll-margin
- Landscape adjustments

Breakpoints testés : 320, 360, 375, 390, 414, 430, 768, 1024 px.

## Accessibilité mobile

- `aria-live` sur sync / offline
- `sr-only` labels
- VoiceOver / TalkBack : boutons nommés, rôles dialog sur panels

## Tests

| Commande | Scope |
|----------|-------|
| `npm run test:mobile-reliability` | Unit mobile |
| `tests/e2e/mobile-reliability/` | E2E manifest, settings |

## Roadmap stores

1. **PWA** — icônes PNG maskable dédiées
2. **Capacitor** — `@capacitor/push-notifications`, `@capacitor/preferences`
3. **Offline** — handlers sync pour tasks/goals/check-in
4. **Analytics** — brancher Sentry / PostHog via `AnalyticsBridge`
5. **App Store** — builds signés Android/iOS
