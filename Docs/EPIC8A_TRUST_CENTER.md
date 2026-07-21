# EPIC 8A — Trust Center

Centre de confiance et confidentialité Aura.

## Objectif

Donner à l'utilisateur une **maîtrise totale** de ses données : comprendre, modifier, exporter, supprimer — sans jargon technique.

## Architecture

```
src/trustCenter/
  types.ts                    — Types partagés, FAQ
  privacyPreferencesStore.ts  — Préférences confidentialité (localStorage)
  trustDashboardService.ts    — Agrégation tableau de bord
  dataExportService.ts        — Export JSON / CSV / PDF résumé
  dataDeletionService.ts      — Suppression granulaire
  securityStatusService.ts    — Session & déconnexion globale
  feedbackStore.ts            — Retours bêta (localStorage)
  index.ts

src/components/trust/
  TrustDashboard.tsx
  PrivacyPreferencesPanel.tsx
  DataExportPanel.tsx
  DataDeletionPanel.tsx
  SecurityPanel.tsx
  TrustFaq.tsx
  WhyRecommendationButton.tsx
  BetaFeedbackWidget.tsx

src/pages/
  TrustCenterPage.tsx         — /settings/trust
  HowAuraWorksPage.tsx        — /settings/trust/how-aura-works
```

## Routes

| Route | Page |
|-------|------|
| `/settings/trust` | Confiance & Confidentialité (hub) |
| `/settings/trust/how-aura-works` | Comment Aura fonctionne |
| `/organization/life-knowledge` | Ce qu'Aura sait de moi (enrichi) |

Lien depuis **Paramètres → Confiance & Confidentialité**.

## Tableau de bord

Métriques agrégées (lecture seule) :

- Catégories de données actives (selon préférences)
- Dernier check-in (`dailyStateStore`)
- Dernière sync (`syncStatusStore`)
- Connaissances mémorisées (`lifeKnowledgeEngine`)
- Recommandations générées (inbox + observations)
- Dernière sauvegarde (proxy sync / check-in)

## Confidentialité

Préférences `aura-privacy-prefs-{userId}` :

| Clé | Libellé |
|-----|---------|
| `useHistory` | Utiliser mon historique |
| `learnHabits` | Apprendre de mes habitudes |
| `useCheckins` | Utiliser mes check-ins |
| `personalizedAdvice` | Recevoir des conseils personnalisés |

Modifiables à tout moment — stockage local, pas de moteur IA.

## Export

`buildUserDataExport()` inclut :

- Profil (métadonnées)
- Objectifs (`goalsStorage`)
- Check-ins (`dailyStateStore`)
- Habitudes (observations + préférences adaptatives)
- Préférences (privacy, check-in, notifications)
- Mémoire Aura (diagnostics + overrides + timeline)

Formats : **JSON**, **CSV**, **PDF résumé** (fichier texte).

## Suppression

Scopes avec double confirmation (texte `CONFIRMER-{SCOPE}` + `window.confirm`) :

- `habits` — observations, préférences apprises
- `checkins` — historique local
- `goals` — objectifs locaux
- `auraMemory` — mémoire life knowledge
- `all` — tout le local + préférences privacy

## Sécurité

- Dernière connexion (`user.last_sign_in_at`)
- Appareil actuel (user agent)
- Session active / expiration
- Déconnexion locale (`secureSignOut`)
- Déconnexion globale (`supabase.auth.signOut({ scope: 'global' })`)

## « Pourquoi ? »

Composant `WhyRecommendationButton` :

- Données utilisées
- Raisons
- Objectif concerné
- Confiance
- Possibilité d'ignorer

Branché sur : **Coach personnel**, **GoalNextActionCard** (prop optionnelle). Daily Brief conserve son pattern existant.

## Bêta feedback

`BetaFeedbackWidget` — header app (compact) + Trust Center :

- Donner mon avis
- Signaler un problème
- Proposer une idée
- Noter une recommandation

Stockage local `aura-feedback-{userId}` — architecture prête pour backend futur.

## FAQ

5 questions intégrées dans Trust Center (`FAQ_ITEMS`).

## Roadmap RGPD

| Exigence | Statut EPIC 8A |
|----------|----------------|
| Transparence | ✅ Trust Center + How Aura Works |
| Accès | ✅ Export JSON/CSV |
| Rectification | ✅ Life Knowledge edit |
| Effacement | ✅ Suppression granulaire |
| Portabilité | ✅ Export JSON |
| Limitation | ✅ Préférences privacy |
| Droit d'opposition | ✅ Désactivation conseils / habitudes |
| Compte Supabase | 🔜 Backend admin delete (hors scope) |
| DPA / registre | 🔜 Documentation légale |

## Tests

```bash
npm run test:trust-center
npm test
npm run build
```

## Limites connues

- Export profil Supabase partiel (note dans bundle)
- Préférences privacy non encore lues par les moteurs IA (UX seulement)
- Feedback bêta local uniquement
- « Sessions ouvertes » = appareil courant (pas de liste multi-appareils sans API admin)
