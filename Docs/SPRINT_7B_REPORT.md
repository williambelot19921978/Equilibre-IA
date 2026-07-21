# Sprint 7B — Rapport EPIC Mobile Native, Notifications & Reliability

## Objectif

Expérience mobile premium : PWA, offline, notifications, sync, robustesse — sans nouveau moteur IA.

## Livrables

### Module `src/mobileReliability/`

| Composant | Rôle |
|-----------|------|
| ConnectivityEngine | Détection online/offline/degraded |
| offlineMutationQueue | File mutations différées |
| SyncEngine | Drain + auto-sync reconnexion |
| ErrorRecoveryEngine | Retry exponentiel |
| NotificationEngine | Livraison avec règles (max 3/j, quiet hours) |
| notificationPreferencesStore | Tout / important / silencieux / aucune |
| proactiveNotificationBridge | Proactive Dispatcher → inbox |
| sessionSecurity | secureSignOut, validateSession |
| CrashReporter / LogEngine / AnalyticsBridge | Architecture crash |

### UI

- `SyncStatusIndicator`, `OfflineBanner`, `NotificationBell`, `PwaInstallPrompt`
- `NotificationSettingsPage` — `/settings/notifications`
- `MobileReliabilityProvider` — wiring global

### PWA

- `vite-plugin-pwa`, manifest, Workbox, `registerSW`

### Capacitor

- `capacitor.config.json` + scripts npm (`cap:sync`, `cap:open:*`)

### Mobile CSS

- `sprint53-mobile-reliability.css` — safe areas, touch, keyboard

### Câblage

- `AppShell` — cloche + sync
- `AuthenticatedAppLayout` — offline banner, PWA prompt, provider
- `AuthProvider.signOut` → `secureSignOut`
- `NotificationDispatcher.setDispatchListener` (hook 7B, pas de logique IA)

## Tests

- Unit : `npm run test:mobile-reliability`
- E2E : `tests/e2e/mobile-reliability/mobile-offline.spec.ts`

## Points de test manuel

1. DevTools → offline → bannière + statut « Hors ligne »
2. Reconnexion → sync reprend
3. `/settings/notifications` → niveaux + canaux + horaires
4. Cloche header → inbox
5. Lighthouse PWA audit
6. `npm run build` → vérifier SW généré dans dist

## Limites connues

- Handlers sync offline pour tasks/goals — architecture prête, handlers à brancher
- Push natif Capacitor — config préparée, packages non installés
- Icônes PWA SVG — PNG maskable recommandés pour stores
- E2E mobile skip sans `GUARDIAN_E2E`

## Qualité

| Vérification | Résultat |
|--------------|----------|
| `npm run test:mobile-reliability` | 5/5 |
| `npm test` | 1397/1397 |
| `npm run build` | OK + PWA SW (138 precache entries) |
