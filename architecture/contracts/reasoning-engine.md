# ReasoningEngine — Contrat

> ID : `reasoning-engine` · Pipeline #11

## Mission

**Synthétiser et arbitrer** entre tous les contextes (humain, foyer, planning, contraintes, disponibilités, objectifs, événements vie) pour produire une **décision proposée** argumentée. Cœur du raisonnement — LLM autorisé pour hypothèses multiples, pas pour exécution.

## Entrées

| Entrée | Type conceptuel | Source |
|--------|-----------------|--------|
| `conversationContext` | Demande utilisateur | ConversationEngine |
| `intentResult` | Intent + entités | IntentEngine |
| `humanModel` | Profil | HumanModelEngine |
| `householdContext` | Foyer | HouseholdEngine |
| `planningContext` | Planning | PlanningContextEngine |
| `constraints[]` | Contraintes | ConstraintEngine |
| `availableSlots[]` | Disponibilités | AvailabilityEngine |
| `goalWeights` | Priorités | GoalEngine |
| `lifeEventContext` | Transitions | LifeEventEngine |

## Sorties

| Sortie | Type conceptuel | Consommateur(s) |
|--------|-----------------|-----------------|
| `ReasoningResult` | `{ proposal, rationale, confidence, alternatives[] }` | DecisionEngine, ActionProposalEngine |
| `tradeoffs[]` | Compromis explicites | NaturalResponseEngine |

## Dépendances

| Moteur | Obligatoire |
|--------|-------------|
| Tous moteurs contextuels amont | Oui (read-only) |
| DecisionEngine | Aval (validation) |

## Responsabilités

- Arbitrer priorités multi-piliers.
- Expliquer le **pourquoi** (Loi 4).
- Proposer alternatives quand surcharge.
- Unifier les 3 chemins actuels (lifeReasoner, proactiveCoach, proactiveEngine).

## Ce qu'il ne doit jamais faire

- Exécuter des actions.
- Contourner contraintes dures.
- Culpabiliser l'utilisateur.
- Décider seul sans DecisionEngine.

## Interfaces publiques (cibles)

```typescript
interface IReasoningEngine {
  reason(input: ReasoningInput): ReasoningResult;
  explain(decision: ProposedDecision): Explanation;
}
```

## Événements émis

| Événement | Payload | Quand |
|-----------|---------|-------|
| `reasoning.completed` | `{ proposal, rationale }` | Arbitrage terminé |
| `reasoning.overload.detected` | `{ severity, suggestions }` | Surcharge |

## Mapping code actuel

| Fichier | Rôle | Écart |
|---------|------|-------|
| `reasoning/lifeReasoner.ts` | Score propositions vie | ✅ Candidat principal |
| `coach/proactiveCoachEngine.ts` | Coach proactif | **Chemin parallèle** |
| `lib/proactiveEngine/*` | Insights proactive card | **Chemin parallèle** |
| `reasoning/weeklyReviewEngine.ts` | Revue hebdo | Sous-ensemble |

## Chevauchements

| Avec | Résolution |
|------|------------|
| DecisionEngine | Reasoning propose ; Decision valide |
| RecommendationEngine | Reasoning arbitre ; Recommendation détaille |
