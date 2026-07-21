# PlanningContextEngine — Contrat

> ID : `planning-context-engine` · Pipeline #6

## Mission

Assembler la **vue planning** pour une période : tâches, blocs planifiés, routines, événements calendrier, état de complétion. Snapshot read-only du calendrier vivant **avant** contraintes et disponibilités.

## Entrées

| Entrée | Type conceptuel | Source |
|--------|-----------------|--------|
| `householdId` / `memberId` | Scope | HouseholdEngine |
| `date` / `dateRange` | Période | Requête |
| `humanModel` | Modèle membre | HumanModelEngine |
| `householdContext` | Contexte foyer | HouseholdEngine |
| `tasks[]`, `blocks[]` | Données brutes | Persistance / services |

## Sorties

| Sortie | Type conceptuel | Consommateur(s) |
|--------|-----------------|-----------------|
| `PlanningContext` | Vue structurée du planning | ConstraintEngine, AvailabilityEngine, ReasoningEngine |

## Dépendances

| Moteur | Relation | Obligatoire |
|--------|----------|-------------|
| HumanModelEngine | Profil, horaires | Oui |
| HouseholdEngine | Contraintes foyer | Oui |
| LifeEventEngine | Enrichissement contexte vie | Non |
| Services planning | Chargement données | Oui |

## Responsabilités

- Charger et normaliser l'état planning (tâches, blocs, skips).
- Fusionner planning individuel et planning foyer.
- Enrichir avec métadonnées (skip_count, planned_at, status).
- Produire un snapshot **immutable** par requête.

## Ce qu'il ne doit jamais faire

- Calculer contraintes dures (→ ConstraintEngine).
- Calculer créneaux libres (→ AvailabilityEngine).
- Générer un plan optimisé (→ SchedulerEngine).
- Modifier des données (read-only).

## Interfaces publiques (cibles)

```typescript
interface IPlanningContextEngine {
  buildContext(input: BuildPlanningContextInput): PlanningContext;
  buildHouseholdContext(householdId: string, dateRange: DateRange): HouseholdPlanningContext;
}
```

## Événements émis

| Événement | Payload | Quand |
|-----------|---------|-------|
| `planning.context.built` | `{ contextId, dateRange }` | Contexte assemblé |

## Événements consommés

| Événement | Action |
|-----------|--------|
| `task.updated` / `block.updated` | Invalider cache contexte |

## Mapping code actuel

| Fichier | Rôle | Écart |
|---------|------|-------|
| `memoryEngine.buildPlanningContext` | Assembly | **Mal placé** dans HumanModel |
| `memoryContextService.loadPlanningContextWithLife` | Hub agrégateur | Trop de responsabilités |
| `planningService` | Load + persist | Mélange contexte et mutation |

## Chevauchements

| Avec | Résolution |
|------|------------|
| memoryEngine | Scinder buildPlanningContext |
| lifeEngine.enrichPlanningContextWithLife | LifeEventEngine enrichit via événement |
