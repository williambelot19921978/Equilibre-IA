# AI Core — Language Memory v1

Deux couches complémentaires sur la branche `feature/ai-core-language-memory-v1` :

| Section | Nom | Rôle |
|---------|-----|------|
| **A** | Context Enrichment V1 | Enrichir les réponses avec mémoire déclarative + comportementale existante |
| **B** | Personal Language Learning V1 | Apprendre les expressions familières propres à chaque utilisateur |

---

## A. Context Enrichment V1 (réalisé)

### Rôle

Fournir un contexte mémoire unique (`LanguageMemoryContext`) injecté dans le pipeline conversationnel, sans appel LLM externe.

### Architecture

```
src/ai/core/
  buildLanguageMemoryContext.ts   ← fusion pure
  aggregateBehaviorSignals.ts     ← signaux depuis task_activity_events
  selectLanguageMemoryHints.ts    ← max 3 hints priorisés
  enrichAssistantWithMemory.ts    ← enrichissement réponses NLP

src/ai/behaviorEngine.ts          ← point d’entrée ROADMAP (réexport v1)
src/services/languageMemoryService.ts
```

### Intégration

- `ConversationProvider` charge `loadLanguageMemoryContext()` à chaque message.
- `NlpRuntimeContext.languageMemory` transporte le snapshot.
- `conversationEngine` enrichit les réponses pour : `ask_question`, `request_suggestion`, `unknown`, `declare_fatigue`.

### Données fusionnées

| Source | Contenu |
|--------|---------|
| `memoryEngine` / `profile_facts` | Horaires, priorités, discovery |
| `livingMemoryEngine` | Insights, mission, niveau de connaissance |
| `task_activity_events` | Taux skip/complétion (30 j) |

### Limites A

- Pas de table `behavioral_signals` (agrégation directe des events).
- Enrichissement limité aux intents conversationnels.
- Pas de stockage verbatim des échanges.

---

## B. Personal Language Learning V1 (cette passe)

### Objectif

Comprendre progressivement le langage personnel de chaque utilisateur, avec confirmation conversationnelle et persistance isolée par compte.

**Exemple cible**

1. William : « Je suis sec aujourd’hui. »
2. Assistant : « Je pense que tu veux dire que tu es fatigué. Est-ce bien cela ? »
3. William : « oui »
4. Le système retient : pour William, « je suis sec » → fatigue
5. Cette connaissance n’est jamais appliquée à un autre utilisateur.

### Architecture

```
src/ai/languageMemory/
  types.ts                          ← modèle de domaine strict
  constants.ts                      ← seuils + formule de confiance
  normalizeUserExpression.ts        ← normalisation pure
  colloquialPatternRegistry.ts      ← données bootstrap (pas de logique codée)
  buildLanguageContextFingerprint.ts
  resolvePersonalExpression.ts      ← moteur de résolution
  learnPersonalExpression.ts        ← apprentissage / confirm / reject / archive
  languageConfirmation.ts           ← TTL + classification oui/non/correction
  personalLanguageConversationBridge.ts ← branchement conversation
  index.ts

src/services/personalLanguageMemoryService.ts
supabase/migrations/00019_user_language_expressions.sql
```

### Flux NLP enrichi

```
message utilisateur
  → parse NLP standard (intentEngine)
  → normalisation expression (normalizeUserExpression)
  → recherche mémoire personnelle (userId strict)
  → hypothèses bootstrap (registry) si aucune mémoire
  → empreinte contextuelle (LanguageContextFingerprint)
  → résolution (direct / confirmation / question neutre)
  → intent conversationnel effectif (ex. declare_fatigue)
  → actions + réponse
  → apprentissage / persistance
```

Le Language Memory Engine **n’ remplace pas** le NLP existant : il l’enrichit avant la résolution finale lorsque l’intent standard est incertain (`unknown` ou confiance < 0,75).

### Modèle de domaine

Types principaux (`src/ai/languageMemory/types.ts`) :

- `LanguageExpressionMemory` — mémoire persistée par expression normalisée
- `LanguageResolution` — résultat du moteur (`direct`, `needs_confirmation`, `neutral_question`, `no_match`)
- `LanguageHypothesis` — interprétation candidate
- `LanguageConfirmationRequest` — hypothèse en attente (TTL 30 min)
- `LanguageLearningEvent` — journal d’événements (sans verbatim)
- `LanguageContextFingerprint` — moment, sport récent, charge planning, intent NLP, sommeil déclaratif

Statuts : `candidate` | `learning` | `confirmed` | `rejected` | `archived`

### Normalisation

`normalizeUserExpression()` :

- minuscules + suppression accents
- espaces multiples → un espace
- ponctuation finale retirée
- noyau extrait sans suffixes temporels (`aujourd'hui`, `ce matin`, etc.)

Permet de rapprocher « Je suis sec », « je suis sec. » et « Je suis sec aujourd'hui » sans transformation agressive.

### Règles de confiance

Constantes centralisées dans `constants.ts` :

