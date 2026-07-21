# GoalEngine — Contrat

> ID : `goal-engine` · Pipeline #9 · *(actuellement absent en tant que moteur)*

## Mission

Gérer les **objectifs** de chaque membre : priorisation, poids de décision, missions quotidiennes/hebdomadaires, équilibre entre piliers (sommeil, sport, famille, repos, etc.). Empêcher la productivité d'écraser le repos (Loi 2).

## Entrées

| Entrée | Type conceptuel | Source |
|--------|-----------------|--------|
| `memberId` | Membre | HouseholdEngine |
| `goals[]` | Objectifs déclarés | Persistance / HumanModel |
| `planningContext` | État actuel | PlanningContextEngine |
| `availabilitySummary` | Temps disponible | AvailabilityEngine |

## Sorties

| Sortie | Type conceptuel | Consommateur(s) |
|--------|-----------------|-----------------|
| `GoalWeights` | Poids par pilier/objectif | ReasoningEngine, SchedulerEngine |
| `MissionSuggestion` | Mission du jour/semaine | NaturalResponseEngine |
| `goalAlerts[]` | Conflits objectifs (ex. sport vs repos) | ReasoningEngine |

## Dépendances

| Moteur | Obligatoire |
|--------|-------------|
| HumanModelEngine | Oui |
| PlanningContextEngine | Non |
| AvailabilityEngine | Non |

## Responsabilités

- Prioriser objectifs personnalisables et temporaires.
- Calculer poids pour arbitrage ReasoningEngine.
- Générer missions adaptées (pas de culpabilisation).
- Alerter si un objectif compromet repos ou relations.

## Ce qu'il ne doit jamais faire

- Sacrifier systématiquement repos pour productivité.
- Imposer spiritualité ou enfants.
- Modifier le planning directement.

## Interfaces publiques (cibles)

```typescript
interface IGoalEngine {
  getWeights(memberId: string, date: string): GoalWeights;
  suggestMission(input: MissionInput): MissionSuggestion;
  detectConflicts(goals: Goal[], availability: AvailabilitySummary): GoalAlert[];
}
```

## Événements émis

| Événement | Payload | Quand |
|-----------|---------|-------|
| `goal.priority.changed` | `{ goalId, newPriority }` | Priorité modifiée |
| `goal.conflict.detected` | `{ goals[], impact }` | Conflit détecté |

## Mapping code actuel

| Fichier | Rôle | Écart |
|---------|------|-------|
| `profile_facts.main_priority` | Priorité unique | Partiel |
| `memory/dailyMissionEngine.ts` | Mission jour | Devrait être GoalEngine |
| `memory/weeklyMissionEngine.ts` | Mission semaine | Idem |
| `memory/adaptiveDurationEngine.ts` | Objectifs évolutifs sport | Adjacent |

## Chevauchements

| Avec | Résolution |
|------|------------|
| HumanModelEngine | goals[] vivent dans HumanModel ; GoalEngine les **interprète** |
| ReasoningEngine | Reasoning consomme GoalWeights |
