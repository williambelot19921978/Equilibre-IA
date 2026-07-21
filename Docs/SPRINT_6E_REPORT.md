# Sprint 6E — Rapport EPIC Life Knowledge Engine

## Objectif

Centraliser durablement ce que l'IA sait sur l'utilisateur — transparent, explicable, modifiable, jamais caché.

## Ce qui a été livré

### Module `src/lifeKnowledgeEngine/`

| Composant | Fichier | Rôle |
|-----------|---------|------|
| Types | `types/lifeKnowledgeTypes.ts` | Items, confirmations, timeline, catégories |
| Store | `store/knowledgeStore.ts` | Oublier, modifier, confirmations, timeline |
| Merge | `merge/knowledgeMergeEngine.ts` | Profile facts + living + prefs + goals |
| Confidence | `confidence/knowledgeConfidenceEngine.ts` | Score, labels, moyennes |
| Confirmation | `confirmation/confirmationEngine.ts` | Propositions — jamais auto-valide |
| Timeline | `timeline/lifeTimelineEngine.ts` | Changements de vie |
| Forget | `forget/forgetEngine.ts` | Oublier / modifier / reset |
| Guards | `guards/knowledgeGuards.ts` | Filtres coach vs conversation |
| Phrasing | `phrasing/knowledgePhrasing.ts` | « Comme tu préfères généralement… » |
| Orchestrateur | `engine/lifeKnowledgeEngine.ts` | `analyze()` read-only |

### Câblage

| Fichier | Modification |
|---------|--------------|
| `featureFlags.ts` | `VITE_LIFE_KNOWLEDGE_ENGINE` |
| `assistantContext.ts` | `AssistantLifeKnowledgeSnapshot` |
| `contextEngine.ts` | Bloc lifeKnowledge avant personalCoach |
| `responseBuilder.ts` | Hint knowledge confirmé |
| Personal Coach input | `confirmedKnowledge` depuis life knowledge |
| `planningCalendarTestUtils.ts` | `DISABLED_LIFE_KNOWLEDGE` |
| Routes, AppRouter, nav | `/organization/life-knowledge` |

### UI

- `pages/LifeKnowledgePage.tsx` — Knowledge Explorer avec confirmations, modifier, supprimer

### Tests (8 fichiers)

Engine, Confirmation, Forget, Timeline, Confidence, Conversation.

Script : `npm run test:life-knowledge-engine`

### Documentation

- `Docs/EPIC6E_LIFE_KNOWLEDGE.md`

## Principes respectés

1. **Aucune donnée cachée** — sources explicites
2. **Contrôle utilisateur** — modifier, supprimer, jamais
3. **Pas de validation automatique** — confirmation obligatoire pour observed
4. Conversation : **confirmé uniquement**
5. Coach : **confirmé ou haute confiance**

## Activation

```env
VITE_LIFE_KNOWLEDGE_ENGINE=true
```

Recommandé avec `VITE_DAILY_STATE_ENGINE`, `VITE_ADAPTIVE_INTELLIGENCE`, `VITE_PERSONAL_COACH_ENGINE`.

## Points de test manuel

1. Activer le flag, ouvrir `/organization/life-knowledge`
2. Vérifier sections par catégorie + meta (source, confiance, date)
3. Confirmer / rejeter une observation proposée
4. Modifier ou supprimer une connaissance
5. Conversation — hint « Comme tu préfères… » si pref confirmée

## Limites connues

- Overrides/oublis en localStorage (profile_facts Supabase inchangé)
- Page explorer vide sans profile facts / living memory chargés
- `MyAiPage` coexistence — fusion future possible

## Qualité

| Vérification | Résultat |
|--------------|----------|
| `npm run test:life-knowledge-engine` | 15/15 |
| `npm test` | 1387/1387 |
| `npm run build` | OK |

Correction build : typage explicite `readJson<LifeTimelineEvent[]>` dans `knowledgeStore.ts`.
