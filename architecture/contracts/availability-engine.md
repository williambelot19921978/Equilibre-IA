# AvailabilityEngine — Contrat

> ID : `availability-engine` · Pipeline #8

## Mission

Calculer les **créneaux réellement disponibles** après application des contraintes. Répondre à : « Quel temps libre existe vraiment ? » — fondation de Planning First.

## Entrées

| Entrée | Type conceptuel | Source |
|--------|-----------------|--------|
| `planningContext` | Planning actuel | PlanningContextEngine |
| `constraints[]` | Contraintes actives | ConstraintEngine |
| `humanModel.energyProfile` | Énergie par moment | HumanModelEngine |

## Sorties

| Sortie | Type conceptuel | Consommateur(s) |
|--------|-----------------|-----------------|
| `AvailableSlot[]` | Créneaux libres scorés | ReasoningEngine, RecommendationEngine, SchedulerEngine |
| `availabilitySummary` | Synthèse (ex. « 1 seule soirée libre ») | NaturalResponseEngine |

## Dépendances

| Moteur | Obligatoire |
|--------|-------------|
| ConstraintEngine | Oui |
| PlanningContextEngine | Oui |

## Responsabilités

- Soustraire contraintes dures du temps disponible.
- Scorer créneaux selon énergie et objectifs (poids GoalEngine en entrée optionnelle).
- Détecter surcharge et soirées uniques compromettables.
- Produire alertes « accepter X supprime Y » (Constitution ch. 10).

## Ce qu'il ne doit jamais faire

- Ignorer contraintes dures.
- Remplir automatiquement les créneaux (→ SchedulerEngine).
- Proposer restaurants/films (→ RecommendationEngine, **après**).

## Interfaces publiques (cibles)

```typescript
interface IAvailabilityEngine {
  findSlots(input: FindSlotsInput): AvailableSlot[];
  summarizeAvailability(input: SummarizeInput): AvailabilitySummary;
  scoreSlot(slot: TimeSlot, context: ScoringContext): number;
}
```

## Événements émis

| Événement | Payload | Quand |
|-----------|---------|-------|
| `availability.calculated` | `{ date, freeMinutes }` | Calcul terminé |
| `availability.sacredTime.atRisk` | `{ slot, threat }` | Temps protégé menacé |

## Mapping code actuel

| Fichier | Rôle | Écart |
|---------|------|-------|
| `planningEngine.findAvailableSlots` | Créneaux libres | Dans monolithe |
| `lifeEngine.scoreFreeSlot` | Score créneaux | Fusionné LifeEvent+Availability |
| `lib/planning/splitFreeSlots.ts` | Découpe gaps | Helper OK |

## Chevauchements

| Avec | Résolution |
|------|------------|
| lifeEngine | Extraire scoreFreeSlot ici |
| RecommendationEngine | Recommendations consomment AvailableSlot[] en entrée |
