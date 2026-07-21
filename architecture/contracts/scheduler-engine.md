# SchedulerEngine — Contrat

> ID : `scheduler-engine` · Pipeline #14 · *(planification déterministe)*

## Mission

**Générer et ajuster** le planning (placement blocs, replanification, déplacement tâches) de manière **100 % déterministe**. Moteur calendrier du cerveau.

## Entrées

| Entrée | Type conceptuel | Source |
|--------|-----------------|--------|
| `planningContext` | État actuel | PlanningContextEngine |
| `constraints[]` | Contraintes | ConstraintEngine |
| `availableSlots[]` | Créneaux | AvailabilityEngine |
| `goalWeights` | Priorités | GoalEngine |
| `schedulingRequest` | Demande (replan, place task…) | ActionProposalEngine |

## Sorties

| Sortie | Type conceptuel | Consommateur(s) |
|--------|-----------------|-----------------|
| `DayPlan` / `SchedulePatch` | Plan ou patch | DecisionEngine → ActionExecution |
| `schedulingExplanation` | Pourquoi ce placement | NaturalResponseEngine |

## Dépendances

| Moteur | Obligatoire |
|--------|-------------|
| ConstraintEngine | Oui |
| AvailabilityEngine | Oui |
| DecisionEngine | Aval validation |

## Responsabilités

- `generateDayPlan` — planifier une journée.
- Replanifier après changement (tâche, contrainte, fatigue).
- Respecter contraintes dures sans exception.
- Expliquer placements (Loi 4).

## Ce qu'il ne doit jamais faire

- Utiliser le LLM pour placement.
- Ignorer DecisionEngine.
- Optimiser productivité sans GoalEngine weights.

## Interfaces publiques (cibles)

```typescript
interface ISchedulerEngine {
  generateDayPlan(input: GeneratePlanInput): DayPlan;
  applyPatch(context: PlanningContext, patch: SchedulePatch): DayPlan;
  deferTasks(input: DeferTasksInput): SchedulePatch;
}
```

## Événements émis

| Événement | Payload | Quand |
|-----------|---------|-------|
| `schedule.generated` | `{ date, blockCount }` | Plan créé |
| `schedule.patched` | `{ patch }` | Modification appliquée |

## Mapping code actuel

| Fichier | Rôle | Écart |
|---------|------|-------|
| `planningEngine.generateDayPlan` | Génération plan | Monolithe ~1150 lignes |
| `planningService` | Persist + orchestrate | OK couche service |
| `rescheduleNonUrgentTasksService` | Décalage fatigue | Devrait consommer SchedulerEngine |
| `dynamicReplanService` | Replan triggers | Adjacent |

## Chevauchements

| Avec | Résolution |
|------|------------|
| planningEngine monolith | Scinder Constraint, Availability, Scheduler |
| ConstraintEngine | Scheduler **consomme** constraints |
