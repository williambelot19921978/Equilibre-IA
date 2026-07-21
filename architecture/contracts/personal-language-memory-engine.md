# PersonalLanguageMemoryEngine — Contrat

> ID : `personal-language-memory` · Pipeline #3

## Mission

Apprendre, mémoriser et résoudre les **expressions personnelles** de l'utilisateur (« Je suis sec », « Décale », formulations familières). Pont entre langage naturel individuel et intents structurés.

> **Personal Memory uniquement** — distinct de [UniversalLearningEngine](./universal-learning-engine.md) (patterns collectifs). Voir [`UNIVERSAL_LEARNING_ENGINE.md`](../../Docs/UNIVERSAL_LEARNING_ENGINE.md) §10.

## Entrées

| Entrée | Type conceptuel | Source |
|--------|-----------------|--------|
| `expression` | Texte utilisateur | ConversationEngine |
| `memberId` | Membre (isolation par personne) | HouseholdEngine |
| `humanModelSnapshot` | Traits contextuels | HumanModelEngine |
| `confirmation` | Confirm/reject/correct (optionnel) | ConversationEngine |

## Sorties

| Sortie | Type conceptuel | Consommateur(s) |
|--------|-----------------|-----------------|
| `LanguageResolution` | `{ matched, intent?, meaning?, confidence }` | IntentEngine |
| `learningProposal` | Proposition d'apprentissage | NaturalResponseEngine |
| `hints[]` | Indices pour enrichissement réponse | NaturalResponseEngine |

## Dépendances

| Moteur / couche | Relation | Obligatoire |
|-----------------|----------|-------------|
| HumanModelEngine | Contexte profil | Non |
| IntentEngine | Fallback si pas de match | Oui (aval) |
| Persistance (Supabase) | `user_language_expressions` | Oui |

## Responsabilités

- Matcher expressions apprises au message entrant.
- Proposer confirmation avant de figer une nouvelle expression.
- Gérer niveaux de confiance par expression.
- Isoler la mémoire **par membre** (pas de fuite inter-membres).
- Archiver expressions obsolites.

## Ce qu'il ne doit jamais faire

- Appliquer la mémoire d'un membre à un autre.
- Transformer une hypothèse en fait sans confirmation (Loi 5).
- Exécuter des actions planning.
- Dupliquer toute la logique IntentEngine.

## Interfaces publiques (cibles)

```typescript
interface IPersonalLanguageMemoryEngine {
  resolve(input: ResolveExpressionInput): LanguageResolution;
  learn(input: LearnExpressionInput): LearningResult;
  confirm(expressionId: string, outcome: ConfirmOutcome): void;
  list(memberId: string): PersonalExpression[];
}
```

## Événements émis

| Événement | Payload | Quand |
|-----------|---------|-------|
| `language.expression.matched` | `{ expressionId, intent, confidence }` | Match trouvé |
| `language.expression.learned` | `{ expression, intent }` | Nouvelle expression confirmée |
| `language.expression.rejected` | `{ expressionId }` | Rejet utilisateur |

## Événements consommés

| Événement | Action |
|-----------|--------|
| `humanModel.updated` | Ajuster fingerprint contextuel |

## Mapping code actuel

| Fichier | Rôle | Écart |
|---------|------|-------|
| `src/ai/languageMemory/*` | Résolution, apprentissage, bridge | Bridge trop couplé à actionResolver |
| `src/ai/core/buildLanguageMemoryContext.ts` | Agrège human model slices | Devrait consommer HumanModelEngine |
| `src/services/personalLanguageMemoryService.ts` | CRUD Supabase | OK couche persistance |
| `src/services/languageMemoryService.ts` | Charge contexte | Agrégateur cross-engine |

## Chevauchements identifiés

| Avec | Nature | Résolution |
|------|--------|------------|
| IntentEngine | Résolution intent | PLM → hint ; IntentEngine arbitre final |
| NaturalResponseEngine | Hints dans réponse | hints[] → NaturalResponseEngine uniquement |
