# Changelog

## [Unreleased]

### Ajouté

- Moteur proactif v1 (`src/lib/proactiveEngine/`) : Score Équilibre, détection surcharge, reports répétés, insights priorisés
- Service d’agrégation `proactiveAnalysisService.ts`
- Carte Home « Score Équilibre / Conseil du jour »
- Tests unitaires Vitest et scénario E2E Playwright dédié
- Documentation `docs/PROACTIVE_ENGINE_V1.md`

## [1.0.0] - 2026-07-17

### Ajouté

- Infrastructure Playwright E2E
- Tests de connexion et mot de passe oublié
- Tests Home, Planning et Sidebar
- Tests complets du player sportif
- Tests de déconnexion et protection des routes privées
- Persistance des préférences de sidebar
- Documentation des migrations importantes
- GitHub Actions CI (qualité + E2E)

### Corrigé

- Erreurs HTTP 400 liées à user_home_preferences
- Persistance de la sidebar après rechargement
- Déconnexion locale Supabase et requêtes post-logout
- Finalisation des séances sportives
- Fermeture immédiate du player pendant la replanification
- Gestion des séances sport manuelles
- Gestion des événements sportifs orphelins
- Contrainte calendar_items_check dans les scénarios E2E
- Sélecteurs Playwright devenus obsolètes
- Déterminisme des tests unitaires sensibles au fuseau horaire

### Base de données

- Migration 00017 : ajout de `evening_planning_mode` et `sport_settings`
- Migration 00018 : policy DELETE `task_activity_events_delete_own`

### Validation

- Tests unitaires : 809/809 (après correction du déterminisme timezone)
- E2E local : 17/17
- E2E production : 17/17
- Build Netlify validé
- Aucune erreur console ou réseau inattendue lors du run final E2E production
