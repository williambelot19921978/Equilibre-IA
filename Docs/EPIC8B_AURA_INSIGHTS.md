# EPIC 8B — Aura Insights & Beta Analytics

Analytics anonymisés pour la bêta privée Aura.

## Principes

1. **Aucun contenu personnel** — seules des métriques d'usage (types, domaines, durées)
2. **Respect du Trust Center** — pref `shareAnalytics` (désactivable)
3. **Mode local** — stockage `localStorage`, backend branchable via adapter
4. **Admin only** — dashboard visible si e-mail dans `VITE_AURA_ADMIN_EMAILS`

## Architecture

```
src/auraInsights/
  types.ts                 — événements & snapshots
  anonymize.ts             — anonymousId + sanitizeMeta
  privacyGate.ts           — vérifie shareAnalytics
  eventStore.ts            — persistance locale + adapter backend
  aggregatesService.ts     — funnel, health dashboard
  performanceMonitor.ts    — perf marks
  errorMonitor.ts          — JS errors, offline, sync
  adminAccess.ts           — isAuraAdmin, isAuraInsightsEnabled
  AuraInsightsProvider.tsx — session + app_open + errors
  index.ts
```

## Événements

| Type | Déclencheur |
|------|-------------|
| `account_created` | Inscription |
| `onboarding_completed` | Fin discovery/onboarding |
| `checkin_enabled` / `checkin_disabled` | Paramètres |
| `checkin_skipped` | Skip check-in |
| `checkin_completed` | Soumission check-in |
| `app_opened` | Session utilisateur |
| `coach_opened` | Page coach |
| `advice_shown` / `accepted` / `ignored` / `deferred` | Coach & proactive |
| `goal_created` | Création objectif |
| `data_exported` / `data_deleted` | Trust Center |
| `notification_sent` | Moteur notifications |
| `session_started` / `session_ended` | Provider |
| `js_error` / `offline_detected` / `sync_failed` | Monitors |
| `perf_mark` | Performance |

Meta autorisée : `domain`, `mode`, `scope`, `format`, `feature`, `durationMs`, `mark`, `channel` — **jamais** de texte libre.

## Entonnoir bêta

1. Compte créé
2. Onboarding terminé
3. Premier check-in
4. Premier objectif
5. Premier conseil accepté
6. Utilisateur actif (≥ 2 ouvertures / 7 jours)

## Admin — Aura Health Dashboard

Route : `/admin/insights`  
Accès : `VITE_AURA_ADMIN_EMAILS=admin@example.com`

Sections :

- **Adoption** — actifs, funnel, top features
- **Coach** — qualité par domaine (sport, famille, bien-être, études, objectifs)
- **Check-in** — complétés, ignorés, modes
- **Notifications** — envoyées, ouvertes, ignorées
- **Performance** — temps app, navigation, onboarding
- **Erreurs** — JS, timeout, offline, sync

Lien admin aussi dans **Paramètres** (si admin).

## Privacy

Préférence Trust Center :

- **Partager des métriques d'usage anonymes** (`shareAnalytics`)
- Si `false` → `trackInsightEvent` retourne `null`, rien n'est stocké

## Mode local & backend futur

```typescript
import { setInsightsBackendAdapter } from "./auraInsights";

setInsightsBackendAdapter({
  async send(events) {
    await fetch("/api/insights", { method: "POST", body: JSON.stringify(events) });
  },
});
```

Stockage local : clé `aura-insights-events-v1` (max 8000 événements).

## Variables d'environnement

| Variable | Usage |
|----------|--------|
| `VITE_AURA_ADMIN_EMAILS` | Liste e-mails admin (virgules) |
| `VITE_AURA_INSIGHTS` | `true`/`false` — activer module |
| `VITE_AURA_INSIGHTS_SALT` | Salt optionnel pour anonymousId |

## Roadmap analytics

| Phase | Statut |
|-------|--------|
| Collecte locale anonyme | ✅ EPIC 8B |
| Dashboard admin local | ✅ EPIC 8B |
| Backend agrégation multi-utilisateurs | 🔜 |
| Export analytics admin | 🔜 |
| Intégration PostHog/Plausible self-hosted | 🔜 |

## Tests

```bash
npm run test:aura-insights
npm test
npm run build
```
