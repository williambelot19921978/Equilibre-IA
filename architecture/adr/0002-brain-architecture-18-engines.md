# ADR-0002 : Architecture cerveau — 18 moteurs

> Statut : **superseded** — remplacé par [ADR-0005](0005-freeze-brain-architecture-20-engines.md) (20 moteurs figés)  
> Date : 2026-07-18  
> Décideurs : Sprint A1 — validation Architecture Guardian

## Contexte

Le code actuel (`src/ai/`) est un maillage de moteurs domaine sans contrats formels. La Constitution ch. 13 définit 15 composants pipeline. Le Sprint A1 doit figer l'architecture cible sans coder.

## Problème

Comment nommer, découper et interfacer les moteurs du cerveau Équilibre IA ?

## Options

### Option A — 15 moteurs stricts Constitution

Un fichier par composant Constitution, sans scission.

### Option B — 18 moteurs (15 + Scheduler + Notification + scissions)

Ajouter SchedulerEngine (extrait de planningEngine), NotificationEngine (canal parallèle), conserver scissions HumanModel / Household vs FamilyContext unifié en HouseholdEngine.

### Option C — Fusion en 8 macro-moteurs

Réduire la granularité (Conversation, Memory, Planning, Action, Response).

## Choix

**Option B — 18 moteurs**

| # | Moteur |
|---|--------|
| 1–15 | Pipeline Constitution (avec GoalEngine explicite) |
| 16 | SchedulerEngine — planification déterministe extraite |
| 17 | NotificationEngine — canal parallèle |
| — | HouseholdEngine remplace FamilyContext + modèle foyer |

**Renommages vs demande initiale :**

| Demande user | Contrat retenu | Justification |
|--------------|----------------|---------------|
| MemoryEngine | **HumanModelEngine** | Scission memoryEngine (profil vs planning) |
| PlanningEngine | **PlanningContext + Constraint + Availability + Scheduler** | Monolithe 1150 lignes insoutenable |
| HouseholdEngine | **HouseholdEngine** | Aligné Constitution ch. 6 |
| KnowledgeEngine | **KnowledgeEngine** | = External Knowledge Engine |

## Conséquences

### Positives

- Responsabilités uniques testables
- DAG acyclique cible
- Migration progressive possible (ADR-0001)
- Planning First enforceable par ordre moteur

### Négatives

- Plus de fichiers à migrer
- Période coexistence legacy

## Alternatives rejetées

- **Option A** : planningEngine reste monolithe — dette maintenue
- **Option C** : macro-moteurs — re-dérive vers mesh actuel

## Références

- `architecture/contracts/00-index.md`
- `architecture/contracts/diagram-pipeline-global.md`
- Constitution ch. 13
