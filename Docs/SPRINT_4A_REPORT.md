# Sprint 4A — Rapport d'avancement

> **Date :** 20 juillet 2026  
> **EPIC :** 4A — Conversation Engine Foundation  
> **Statut :** Livré — en attente validation  
> **Aucun commit, merge ou déploiement**

---

## Objectif

Poser les fondations d'un assistant conversationnel personnel, en **mode lecture seule**, sans dupliquer les moteurs métier existants.

---

## Livrables

| Livrable | Statut |
|----------|--------|
| Context Engine (services uniquement) | ✅ |
| Conversation Engine indépendant de l'UI | ✅ |
| Intent Router extensible | ✅ |
| Contrat de réponse unifié | ✅ |
| Action placeholders (not implemented) | ✅ |
| Page Assistant IA + composants | ✅ |
| Architecture historique (active / archives / summary) | ✅ |
| Explainable AI (sources + missingData) | ✅ |
| Tests unitaires | ✅ |
| Documentation `Docs/EPIC4_CONVERSATION_ENGINE.md` | ✅ |

---

## Fichiers créés / modifiés

### Nouveau module `src/ai/conversationFoundation/`

- `types/` — contexte, réponse, intents, historique, actions
- `context/contextEngine.ts` + dependencies injectables
- `intent/intentRouter.ts` — registre extensible
- `conversation/conversationEngine.ts` — orchestrateur read-only
- `conversation/promptBuilder.ts` — prompt structuré (sans appel LLM)
- `conversation/responseBuilder.ts` — réponses déterministes
- `conversation/historyManager.ts` — persistance localStorage
- `explainability/buildExplanation.ts`
- `index.ts` — API publique
- Tests unitaires (5 fichiers)

### UI

- `src/pages/AssistantPage.tsx`
- `src/components/assistant/*`
- `src/hooks/useAssistantConversation.ts`
- `src/styles/sprint4a-assistant.css`

### Intégration

- `src/config/featureFlags.ts` — `VITE_ASSISTANT_IA` (default: false)
- `src/lib/navigation/routes.ts` — route `/assistant`
- `src/lib/navigation/appNavigationItems.ts` — entrée menu (flag-gated)
- `src/app/router/AppRouter.tsx` — route protégée
- `src/index.css` — import styles assistant

---

## Principes respectés

- **Aucun moteur métier réécrit** — planning, goals, brief, foyer inchangés
- **Aucun hack Supabase** dans le Context Engine
- **Aucune action automatique** — `readOnly: true`, placeholders only
- **Guardian non impacté** — feature flag désactivé par défaut

---

## Activation

```env
VITE_ASSISTANT_IA=true
```

Navigation : Organisation → Assistant IA, ou `/assistant`.

---

## Limites connues (4A)

- Pas d'appel modèle LLM — réponses template basées sur intent + contexte
- Historique localStorage uniquement (pas Supabase)
- Archives / suppression avancée : architecture seulement
- Legacy NLP (`src/ai/nlp/conversationEngine.ts`) coexistence — migration progressive EPIC 4B

---

## Vérifications

- `npm test`
- `npm run lint`
- `npm run build`

---

## Prochaine étape suggérée (hors 4A)

EPIC 4B — Action Engine exécutable avec confirmation utilisateur et branchement LLM sur le prompt préparé.
