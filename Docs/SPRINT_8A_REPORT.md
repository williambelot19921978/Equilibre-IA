# Sprint 8A — Rapport EPIC Trust, Privacy & User Control

## Objectif

Faire d'Aura une application où l'utilisateur a totalement confiance — confidentialité intégrée à l'expérience, pas cachée dans les paramètres.

## Livrables

### Aura Trust Center (`/settings/trust`)

- Tableau de bord : données du jour, check-in, sync, connaissances, recommandations, sauvegarde
- Préférences confidentialité (4 toggles Oui/Non)
- Export JSON / CSV / PDF résumé
- Suppression granulaire avec double confirmation
- Panneau sécurité (session, déconnexion, déconnexion globale)
- FAQ intégrée
- Widget feedback bêta

### Transparence

- `/settings/trust/how-aura-works` — Comment Aura fonctionne (langage simple)
- `WhyRecommendationButton` — bouton « Pourquoi ? » unifié
- Coach personnel migré vers le composant unifié
- `GoalNextActionCard` — prop `whyDetails` optionnelle

### Ce qu'Aura sait de moi (amélioré)

- Recherche textuelle
- Filtres catégorie / origine
- Dernière modification, confiance, origine, historique
- Actions : Modifier, Ignorer, Supprimer
- Lien vers Trust Center

### Paramètres

- Section renommée **Confiance & Confidentialité**
- Liens : Trust Center, Life Knowledge, How Aura Works

### Module `src/trustCenter/`

Stores et services : privacy, dashboard, export, deletion, security, feedback + 6 tests unitaires.

## Fichiers impactés (principaux)

| Zone | Fichiers |
|------|----------|
| Core | `src/trustCenter/*` |
| UI | `src/components/trust/*`, `TrustCenterPage`, `HowAuraWorksPage`, `LifeKnowledgePage` |
| Wiring | `routes.ts`, `AppRouter`, `lazyPages`, `SettingsPage`, `AppShell`, `PersonalCoachPage`, `GoalNextActionCard` |
| Styles | `src/styles/sprint54-trust-center.css` |
| Docs | `Docs/EPIC8A_TRUST_CENTER.md` |

## Tests

```bash
npm run test:trust-center   # 6 tests
npm test                    # suite complète
npm run build
```

## Points de test manuel

1. `/settings` → Confiance & Confidentialité
2. `/settings/trust` — dashboard, toggles, export, suppression test
3. `/settings/trust/how-aura-works` — contenu transparent
4. `/organization/life-knowledge` — recherche et filtres
5. Coach — bouton « Pourquoi ? » enrichi
6. Header — « Donner mon avis »

## Limites connues

- Préférences privacy : UX + stockage, pas encore consommées par les moteurs IA
- Export profil cloud partiel
- Feedback local sans backend
- Liste multi-appareils non disponible (session courante uniquement)

## Qualité

- Aucun commit, merge ou déploiement
- En attente validation utilisateur

## Statut

**Prêt pour revue.**
