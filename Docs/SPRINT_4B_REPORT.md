# Sprint 4B — Rapport d'avancement (Human Model Engine)

**Date :** 2026-07-20  
**Statut :** Livré — en attente de validation (pas de commit / merge / deploy)

## Objectif

Créer le **Human Model Engine** — seule source d'interprétation de l'état utilisateur — et l'intégrer au Conversation Engine + UI « Mon Profil IA ».

## Ce qui a été modifié

### Nouveau module `src/ai/humanModelFoundation/`

- Contrat `HumanModel` enrichi (énergie, stress, charge, motivation, disponibilité, focus, sommeil, pression familiale, objectif / préoccupation dominants)
- **11 règles** isolées avec entrée, calcul, explication, confiance
- `HumanModelEngine.buildFromContext()` / `buildHumanModel()`
- Agrégation `missingData` + confiance globale

### Intégration Conversation Engine

- `processMessage` produit désormais `humanModel` en plus de `context`
- `responseBuilder` : intentions `fatigue`, `motivation`, `organization`, `planning`, `family` utilisent **HumanModel**
- `promptBuilder` : bloc `humanModelBlock` + consigne système anti-recalcul
- `buildExplanation` : raisons Human Model dans `humanModelReasons`

### UI

- Page `AiProfilePage` — route `/ai-profile`
- Composants `HumanModelFieldCard`, `HumanModelWhyModal`
- Hook `useHumanModel`
- Styles `sprint4b-human-model.css`
- Navigation Organisation → **Mon Profil IA**

### Configuration

- Feature flag `VITE_HUMAN_MODEL` (défaut **false**)
- `AppRoutes.AI_PROFILE`, router, titres

## Fichiers impactés (principaux)

| Zone | Fichiers |
|------|----------|
| Moteur | `src/ai/humanModelFoundation/**` |
| Conversation | `conversationEngine.ts`, `responseBuilder.ts`, `promptBuilder.ts`, `buildExplanation.ts`, `responseContract.ts` |
| UI | `AiProfilePage.tsx`, `components/humanModel/*`, `useHumanModel.ts` |
| Nav / routes | `routes.ts`, `appNavigationItems.ts`, `AppRouter.tsx`, `featureFlags.ts` |
| Styles | `sprint4b-human-model.css`, `index.css` |
| Tests | 4 fichiers de tests EPIC 4B + mises à jour EPIC 4A |
| Docs | `Docs/EPIC4B_HUMAN_MODEL.md`, ce rapport |

## Migrations

Aucune migration Supabase.

## Points de test manuel

1. `VITE_HUMAN_MODEL=true` → menu **Mon Profil IA** visible
2. Ouvrir `/ai-profile` → cartes état + confiance + « Pourquoi ? »
3. `VITE_ASSISTANT_IA=true` → message « Je suis fatigué » → réponse cite niveau d'énergie Human Model
4. Sans check-in → champs null + section « Ce qui manque à l'IA »

## Vérifications automatisées

- `npm test`
- `npm run lint`
- `npm run build`

## Limites connues

- Pas de persistance snapshot (calcul à la volée depuis Context Engine)
- `applyCorrection` / `BehaviorSignal` non implémentés (prévus contrat architecture)
- Règles heuristiques simples — pas de ML
- Flag désactivé par défaut → Guardian E2E inchangé

## Prochaines étapes suggérées (hors scope)

- Persistance HumanModel + corrections utilisateur
- Brancher LLM sur `humanModelBlock`
- Enrichir règles avec living memory / habitudes
