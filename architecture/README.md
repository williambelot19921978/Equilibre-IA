# Architecture — Gouvernance technique Équilibre IA

> Dossier de **gouvernance et documentation architecturale** — pas de code métier ici.

## Rôle

Ce dossier supporte l'[**Architecture Guardian**](../Docs/ARCHITECTURE_GUARDIAN.md), troisième pilier du projet avec la [Constitution](../Docs/EQUILIBRE_AI_CONSTITUTION.md) et le [Robot QA](../Docs/ROBOT_QA_CHARTER.md).

## Structure

```
architecture/
├── README.md              ← Ce fichier
├── engines/               ← Cartographie des moteurs (documentation)
├── contracts/             ← Spécifications de contrats (cibles Sprint A1)
├── interfaces/            ← Interfaces entre composants
├── decisions/             ← Revues Architecture Guardian par feature
├── adr/                   ← Architecture Decision Records
├── patterns/              ← Patterns approuvés
└── templates/             ← Templates ADR et revue architecture
```

## Workflow

1. **Idée** → revue Architecture Guardian (checklist + 10 questions)
2. **Validation humaine**
3. Développement dans `src/`
4. Robot QA → rapport dans `qa/reports/`

## Code vs documentation

| Emplacement | Contenu |
|-------------|---------|
| `architecture/` | Specs, ADR, revues, patterns — **gouvernance** |
| `src/ai/contracts/` | Contrats TypeScript implémentés — **Sprint A1** |
| `src/ai/` | Moteurs et implémentation — **développement** |

## Premiers ADR attendus (Sprint A1)

- `0001-pipeline-ia-interfaces-first.md`
- `0002-household-as-central-entity.md`
- `0003-universal-product-no-founder-defaults.md`

## Liens

- [Architecture Guardian](../Docs/ARCHITECTURE_GUARDIAN.md)
- [Constitution](../Docs/EQUILIBRE_AI_CONSTITUTION.md)
- [Robot QA Charter](../Docs/ROBOT_QA_CHARTER.md)
