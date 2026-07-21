# HumanModelEngine — Contrat

> ID : `human-model-engine` · Pipeline #4 · *(MemoryEngine legacy → scission)*

## Mission

Maintenir la représentation **progressive et universelle** de chaque personne : identité, énergie, habitudes, contraintes, préférences, objectifs, niveau de confiance par attribut. **Human Model**, pas simple profil statique.

## Entrées

| Entrée | Type conceptuel | Source |
|--------|-----------------|--------|
| `memberId` | Identifiant membre | HouseholdEngine |
| `profileFacts[]` | Faits déclarés (discovery, onboarding) | Persistance |
| `behaviorSignals[]` | Signaux comportementaux (skip, completion) | **OutcomeObservationEngine** (#20) |
| `corrections[]` | Corrections utilisateur | UI / conversation |

## Sorties

| Sortie | Type conceptuel | Consommateur(s) |
|--------|-----------------|-----------------|
| `HumanModel` | Modèle structuré + confidence par champ | Tous moteurs contextuels |
| `HumanModelSnapshot` | Vue légère pour un tour conversation | ConversationEngine, PLM |
| `insights[]` | Insights comportementaux | ReasoningEngine, Coach |

## Dépendances

| Moteur / couche | Relation | Obligatoire |
|-----------------|----------|-------------|
| HouseholdEngine | Scope membre | Oui |
| GoalEngine | Objectifs du membre | Non |
| Persistance | profile_facts, living memory | Oui |

## Responsabilités

- Agréger faits, habitudes, tendances en modèle cohérent.
- Attribuer un **niveau de confiance** à chaque attribut (Loi 5).
- Exposer snapshots read-only aux autres moteurs.
- Supporter modèle **incrémental** (enrichissement progressif).
- Ne jamais figer un métier comme règle de vie.

## Ce qu'il ne doit jamais faire

- Construire le planning (→ PlanningContextEngine).
- Modéliser le foyer entier (→ HouseholdEngine).
- Inférer spiritualité, santé ou enfants sans consentement.
- Présenter une hypothèse comme fait certain.

## Interfaces publiques (cibles)

```typescript
interface IHumanModelEngine {
  getModel(memberId: string): HumanModel;
  getSnapshot(memberId: string): HumanModelSnapshot;
  applyCorrection(memberId: string, correction: ModelCorrection): void;
  getInsights(memberId: string): LivingInsight[];
}
```

## Événements émis

| Événement | Payload | Quand |
|-----------|---------|-------|
| `humanModel.updated` | `{ memberId, changedFields }` | Modèle enrichi |
| `humanModel.correction.applied` | `{ field, oldValue, newValue }` | Correction utilisateur |

## Événements consommés

| Événement | Action |
|-----------|--------|
| `goal.updated` | Mettre à jour objectifs dans modèle |
| `lifeEvent.declared` | Ajuster attributs temporaires |
| `outcome.behaviorSignal.emitted` | Intégrer signaux comportementaux (OutcomeObservationEngine) |

## Mapping code actuel

| Fichier | Rôle | Écart |
|---------|------|-------|
| `src/ai/memoryEngine.ts` | buildMemoryProfile, insights | **Fusionné** avec PlanningContext — à scinder |
| `src/ai/memory/livingMemoryEngine.ts` | Living memory orchestration | Sous-ensemble HumanModel |
| `src/ai/habits/buildHabitProfile.ts` | Profil habitudes | Dupliqué avec buildLivingHabitProfile |
| `src/services/livingMemoryService.ts` | Persistance | OK |

## Chevauchements identifiés

| Avec | Nature | Résolution |
|------|--------|------------|
| PlanningContextEngine | `buildPlanningContext` dans memoryEngine | **Scission Sprint A2+** |
| GoalEngine | missions dans memory/* | Extraire GoalEngine |
| buildLivingHabitProfile vs buildHabitProfile | Double builder | Unifier sous HumanModelEngine |
