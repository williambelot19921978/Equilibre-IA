# DecisionEngine — Contrat

> ID : `decision-engine` · Pipeline #12

## Mission

**Valider** qu'une proposition respecte les règles déterministes : contraintes dures, permissions, limites de remplissage, règles de priorité. Gatekeeper avant toute action ou plan.

## Entrées

| Entrée | Type conceptuel | Source |
|--------|-----------------|--------|
| `proposedDecision` | Décision de ReasoningEngine | ReasoningEngine |
| `constraints[]` | Contraintes actives | ConstraintEngine |
| `planningContext` | État planning | PlanningContextEngine |
| `autonomyLevel` | Niveau autonomie membre (1–4) | HumanModelEngine |

## Sorties

| Sortie | Type conceptuel | Consommateur(s) |
|--------|-----------------|-----------------|
| `DecisionValidation` | `{ approved, violations[], requiresConfirmation }` | ActionProposalEngine |
| `validatedPlan` | Plan conforme (si applicable) | SchedulerEngine |

## Dépendances

| Moteur | Obligatoire |
|--------|-------------|
| ConstraintEngine | Oui |
| ReasoningEngine | Oui (amont) |

## Responsabilités

- Valider blocs planifiés (`validatePlannedBlock`, `validateDayPlan`).
- Appliquer max fill ratio, règles sommeil, routines enfants.
- Déterminer si confirmation utilisateur requise (Loi 6).
- Rejeter toute proposition LLM non conforme.

## Ce qu'il ne doit jamais faire

- Générer du raisonnement créatif (→ ReasoningEngine).
- Exécuter des mutations (→ ActionExecution).
- Approuver une violation de contrainte dure.

## Interfaces publiques (cibles)

```typescript
interface IDecisionEngine {
  validateProposal(input: ValidateProposalInput): DecisionValidation;
  validateDayPlan(plan: DayPlan, constraints: DayConstraints[]): ValidationResult;
  requiresConfirmation(action: ProposedAction, autonomyLevel: number): boolean;
}
```

## Événements émis

| Événement | Payload | Quand |
|-----------|---------|-------|
| `decision.approved` | `{ proposalId }` | Validation OK |
| `decision.rejected` | `{ proposalId, violations }` | Rejet |
| `decision.confirmation.required` | `{ action, reason }` | Confirmation needed |

## Mapping code actuel

| Fichier | Rôle | Écart |
|---------|------|-------|
| `decisionEngine.ts` | validatePlannedBlock, validateDayPlan | ✅ Proche du contrat |
| `planningEngine` (validation inline) | Validation dispersée | Consolider |

## Chevauchements

| Avec | Résolution |
|------|------------|
| ConstraintEngine | Decision **consomme** constraints ; ne les recalcule pas |
