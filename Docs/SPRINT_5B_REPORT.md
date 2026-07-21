# Sprint 5B — Rapport EPIC Calendar Synchronization

## Objectif

Livrer le **Synchronization Engine** complet avec connecteur Google réel, sans modifier le Planning Engine ni le Human Model.

## Ce qui a été modifié

### Nouveau module `src/calendarSyncEngine/`

| Composant | Fichier | Rôle |
|-----------|---------|------|
| Types sync | `types/syncTypes.ts` | États, conflits, OAuth, historique |
| Event bus | `events/syncEventBus.ts` | SyncStarted, SyncCompleted, ConflictDetected |
| Offline queue | `sync/offlineQueue.ts` | File localStorage pending/failed |
| Change detector | `sync/changeDetector.ts` | Diff snapshots |
| Conflict detector | `sync/conflictDetector.ts` | Détection + ConflictResolution (sans auto-apply) |
| Sync history | `sync/syncHistory.ts` | Journal localStorage |
| Background scheduler | `sync/backgroundSyncScheduler.ts` | Architecture interval (disabled) |
| Google connector | `connectors/googleCalendarConnector.ts` | OAuth, pull, mutate stub |
| Google provider | `providers/googleCalendarProvider.ts` | Provider Planning Engine via DB |
| Mapper | `mappers/externalEventMapper.ts` | external_calendar_events → CalendarItem |
| OAuth helpers | `oauth/oauthSession.ts` | Session info depuis connexion DB |
| Orchestrateur | `sync/synchronizationEngine.ts` | pull, push, merge, retry, executePlanningCommand |
| API publique | `index.ts` | Exports |

### Câblage

| Fichier | Modification |
|---------|--------------|
| `src/config/featureFlags.ts` | `isCalendarSyncEngineEnabled()` + `VITE_CALENDAR_SYNC_ENGINE` |
| `planningCalendarEngineDependencies.ts` | Google provider réel si flags actifs, sinon stub |
| `actionEngineDependencies.ts` | Planning commands via SynchronizationEngine |
| `executionEngine.ts` | `reorganizePlanningDay` via sync engine |
| `calendarConnector.ts` | Champ optionnel `redirectUrl` |
| `routes.ts` | `CALENDARS_SETTINGS: /settings/calendars` |
| `AppRouter.tsx` | Route CalendarsSettingsPage |
| `ProfilePage.tsx` | Lien vers paramètres calendriers |
| `package.json` | Script `test:calendar-sync-engine` |

### UI

| Fichier | Rôle |
|---------|------|
| `pages/CalendarsSettingsPage.tsx` | Page Paramètres → Calendriers |
| `components/settings/CalendarsSettingsPanel.tsx` | Statut Google, sync, historique, conflits |

### Tests (8 fichiers)

- OAuth, connecteur, change/conflict detectors, offline queue, sync engine, event bus, background scheduler

### Documentation

- `Docs/EPIC5B_CALENDAR_SYNC.md` (architecture, OAuth, conflits, roadmap)

## Pourquoi

Séparer la synchronisation externe du Planning Engine garantit :

1. Une timeline unifiée quel que soit l'origine
2. Extensibilité Outlook / Apple sans toucher au moteur central
3. Résolution de conflits explicite côté utilisateur
4. Action Engine ne parle jamais directement à Google

## Migrations

Aucune nouvelle migration — réutilise `00008_google_calendar.sql`.

## Points de test manuel

1. Activer `VITE_GOOGLE_CALENDAR_ENABLED=true`, `VITE_PLANNING_CALENDAR_ENGINE=true`, `VITE_CALENDAR_SYNC_ENGINE=true`
2. Aller sur `/settings/calendars`
3. Connecter Google → vérifier redirect OAuth
4. Synchroniser → vérifier événements dans timeline `/planning-engine`
5. Vérifier historique sync et état connecté
6. Déconnecter → état « Non connecté »

## Limites connues

- Push Google réel bloqué par scope `calendar.readonly`
- Résolution conflit : preview seulement, pas d'application du choix
- Background sync : architecture, non activée en prod
- Guardian : exécuter après validation flags

## Fichiers impactés (résumé)

```
src/calendarSyncEngine/**          (nouveau)
src/config/featureFlags.ts
src/planningCalendarEngine/engine/planningCalendarEngineDependencies.ts
src/planningCalendarEngine/contract/calendarConnector.ts
src/ai/actionEngine/execution/actionEngineDependencies.ts
src/ai/actionEngine/execution/executionEngine.ts
src/ai/actionEngine/testing/actionEngineTestUtils.ts
src/pages/CalendarsSettingsPage.tsx
src/components/settings/CalendarsSettingsPanel.tsx
src/pages/ProfilePage.tsx
src/app/router/AppRouter.tsx
src/lib/navigation/routes.ts
package.json
Docs/EPIC5B_CALENDAR_SYNC.md
Docs/SPRINT_5B_REPORT.md
```

## Statut

- Code : livré
- Tests unitaires : livrés (`npm run test:calendar-sync-engine`)
- Build / Guardian : à valider par l'utilisateur
- Commit / merge / deploy : **non effectués** (attente validation)
