# Diagramme global — Pipeline cerveau Équilibre IA

> **20 moteurs figés** (ADR-0005) · Schéma conceptuel  
> Boucle : **Comprendre → Décider → Proposer → Observer → Mesurer → Apprendre**

## Vue utilisateur → réponse

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           UTILISATEUR                                    │
│                    (texte · voix · UI · mobile)                          │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  CONVERSATION                                                            │
│  ConversationEngine — contexte, session, pending actions                 │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
┌──────────────────────────┐    ┌──────────────────────────┐
│  COMPRÉHENSION           │    │  PersonalLanguageMemory  │
│  IntentEngine            │◄───│  (expressions apprises)  │
│  intent + entités        │    └──────────────────────────┘
└─────────────┬────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  CONTEXTE PERSONNEL & FOYER                                              │
│  ┌─────────────────────┐    ┌─────────────────────┐                     │
│  │ HumanModelEngine    │    │ HouseholdEngine     │                     │
│  │ profil · énergie    │    │ membres · périodes  │                     │
│  └──────────┬──────────┘    └──────────┬──────────┘                     │
│             └────────────┬─────────────┘                                   │
└──────────────────────────┼──────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  MÉMOIRE PLANNING                                                        │
│  PlanningContextEngine — tâches, blocs, calendrier (snapshot)          │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              ▼                   ▼                   ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ LifeEventEngine  │  │ ConstraintEngine │  │ GoalEngine       │
│ transitions vie  │  │ contraintes      │  │ objectifs/poids  │
└────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘
         │                     │                     │
         └─────────────────────┼─────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  PLANIFICATION                                                           │
│  AvailabilityEngine — créneaux réellement libres                         │
│         ↓                                                                │
│  SchedulerEngine — génération / patch planning (déterministe)            │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  DÉCISION                                                                │
│  ReasoningEngine — arbitrage, rationale, alternatives                    │
│         ↓                                                                │
│  DecisionEngine — validation règles, confirmation requise                │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              ▼                   ▼                   ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ ActionProposal   │  │ Recommendation   │  │ KnowledgeEngine  │
│ actions typées   │  │ détails activité │  │ météo · lieux    │
└────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘
         │                     │                     │
         └─────────────────────┼─────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  RÉPONSE                                                                 │
│  NaturalResponseEngine — ton, explication, clarification                 │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  ACTIONS (hors cerveau)                                                  │
│  nlpActionService · planningService · Supabase · calendrier              │
└─────────────────────────────────────────────────────────────────────────┘

         ═══════════════════ CANAL PARALLÈLE ═══════════════════

┌─────────────────────────────────────────────────────────────────────────┐
│  NotificationEngine — écoute événements · push · PWA (Sprint 6)         │
└─────────────────────────────────────────────────────────────────────────┘

         ═══════════════ DUAL MEMORY — CANAL SÉPARÉ ═══════════════
         (Personal Memory ≠ Universal Learning — mélange interdit Q11)

