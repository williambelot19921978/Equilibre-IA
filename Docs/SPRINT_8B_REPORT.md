# Sprint 8B — Rapport EPIC Aura Insights & Beta Analytics

## Objectif

Préparer Aura pour une bêta privée avec métriques d'usage **anonymisées**, dashboard admin, entonnoir adoption — sans backend, en respectant le Trust Center.

## Livrables

### Module `src/auraInsights/`

- Collecte anonyme (`anonymousId`, `sanitizeMeta`)
- Store local + adapter backend branchable
- Privacy gate (`shareAnalytics` via Trust Center)
- Agrégats : funnel, coach quality, notifications, check-in, perf, errors
- Provider global (session, app_open, error monitor)
- Performance & error monitors

### Préférence Trust Center

- Nouveau toggle **Partager des métriques d'usage anonymes** (`shareAnalytics`, défaut `true`, désactivable)

### Événements branchés

Inscription, onboarding, check-in (complete/skip/enable/disable), coach, proactive, objectifs, export/suppression, notifications, sessions, perf, erreurs.

### Admin UI — `/admin/insights`

Sections : Adoption, Coach, Check-in, Notifications, Performance, Erreurs.

Accès : `VITE_AURA_ADMIN_EMAILS` + lien Paramètres (admins).

## Fichiers impactés (principaux)

| Zone | Fichiers |
|------|----------|
| Core | `src/auraInsights/*` |
| UI | `AuraInsightsAdminPage`, `sprint55-aura-insights.css` |
| Routes | `ADMIN_INSIGHTS`, `AdminRoute`, `AppRouter` |
| Privacy | `trustCenter/types`, `privacyPreferencesStore` |
| Wiring | Signup, onboarding, coach, proactive, goals, dailyState, export/delete, notifications, Settings |
| Provider | `AppProviders` |

## Tests

```bash
npm run test:aura-insights   # 7 tests
npm test                     # suite complète
npm run build
```

## Configuration bêta

```env
VITE_AURA_ADMIN_EMAILS=votre@email.com
VITE_AURA_INSIGHTS=true
```

## Points de test manuel

1. Trust Center → désactiver analytics → vérifier aucun nouvel événement
2. Parcours signup/onboarding/check-in → admin dashboard funnel
3. Coach accept/ignore → section Coach
4. `/admin/insights` accessible admin uniquement

## Limites connues

- Agrégats **locaux au navigateur** (multi-utilisateurs nécessite backend)
- `goal_completed` non branché (pas de hook central identifié)
- Notification opened/dismissed partiellement branchés
- Admin liste = e-mails env statiques

## Qualité

- Aucun commit, merge ou déploiement
- En attente validation utilisateur

## Statut

**Prêt pour revue.**
