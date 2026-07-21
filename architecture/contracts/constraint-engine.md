# ConstraintEngine — Contrat

> ID : `constraint-engine` · Pipeline #7

## Mission

Calculer les **contraintes actives** (dures et souples) pour une période : sommeil, routines enfants, travail, repas, temps sacrés, périodes familiales. Entrée du moteur de planning **déterministe**.

## Entrées

| Entrée | Type conceptuel | Source |
|--------|-----------------|--------|
| `planningContext` | État planning | PlanningContextEngine |
| `humanModel` | Horaires, sommeil, énergie | HumanModelEngine |
| `householdContext` | Routines, enfants, périodes | HouseholdEngine |
| `lifeEventContext` | Transitions vie | LifeEventEngine |

## Sorties

| Sortie | Type conceptuel | Consommateur(s) |
|--------|-----------------|-----------------|
| `DayConstraints[]` | Contraintes par jour | AvailabilityEngine, SchedulerEngine, DecisionEngine |
| `alerts[]` | Alertes (surcharge, conflit) | ReasoningEngine, NaturalResponseEngine |

## Dépendances

| Moteur | Obligatoire |
|--------|-------------|
| PlanningContextEngine | Oui |
| HumanModelEngine | Oui |
| HouseholdEngine | Oui |
| LifeEventEngine | Non |

## Responsabilités

- Produire contraintes **dures** (non déplaçables sans confirmation).
- Produire contraintes **souples** (déplaçables avec explication).
- Appliquer buffer sommeil, routines matin/soir enfants.
- Respecter Planning First : contraintes avant suggestions.

## Ce qu'il ne doit jamais faire

- Être contourné par le LLM.
- Supprimer une contrainte dure sans confirmation.
- Optimiser la productivité au détriment du sommeil (Loi 2).
- Ignorer les périodes de vie déclarées.

## Interfaces publiques (cibles)

```typescript
interface IConstraintEngine {
  buildConstraints(input: BuildConstraintsInput): DayConstraints[];
  validateBlock(block: PlannedBlock, constraints: DayConstraints): ValidationResult;
}
```

## Événements émis

| Événement | Payload | Quand |
|-----------|---------|-------|
| `constraints.calculated` | `{ date, hardCount, softCount }` | Calcul terminé |
| `constraint.violation.detected` | `{ block, constraint }` | Conflit détecté |

## Mapping code actuel

| Fichier | Rôle | Écart |
|---------|------|-------|
| `planningEngine.buildDayConstraints` | Contraintes jour | Monolithe planningEngine |
| `decisionEngine.validatePlannedBlock` | Validation bloc | Devrait consommer ConstraintEngine |
| `lib/planning/buildMorningRoutineConstraints.ts` | Routines matin | Helpers à intégrer |
| `lib/planning/eveningRoutine.ts`, `mealPlacement.ts` | Contraintes soir/repas | Éparpillés |

## Chevauchements

| Avec | Résolution |
|------|------------|
| DecisionEngine | validate* → DecisionEngine consomme ConstraintEngine |
| AvailabilityEngine | findAvailableSlots mélange les deux | Séparer strictement |
