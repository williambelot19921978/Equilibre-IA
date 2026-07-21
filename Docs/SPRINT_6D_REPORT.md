# Sprint 6D — Rapport EPIC Personal Coach Engine

## Objectif

Créer le moteur de coaching intelligent : accompagner, suggérer, encourager — **jamais d'ordres ni d'actions automatiques**.

## Ce qui a été livré

### Module `src/personalCoachEngine/`

| Composant | Fichier | Rôle |
|-----------|---------|------|
| Types | `types/personalCoachTypes.ts` | Domaines, priorité, conseils, sessions |
| Store | `store/coachStore.ts` | Priorité vie, dismiss, succès vus, sessions |
| Domaines | `domains/coachingDomainEngine.ts` | 7 domaines indépendants |
| Opportunités | `opportunity/opportunityEngine.ts` | « C'est un bon moment pour… » |
| Récupération | `recovery/recoveryEngine.ts` | Fatigue, surcharge, allègement |
| Réussites | `success/successEngine.ts` | Félicitations non répétitives |
| Session | `session/coachingSessionEngine.ts` | 30s–2min, facultative |
| Hebdo | `weekly/weeklyReviewEngine.ts` | Revue ~1 min |
| Mensuel | `monthly/monthlyReflectionEngine.ts` | Réflexion non culpabilisante |
| Phrasing | `phrasing/coachPhrasing.ts` | Ton conversation |
| Orchestrateur | `engine/personalCoachEngine.ts` | `analyze()` read-only |
| Diagnostics | `diagnostics/buildPersonalCoachDiagnostics.ts` | UI |

### Câblage

| Fichier | Modification |
|---------|--------------|
| `featureFlags.ts` | `VITE_PERSONAL_COACH_ENGINE` |
| `assistantContext.ts` | `AssistantPersonalCoachSnapshot` |
| `contextEngine.ts` | Bloc coach post-proactive |
| `responseBuilder.ts` | Hint coach dans réponse |
| `planningCalendarTestUtils.ts` | `DISABLED_PERSONAL_COACH` |
| `routes.ts`, `AppRouter`, `appNavigationItems` | `/organization/personal-coach` |

### UI

- `pages/PersonalCoachPage.tsx` — 7 sections + priorité + explainability

### Tests (10 fichiers)

Engine, Opportunity, Recovery, Success, Weekly, Monthly, Session, LifePriority, Conversation.

Script : `npm run test:personal-coach-engine`

### Documentation

- `Docs/EPIC6D_PERSONAL_COACH.md`

## Principes respectés

1. Coach **n'ordonne jamais** — suggestions uniquement
2. **Aucune action automatique**
3. Explainability complète sur chaque conseil
4. Ton adapté à l'état du jour (via DailyState)
5. Réussites valorisées sans répétition
6. Revues hebdo/mensuelles **non culpabilisantes**

## Activation

```env
VITE_PERSONAL_COACH_ENGINE=true
VITE_DAILY_STATE_ENGINE=true
```

## Points de test manuel

1. Activer les flags, ouvrir `/organization/personal-coach`
2. Changer la priorité actuelle → conseils adaptés
3. Vérifier sections Aujourd'hui, Opportunités, Récupération, Réussites
4. « Pas maintenant » sur un conseil → dismiss persisté
5. Conversation — hint coach si récupération active
6. Week-end → revue hebdomadaire visible

## Limites connues

- Page diagnostics enrichit l'input coach pour la démo UI
- Legacy `proactiveCoachEngine.ts` conservé (banner accueil non migré)
- Sessions proposées une fois par type/jour (localStorage)

## Qualité

- `npm run test:personal-coach-engine` — **23/23**
- `npm test` — **1372/1372**
- `npm run build` — OK
