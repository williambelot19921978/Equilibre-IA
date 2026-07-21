# NaturalResponseEngine — Contrat

> ID : `natural-response-engine` · Pipeline #17

## Mission

Formuler la **réponse naturelle** à l'utilisateur : ton adapté, explications (Loi 4), clarifications, tradeoffs, hints mémoire. Dernier moteur du cerveau avant retour UI.

## Entrées

| Entrée | Type conceptuel | Source |
|--------|-----------------|--------|
| `reasoningResult` | Arbitrage + rationale | ReasoningEngine |
| `proposedActions` | Actions | ActionProposalEngine |
| `recommendations[]` | Suggestions | RecommendationEngine |
| `languageHints[]` | Indices PLM | PersonalLanguageMemoryEngine |
| `humanModel.communicationStyle` | Ton | HumanModelEngine |
| `tradeoffs[]` | Compromis | ReasoningEngine |

## Sorties

| Sortie | Type conceptuel | Consommateur(s) |
|--------|-----------------|-----------------|
| `AssistantMessage` | Texte + métadonnées | UI / Voix |
| `clarificationQuestion` | Question si ambigu | UI |

## Dépendances

| Moteur | Obligatoire |
|--------|-------------|
| ReasoningEngine | Oui |
| ActionProposalEngine | Non |
| HumanModelEngine | Non (ton) |

## Responsabilités

- Produire réponse chaleureuse, claire, non culpabilisante.
- Expliquer **pourquoi** (Loi 4).
- Adapter ton (formel/familier).
- Intégrer hints mémoire sans duplication.
- LLM autorisé pour formulation ; contenu factual depuis moteurs amont.

## Ce qu'il ne doit jamais faire

- Inventer faits non mémorisés.
- Exécuter actions.
- Culpabiliser.
- Dupliquer mission/description dans hints.

## Interfaces publiques (cibles)

```typescript
interface INaturalResponseEngine {
  formatResponse(input: FormatResponseInput): AssistantMessage;
  buildClarification(input: ClarificationInput): ClarificationQuestion;
}
```

## Événements émis

| Événement | Payload | Quand |
|-----------|---------|-------|
| `response.generated` | `{ turnId, length }` | Réponse produite |

## Mapping code actuel

| Fichier | Rôle | Écart |
|---------|------|-------|
| `actionResolver.formatAssistantReply` | Templates réponse | Dans ActionProposal |
| `nlpClarification.buildClarificationForIntent` | Clarifications | OK sous-module |
| `core/enrichAssistantWithMemory` | Prefix hints | OK mais duplication mission corrigée |
| `personalLanguageConversationBridge` | Prompts confirmation | Partiel NaturalResponse |

## Chevauchements

| Avec | Résolution |
|------|------------|
| ActionProposalEngine | Extraire formatAssistantReply ici |
