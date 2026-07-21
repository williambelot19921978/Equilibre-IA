# ADR — Architecture Decision Records

> Décisions structurantes du projet. Format officiel : [Architecture Guardian](../Docs/ARCHITECTURE_GUARDIAN.md) §10.

## Index

| ADR | Titre | Statut |
|-----|-------|--------|
| [0000](0000-adr-process.md) | Processus ADR | accepted |
| [0001](0001-pipeline-ia-interfaces-first.md) | Pipeline IA interfaces first | accepted |
| [0002](0002-brain-architecture-18-engines.md) | Architecture cerveau 18 moteurs | superseded → [0005](0005-freeze-brain-architecture-20-engines.md) |
| [0003](0003-dual-memory-universal-learning.md) | Dual Memory — Universal Learning | accepted |
| [0004](0004-outcome-observation-engine.md) | OutcomeObservationEngine — boucle rétroaction | accepted |
| [0005](0005-freeze-brain-architecture-20-engines.md) | Gel architecture — 20 moteurs | accepted |
| [0006](0006-engine-boundary-clarifications.md) | Frontières Scheduler/Decision, Reasoning/Reco/Scheduler, PLM/Intent | accepted |

## Nommage

```
NNNN-titre-court-en-kebab-case.md
```

## Template

[`../templates/adr.template.md`](../templates/adr.template.md)

## Règles

- Toute décision **difficile à inverser** → ADR
- Statut `accepted` uniquement après **validation humaine**
- ADR deprecated → référencer le remplaçant
