# UniversalLearningEngine — Contrat

> ID : `universal-learning-engine` · Pipeline #19 · **Non implémenté**  
> Référence : [`Docs/UNIVERSAL_LEARNING_ENGINE.md`](../../Docs/UNIVERSAL_LEARNING_ENGINE.md)

## Mission

Agréger, valider et servir des **connaissances universelles généralisables** — langage, intents, stratégies de planification, patterns de raisonnement — **sans jamais** stocker ou apprendre de données personnelles identifiables.

## Entrées

| Entrée | Type conceptuel | Source |
|--------|-----------------|--------|
| `anonymizedSignals[]` | Signaux agrégés post-gate | Pipeline anonymisation (futur) |
| `lookupQuery` | Requête pattern/stratégie | IntentEngine, ReasoningEngine |
| `validationRequest` | Candidat à valider | Pipeline §7 UNIVERSAL_LEARNING_ENGINE |

## Sorties

| Sortie | Type conceptuel | Consommateur(s) |
|--------|-----------------|-----------------|
| `UniversalHint[]` | Patterns langage/intent généralisés | IntentEngine |
| `UniversalStrategy[]` | Stratégies planification générales | ReasoningEngine |
| `UniversalIntentPattern[]` | Mappings expression → concept | IntentEngine |
| `ValidationResult` | accepted / rejected + reason | Pipeline interne |

## Dépendances

| Moteur / couche | Relation | Obligatoire |
|-----------------|----------|-------------|
| Personal Memory (tous) | **Aucune lecture directe** | Interdit |
| AnonymizationGate | Amont (futur) | Oui pour contribution |
| IntentEngine | Aval consommateur | Non (read) |
| ReasoningEngine | Aval consommateur | Non (read) |

## Responsabilités

- Maintenir store global de connaissances **validées** (§7).
- Servir hints universels en lecture seule aux moteurs de compréhension et raisonnement.
- Rejeter tout signal non anonymisable.
- Tracer origine agrégée (volume, pas identité).

## Ce qu'il ne doit jamais faire

- Lire HumanModelEngine, HouseholdEngine, PlanningContextEngine.
- Stocker noms, prénoms, adresses, calendriers, santé, finances, localisation.
- Fusionner flux Personal Memory et Universal Learning.
- Servir une connaissance dérivée d'un seul foyer identifiable.
- Contourner le pipeline de validation §7.

## Interfaces publiques (cibles)

```typescript
interface IUniversalLearningEngine {
  /** Lecture — hints pour compréhension */
  lookupLanguageHints(normalizedPhrase: string): UniversalHint[];

  /** Lecture — stratégies planification générales */
  lookupPlanningStrategies(context: GeneralPlanningContext): UniversalStrategy[];

  /** Contribution — uniquement signaux pré-anonymisés */
  submitAnonymizedSignal(signal: AnonymizedSignal): SubmissionResult;

  /** Interne — validation candidat */
  validateCandidate(candidate: KnowledgeCandidate): ValidationResult;
}
```

## Événements émis

| Événement | Payload | Quand |
|-----------|---------|-------|
| `universal.knowledge.validated` | `{ patternId, type }` | Candidat accepté |
| `universal.knowledge.rejected` | `{ reason }` | Candidat rejeté (PII, non généralisable) |
| `universal.hint.served` | `{ query, hintCount }` | Lookup IntentEngine |

## Événements consommés

| Événement | Action |
|-----------|--------|
| `anonymization.gate.passed` | Traiter signal agrégé |
| `anonymization.gate.blocked` | Log + alerte QA si tentative PII |

## Mapping code actuel

| Fichier | Rôle |
|---------|------|
| — | **Aucune implémentation** |
| `languageMemory/colloquialPatternRegistry.ts` | Patterns statiques — **pas** ULE ; migration future vers store validé |
| `languageMemory/*` | Personal Memory — **distinct** |

## Chevauchements identifiés

| Avec | Nature | Résolution |
|------|--------|------------|
| PersonalLanguageMemoryEngine | Expressions personnelles vs universelles | Frontière stricte — doc §10 |
| KnowledgeEngine | Faits externes web vs apprentissage collectif | Moteurs séparés |
| colloquialPatternRegistry | Patterns hardcodés | Migrer vers ULE validé progressivement |

## Invariants (tests futurs)

1. Aucune entrée contenant PII n'est acceptée.
2. Aucune lecture depuis tables `profile_facts`, `households`, `user_language_expressions` sans anonymisation.
3. `lookupLanguageHints` ne retourne jamais de donnée liée à un `memberId`.
4. Personal et Universal stores physiquement séparés.
