# LifeEventEngine — Contrat

> ID : `life-event-engine` · Pipeline #10

## Mission

Modéliser les **transitions de vie** (déménagement, examens, maladie, vacances, naissance, etc.) et adapter le comportement IA : priorités, allègement, recommandations contextuelles.

## Entrées

| Entrée | Type conceptuel | Source |
|--------|-----------------|--------|
| `lifeEvents[]` | Événements déclarés | Persistance / conversation |
| `date` | Date courante | Requête |
| `householdContext` | Foyer | HouseholdEngine |

## Sorties

| Sortie | Type conceptuel | Consommateur(s) |
|--------|-----------------|-----------------|
| `LifeEventContext` | Transitions actives + impact | ConstraintEngine, GoalEngine, ReasoningEngine |
| `dayType` | Classification jour (normal, vacation, exam, fatigue…) | PlanningContextEngine |
| `adaptationHints[]` | Suggestions d'adaptation | NaturalResponseEngine |

## Dépendances

| Moteur | Obligatoire |
|--------|-------------|
| HouseholdEngine | Oui |

## Responsabilités

- Détecter périodes de vie actives pour une date.
- Classifier le type de jour.
- Proposer adaptations (allègement, pas de push productivité).
- Lier événements vie → périodes family_context si applicable.

## Ce qu'il ne doit jamais faire

- Générer des recommandations loisirs sans Planning First.
- Ignorer une période de fatigue ou deuil déclarée.
- Modifier le planning sans ActionProposal.

## Interfaces publiques (cibles)

```typescript
interface ILifeEventEngine {
  resolveContext(input: ResolveLifeEventInput): LifeEventContext;
  determineDayType(date: string, context: LifeEventContext): DayType;
  getAdaptationHints(context: LifeEventContext): AdaptationHint[];
}
```

## Événements émis

| Événement | Payload | Quand |
|-----------|---------|-------|
| `lifeEvent.declared` | `{ event }` | Nouvel événement |
| `lifeEvent.active` | `{ event, dateRange }` | Période active |

## Mapping code actuel

| Fichier | Rôle | Écart |
|---------|------|-------|
| `lifeEngine.determineDayType` | Type jour | Fusionné avec Availability |
| `lifeEngine.resolveLifeContext` | Contexte vie | Idem |
| `lifeEngine.enrichPlanningContextWithLife` | Enrichissement | → événement ou injection LifeEventContext |
| `familyContextEngine` | Périodes famille | Chevauchement partiel |

## Chevauchements

| Avec | Résolution |
|------|------------|
| AvailabilityEngine | Scinder lifeEngine — LifeEvent ≠ Availability |
| HouseholdEngine | LifeEvent déclare ; Household persiste structure |