| Seuil | Valeur | Comportement |
|-------|--------|--------------|
| `directUseMin` | 0,85 | Mémoire `confirmed` → utilisation directe |
| `confirmationMin` | 0,60 | Proposer interprétation + demander confirmation |
| `neutralMax` | 0,60 | En dessous → question neutre si pertinent |

**Formule** (`computeConfidenceFromCounts`) :

```
confiance = base (0,28)
          + min(confirmations, 5) × 0,14
          + min(usages × 0,008 ; 0,06)
          − rejets × 0,18
          − floor(jours_inactivité / 30) × 0,04
          → clamp [0 ; 0,90]
```

- **Une seule confirmation ne produit jamais la confiance maximale** (≈ 0,42 après 1 confirmation).
- Statut `confirmed` : confiance ≥ 0,85 **et** au moins 2 confirmations.
- Mémoires `rejected` / `archived` : exclues de la résolution.
- Réactivation possible si l’expression revient après archivage.

### Contexte

`LanguageContextFingerprint` — informations limitées, jamais de conversation verbatim :

- moment de la journée
- sommeil déclaratif (si disponible)
- activité sportive récente (via insights living)
- charge de planning (via signaux comportementaux)
- intent NLP détecté
- sujet conversationnel immédiat

Pas de diagnostic médical ou psychologique.

### Confirmation conversationnelle

Pending `language_confirmation` dans `ConversationPendingState` :

- Prompt : « Je pense que tu veux dire que tu es {meaning}. Est-ce bien cela ? »
- Réponses `oui` / `exactement` / `c'est ça` → confirmation + exécution intent
- Réponses `non` / `pas du tout` → rejet
- Correction explicite (« je voulais dire… ») → rejet + message de prise en compte
- Expiration : 30 minutes (`LANGUAGE_CONFIRMATION_TTL_MINUTES`)

### Persistance — migration 00019

**Fichier** : `supabase/migrations/00019_user_language_expressions.sql`

**Tables** :

1. `user_language_expressions`
   - UNIQUE `(user_id, normalized_expression)`
   - CHECK confiance ∈ [0, 1]
   - Index `(user_id, status)` et `(user_id, normalized_expression)`

2. `language_learning_events`
   - Journal : `hypothesis`, `confirm`, `reject`, `usage`, `decay`, `archive`, `reactivate`
   - Pas de verbatim de conversation dans `payload`

**RLS** (lecture/écriture/suppression propres à `auth.uid()`) :

- `user_language_expressions_select_own`
- `user_language_expressions_insert_own`
- `user_language_expressions_update_own`
- `user_language_expressions_delete_own`
- `language_learning_events_select_own`
- `language_learning_events_insert_own`

**Rollback manuel** :

```sql
DROP TABLE IF EXISTS public.language_learning_events;
DROP TABLE IF EXISTS public.user_language_expressions;
```

**Service** : `personalLanguageMemoryService.ts` — client Supabase anon uniquement, jamais de service role côté client.

### Sécurité et confidentialité

- Isolation stricte par `user_id` + RLS
- Expressions apprises = données utilisateur, jamais partagées entre comptes
- Registre bootstrap = patterns génériques français ; mémoires confirmées = personnelles
- Aucune expression codée en dur dans la logique métier (`resolvePersonalExpression` itère des données)

### Stratégie d’oubli

- Décroissance : −0,04 par tranche de 30 jours sans usage
- Archivage automatique (`archiveStaleExpression`) après 90 jours + confiance ≤ 0,40
- Réactivation si l’expression réapparaît

### Comportement en cas d’incertitude

- Confiance < 0,35 : pas d’interprétation assertive ; question neutre optionnelle
- Contradiction contextuelle forte : pénalité −0,12 (extension future)
- Table absente (migration non appliquée) : conversation continue, persistance ignorée via `.catch(() => [])`

### Exemple complet « je suis sec »

| Étape | Entrée | Sortie |
|-------|--------|--------|
| 1 | « Je suis sec aujourd'hui » | Hypothèse bootstrap fatigue, mode `needs_confirmation` |
| 2 | Assistant | « Je pense que tu veux dire que tu es fatigué. Est-ce bien cela ? » |
| 3 | « oui » | Mémoire `learning`, confiance ≈ 0,42, intent `declare_fatigue` exécuté |
| 4 | « Je suis sec » (ultérieur, 5 confirmations) | Mode `direct`, pas de re-confirmation |

### Tests

- **Vitest** : `src/ai/languageMemory/personalLanguageEngine.test.ts` — normalisation, résolution, confiance, confirmation, intégration conversation
- **Playwright** : `e2e/conversation/personal-language.spec.ts` — flux complet avec nettoyage Supabase

### Limites B (v1)

- Pas d’interface de gestion des mémoires linguistiques
- Registre bootstrap limité (6 familles d’expressions fatigue)
- Pas de LLM pour inférer de nouvelles expressions hors registry
- Variation contextuelle légère (bonus sport/soir uniquement)
- Confiance directe nécessite plusieurs confirmations (by design)

### Pistes v2

- Interface utilisateur de revue / oubli des expressions apprises
- Inférence contextuelle plus riche (sans diagnostic)
- Orchestrateur unique coach / proactive / NLP / language memory
- Sync multi-appareils avec résolution de conflits
