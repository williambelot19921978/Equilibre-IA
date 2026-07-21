# IntentEngine — Contrat

> ID : `intent-engine` · Pipeline #2 · Compréhension

## Mission

Classifier l'**intention** du message utilisateur et extraire les **entités** structurées (dates, heures, personnes, durées, scope). Première étape de compréhension après le contexte conversationnel.

## Entrées

| Entrée | Type conceptuel | Source |
|--------|-----------------|--------|
| `message` | Texte normalisé | ConversationEngine |
| `conversationContext` | Contexte tour + historique | ConversationEngine |
| `languageHints` | Mappings expressions personnelles (optionnel) | PersonalLanguageMemoryEngine |

## Sorties

| Sortie | Type conceptuel | Consommateur(s) |
|--------|-----------------|-----------------|
| `IntentResult` | `{ intent, confidence, entities[], ambiguities[] }` | ActionProposalEngine, ReasoningEngine |
| `clarificationNeeded` | Question à poser si ambigu | NaturalResponseEngine |

## Dépendances

| Moteur / couche | Relation | Obligatoire |
|-----------------|----------|-------------|
| ConversationEngine | Fournit contexte | Oui (amont) |
| PersonalLanguageMemoryEngine | Peut pré-résoudre intent | Non |
| EntityExtractor (sous-module) | Extraction entités | Interne |

## Responsabilités

- Détecter l'intent principal (`create_task`, `reschedule`, `modify_travel`, `fatigue`, `unknown`, etc.).
- Extraire entités temporelles, personnes, durées, scope.
- Signaler ambiguïtés nécessitant clarification.
- Supporter formulations familières (via hints PLM, pas en dur).
- Rester **déterministe** en V1 ; LLM autorisé en V2 pour ambiguïté uniquement.

## Ce qu'il ne doit jamais faire

- Exécuter des actions sur le planning.
- Résoudre les expressions personnelles apprises (→ PLM).
- Formuler la réponse utilisateur (→ NaturalResponseEngine).
- Hardcoder des prénoms fondateur comme entités nominales par défaut.
- Présenter une hypothèse comme intent certain sans confidence.

## Interfaces publiques (cibles)

```typescript
interface IIntentEngine {
  parse(input: ParseInput): IntentResult;
  detectAmbiguity(result: IntentResult): ClarificationRequest | null;
}
```

| Méthode | Description |
|---------|-------------|
| `parse` | Classifie intent + entités |
| `detectAmbiguity` | Détermine si clarification requise |

## Événements émis

| Événement | Payload | Quand |
|-----------|---------|-------|
| `intent.resolved` | `{ intent, confidence, entities }` | Intent identifié |
| `intent.ambiguous` | `{ candidates[], question }` | Ambiguïté détectée |
| `intent.unknown` | `{ message, fallbackStrategy }` | Intent non reconnu |

## Événements consommés

| Événement | Action |
|-----------|--------|
| `language.expression.matched` | Ajuster intent/entities depuis PLM |

## Mapping code actuel

| Fichier | Rôle actuel | Écart vs contrat |
|---------|-------------|------------------|
| `src/ai/nlp/intentEngine.ts` | `detectIntent`, `parseUserMessage` | ✅ Proche du contrat |
| `src/ai/nlp/entityExtractor.ts` | Extraction entités | Fallback legacy à retirer (F1) |
| `src/ai/nlp/intentMatrix.ts` | Catalogue tests | Doc mirror |
| `src/ai/nlp/textNormalizer.ts` | Normalisation | Duplication partielle avec entityExtractor |

## Chevauchements identifiés

| Avec | Nature | Résolution prévue |
|------|--------|-------------------|
| PersonalLanguageMemoryEngine | Double résolution intent | PLM en amont ; IntentEngine reste fallback |
| colloquialPatternRegistry | Patterns dupliqués | Centraliser patterns ou PLM consomme registry |