┌─────────────────────────────────────────────────────────────────────────┐
│  UNIVERSAL LEARNING (collectif · anonymisé · généralisable)              │
│  UniversalLearningEngine — patterns langage · intents · stratégies       │
│         ↓ hints (lecture seule)                                          │
│  IntentEngine · ReasoningEngine                                          │
│  ⚠️ AUCUNE lecture Personal Memory · AUCUN export depuis le foyer      │
└─────────────────────────────────────────────────────────────────────────┘

         ═════════════ BOUCLE RÉTROACTION (#20) ═════════════

┌─────────────────────────────────────────────────────────────────────────┐
│  OUTCOME OBSERVATION — résultats réels post-proposition                  │
│  OutcomeObservationEngine ← ActionExecution · UI · Conversation          │
│         ├─ BehaviorSignal[]     → HumanModel / Goal / PLM (Personal)     │
│         └─ AnonymizedCandidate[] → AnonymizationGate → UniversalLearning │
└─────────────────────────────────────────────────────────────────────────┘
```

## Flux simplifié (demande utilisateur)

```
Utilisateur
    ↓
Conversation
    ↓
Compréhension (Intent + PLM)
    ↓
Mémoire (HumanModel + Household + PlanningContext)
    ↓
Objectifs + Contraintes + LifeEvents
    ↓
Planification (Availability → Scheduler)
    ↓
Décision (Reasoning → Decision)
    ↓
Actions + Recommendations (+ Knowledge si besoin)
    ↓
Réponse
```

## Dual Memory (Personal vs Universal)

```
┌──────────────────────────────┐     ┌──────────────────────────────┐
│     PERSONAL MEMORY          │     │    UNIVERSAL LEARNING        │
│  (privée · par foyer · RLS)  │     │  (globale · anonymisée)      │
├──────────────────────────────┤     ├──────────────────────────────┤
│ HumanModelEngine             │     │ UniversalLearningEngine      │
│ HouseholdEngine              │     │                              │
│ PlanningContextEngine        │     │ Apprend : expressions,       │
│ PersonalLanguageMemoryEngine │     │ synonymes, intents,          │
│ GoalEngine · LifeEventEngine │     │ stratégies générales         │
│                              │     │                              │
│ Ne quitte JAMAIS le foyer    │  ✕  │ Jamais de PII · jamais de    │
│                              │     │ données identifiables        │
└──────────────────────────────┘     └──────────────────────────────┘
         │                                      │
         └────────── flux séparés ──────────────┘
                    (mélange interdit — Q11)
```

Signal collectif : `Anonymisation → Agrégation → Validation → Universal Store`

Référence : [`UNIVERSAL_LEARNING_ENGINE.md`](../../Docs/UNIVERSAL_LEARNING_ENGINE.md)

## Règle Planning First (visualisée)

```
                    ┌─────────────────────────────┐
                    │  AvailabilityEngine         │
                    │  (temps réellement libre)   │
                    └──────────────┬──────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         │  INTERDIT avant       │  AUTORISÉ après          │
         ▼                         ▼
  KnowledgeEngine            RecommendationEngine
  (restaurant, météo)        (film, sport, soirée)
```

## Graphe de dépendances cible (DAG — acyclique)

```
ConversationEngine
  → IntentEngine, PersonalLanguageMemoryEngine
  → HumanModelEngine, HouseholdEngine
  → PlanningContextEngine
  → LifeEventEngine, GoalEngine, ConstraintEngine
  → AvailabilityEngine
  → ReasoningEngine
  → DecisionEngine
  → ActionProposalEngine, RecommendationEngine, SchedulerEngine
  → KnowledgeEngine (si Recommendation/Reasoning requiert)
  → NaturalResponseEngine

NotificationEngine ← (écoute événements de tous, ne bloque pas)

UniversalLearningEngine → IntentEngine, ReasoningEngine (hints lecture seule)
  ✕ Personal Memory (HumanModel, Household, PLM, PlanningContext)
  ✕ KnowledgeEngine (sources externes — distinct de l'apprentissage collectif)
```

### Dépendances circulaires actuelles (code legacy — à éliminer)

| Cycle | Modules | Résolution migration |
|-------|---------|---------------------|
| ⚠️ | `lifeEngine` ↔ `slotActivitySuggestionEngine` | RecommendationEngine consomme Availability ; pas de retour |
| ⚠️ | `memoryContextService` hub bidirectionnel | PlanningContextEngine read-only ; services exécution séparés |
| ⚠️ | `conversationEngine` ↔ `personalLanguageBridge` | Unidirectionnel : PLM → Intent |

## Légende LLM vs déterministe

| Zone | LLM autorisé | Déterministe obligatoire |
|------|--------------|--------------------------|
| IntentEngine | Ambiguïté (V2) | Classification V1 |
| ReasoningEngine | Hypothèses, alternatives | — |
| NaturalResponseEngine | Ton, formulation | Faits depuis moteurs |
| ConstraintEngine | ❌ | ✅ |
| AvailabilityEngine | ❌ | ✅ |
| SchedulerEngine | ❌ | ✅ |
| DecisionEngine | ❌ | ✅ |
