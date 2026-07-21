# RecommendationEngine — Contrat

> ID : `recommendation-engine` · Pipeline #15

## Mission

Proposer des **détails concrets** (activité, sport, loisir, soirée, spiritualité si module actif) **uniquement après** analyse planning et disponibilités. Facade unifiée des moteurs de suggestion domaine.

## Entrées

| Entrée | Type conceptuel | Source |
|--------|-----------------|--------|
| `availableSlots[]` | Créneaux libres | AvailabilityEngine |
| `goalWeights` | Priorités | GoalEngine |
| `humanModel` | Préférences | HumanModelEngine |
| `lifeEventContext` | Contexte vie | LifeEventEngine |
| `recommendationRequest` | Type (soirée, sport, calme…) | ReasoningEngine / Intent |

## Sorties

| Sortie | Type conceptuel | Consommateur(s) |
|--------|-----------------|-----------------|
| `Recommendation[]` | Suggestions scorées + rationale | NaturalResponseEngine |
| `featuredRecommendation` | Suggestion principale | UI modals |

## Dépendances

| Moteur | Obligatoire |
|--------|-------------|
| AvailabilityEngine | **Oui — Planning First** |
| GoalEngine | Oui |
| KnowledgeEngine | Non (si info externe) |

## Responsabilités

- Unifier loisirs, sport, soir, spiritualité (si activé), calm.
- Déléguer à sous-stratégies domaine (plugins).
- Expliquer pourquoi une suggestion convient au créneau.
- Respecter module spiritualité **désactivé par défaut**.

## Ce qu'il ne doit jamais faire

- Suggérer restaurant/film **avant** AvailabilityEngine.
- Inventer des informations (→ KnowledgeEngine).
- Activer spiritualité sans module utilisateur.

## Interfaces publiques (cibles)

```typescript
interface IRecommendationEngine {
  recommend(input: RecommendInput): Recommendation[];
  getFeatured(input: FeaturedInput): Recommendation | null;
}

// Sous-stratégies (plugins internes)
interface IRecommendationStrategy {
  domain: 'leisure' | 'sport' | 'spiritual' | 'calm' | 'evening';
  recommend(input: StrategyInput): Recommendation[];
}
```

## Événements émis

| Événement | Payload | Quand |
|-----------|---------|-------|
| `recommendation.generated` | `{ count, domain }` | Suggestions produites |

## Mapping code actuel

| Fichier | Rôle | Écart |
|---------|------|-------|
| `leisureSuggestionEngine.ts` | Loisirs | Fragmenté |
| `freeTimeSuggestionEngine.ts` | Modal temps libre | **Diverge** de eveningOpportunity |
| `eveningOpportunityEngine.ts` | Soirée | Incohérence modal vs timeline |
| `spiritualSuggestionEngine.ts` | Spiritualité | OK si module actif |
| `workoutGenerationEngine.ts` | Sport | Primary |
| `slotActivitySuggestionEngine.ts` | Fusion slot-level | Devrait être orchestrateur interne |

## Chevauchements

| Avec | Résolution |
|------|------------|
| 5+ suggestion engines | Facade RecommendationEngine + strategies |
| KnowledgeEngine | Recommendations consomment facts externes |
