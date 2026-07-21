# Équilibre IA

> **Équilibre IA optimise le temps pour améliorer la vie de l'utilisateur.**  
> Chaque fonctionnalité doit contribuer à une vie plus équilibrée, plus sereine, plus fluide et plus épanouie.

> **Constitution v1.4** — 20 moteurs figés · Phase Fondation ✅

Assistant de vie universel centré sur le temps — React, TypeScript, Vite, Supabase.

**Boucle cerveau :** Comprendre → Décider → Proposer → Observer → Mesurer → Apprendre

## Les trois piliers

| Pilier | Document | Moment |
|--------|----------|--------|
| **Constitution** | [`Docs/EQUILIBRE_AI_CONSTITUTION.md`](./Docs/EQUILIBRE_AI_CONSTITUTION.md) | Vision & lois — toujours |
| **Architecture Guardian** | [`Docs/ARCHITECTURE_GUARDIAN.md`](./Docs/ARCHITECTURE_GUARDIAN.md) | Cohérence technique — **avant** dev |
| **Robot QA** | [`Docs/ROBOT_QA_CHARTER.md`](./Docs/ROBOT_QA_CHARTER.md) | Qualité — **après** dev |

Workflow : Idée → Architecture Guardian → Validation humaine → Dev → Tests → Robot QA → Rapport → Validation → Déploiement

## Documentation de référence

| Document | Rôle |
|----------|------|
| **[Constitution](./Docs/EQUILIBRE_AI_CONSTITUTION.md)** | **Document le plus important** — v1.4 · 20 moteurs |
| [Architecture Guardian](./Docs/ARCHITECTURE_GUARDIAN.md) | Gouvernance technique — troisième pilier |
| [Project Bible](./Docs/PROJECT_BIBLE.md) | Architecture, modules, base de données |
| [AI Rulebook](./Docs/AI_RULEBOOK.md) | Comportement détaillé de l'IA |
| [Roadmap](./Docs/ROADMAP.md) | Plan de développement |
| [Robot QA Charter](./Docs/ROBOT_QA_CHARTER.md) | Charte qualité permanente |
| [Governance Report](./Docs/GOVERNANCE_REPORT.md) | État gouvernance (3 piliers) |
| [Sprint A1 Report](./architecture/decisions/2026-07-18-sprint-a1-report.md) | Contrats cerveau IA |
| [Alignment Report](./Docs/CONSTITUTION_ALIGNMENT_REPORT.md) | Alignement code ↔ constitution |
| [Universal Learning](./Docs/UNIVERSAL_LEARNING_ENGINE.md) | Dual Memory — apprentissage collectif |
| [Sprint 0 Audit](./Docs/SPRINT_0_FOUNDATIONS_AUDIT.md) | Audit fondations + clôture 0.5 |
| [Contrats TS cerveau](./src/ai/contracts/) | Interfaces officielles Sprint A2 |

## Développement

```bash
npm install
npm run dev    # http://localhost:5173 (port strict)
```

## Qualité

```bash
npm run lint
npm run build
npm test
npm run verify:contracts
npx playwright test
```

Matrice QA : [`qa/scenarios/`](./qa/scenarios/) — 200 scénarios Phase 1.

Gouvernance architecture : [`architecture/`](./architecture/) — ADR, revues, patterns.

---

## Stack technique

React + TypeScript + Vite + Supabase.

## Migrations récentes

- Migration `00017` : ajout des colonnes `evening_planning_mode` et `sport_settings`.
- Migration `00018` : ajout de la policy `task_activity_events_delete_own` permettant au compte authentifié de supprimer ses propres événements d'activité (utilisée notamment pour le nettoyage des tests E2E).
- Migration `00019` : expressions de langage personnel (`user_language_expressions`).
