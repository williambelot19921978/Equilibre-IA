# HouseholdEngine — Contrat

> ID : `household-engine` · Pipeline #5 · *(FamilyContext + foyer centrale)*

## Mission

Modéliser le **foyer comme entité centrale** : membres, rôles, permissions, plannings individuels agrégés, périodes familiales (vacances, déplacements, garde alternée). Remplace la modélisation `partner_name` textuelle.

## Entrées

| Entrée | Type conceptuel | Source |
|--------|-----------------|--------|
| `householdId` | Identifiant foyer | Auth / session |
| `date` / `dateRange` | Période analysée | Requête |
| `familyContextPeriods[]` | Périodes déclarées | Persistance |
| `members[]` | Membres avec rôles | `household_members` |

## Sorties

| Sortie | Type conceptuel | Consommateur(s) |
|--------|-----------------|-----------------|
| `HouseholdContext` | Structure foyer + membres | PlanningContextEngine, ReasoningEngine |
| `FamilyContextForDate` | Contexte familial date | LifeEventEngine, ConstraintEngine |
| `memberAvailabilityHints[]` | Disponibilité relative membres | ReasoningEngine (relays) |

## Dépendances

| Moteur / couche | Relation | Obligatoire |
|-----------------|----------|-------------|
| Persistance | households, household_members, family_context_periods | Oui |
| HumanModelEngine | Par membre | Oui (par membre) |

## Responsabilités

- Résoudre le contexte familial pour une date (enfants, déplacements, vacances).
- Agréger contraintes de **tous les membres** (pas seulement utilisateur courant).
- Exposer permissions et visibilité inter-membres.
- Supporter universalité : célibataire, couple, colocation, monoparental, etc.
- Modéliser chaque adulte comme **membre**, jamais comme champ texte.

## Ce qu'il ne doit jamais faire

- Stocker le conjoint uniquement comme `partner_name` string.
- Partager mémoire privée entre membres sans consentement.
- Supposer enfants obligatoires.
- Hardcoder des prénoms fondateur en production.

## Interfaces publiques (cibles)

```typescript
interface IHouseholdEngine {
  getContext(householdId: string): HouseholdContext;
  resolveFamilyContext(householdId: string, date: string): FamilyContextForDate;
  getMember(memberId: string): HouseholdMember;
  listMembers(householdId: string): HouseholdMember[];
}
```

## Événements émis

| Événement | Payload | Quand |
|-----------|---------|-------|
| `household.member.added` | `{ member }` | Nouveau membre |
| `familyContext.period.updated` | `{ period }` | Période modifiée |

## Événements consommés

| Événement | Action |
|-----------|--------|
| `lifeEvent.declared` | Créer/mettre à jour période familiale |

## Mapping code actuel

| Fichier | Rôle | Écart |
|---------|------|-------|
| `src/ai/familyContextEngine.ts` | resolveFamilyContextForDate | ✅ Cœur métier — manque modèle membres complet |
| `src/services/familyContextService.ts` | CRUD périodes | OK persistance |
| `partner_name` (profile_facts) | Texte conjoint | **Legacy — à retirer (F2)** |
| RPC `create_household_for_current_user` | Création foyer | OK base |

## Chevauchements identifiés

| Avec | Nature | Résolution |
|------|--------|------------|
| LifeEventEngine | Périodes vie vs family periods | LifeEvent déclare ; Household persist structure |
| lifeEngine | Childcare impact rules | Déléguer à HouseholdEngine |
