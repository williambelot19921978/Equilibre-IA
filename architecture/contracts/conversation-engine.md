# ConversationEngine — Contrat

> ID : `conversation-engine` · Pipeline #1 · Conversation Context

## Mission

Orchestrer le **contexte conversationnel** d'un tour de dialogue : historique, état de session, actions en attente (`pendingAction`), tour en cours. Point d'entrée unique du cerveau IA côté utilisateur.

## Entrées

| Entrée | Type conceptuel | Source |
|--------|-----------------|--------|
| `userMessage` | Texte + métadonnées (timestamp, canal) | UI / Voix |
| `sessionId` | Identifiant session | Auth / session |
| `memberId` | Membre foyer courant | HouseholdEngine |
| `previousTurns` | Historique N derniers tours | Persistance session |
| `pendingAction` | Action multi-tours en cours (optionnel) | État session |

## Sorties

| Sortie | Type conceptuel | Consommateur(s) |
|--------|-----------------|-----------------|
| `ConversationContext` | Contexte unifié enrichi | IntentEngine, moteurs aval |
| `turnId` | Identifiant du tour | Traçabilité, logs |

## Dépendances

| Moteur / couche | Relation | Obligatoire |
|-----------------|----------|-------------|
| IntentEngine | Délègue compréhension | Oui |
| PersonalLanguageMemoryEngine | Enrichissement parallèle | Non |
| NaturalResponseEngine | Formulation réponse finale | Oui |
| ActionProposalEngine | Propositions d'actions | Oui |
| *(aucun moteur planning direct)* | — | Interdit |

## Responsabilités

- Assembler et maintenir le `ConversationContext` par tour.
- Gérer le cycle de vie des `pendingAction` (création, reprise, expiration, annulation).
- Router le message vers IntentEngine puis la chaîne aval.
- Conserver le fil conversationnel (réponses courtes interprétées en contexte).
- Ne jamais exécuter d'actions sur le calendrier directement.

## Ce qu'il ne doit jamais faire

- Parser les intentions (→ IntentEngine).
- Modifier le planning ou les tâches (→ ActionExecution / services).
- Inventer des faits non mémorisés.
- Contourner les moteurs déterministes de planning.
- Supposer un profil fondateur en dur.

## Interfaces publiques (cibles)

```typescript
interface IConversationEngine {
  processTurn(input: ProcessTurnInput): Promise<ProcessTurnOutput>;
  getContext(sessionId: string): ConversationContext | null;
  setPendingAction(sessionId: string, action: PendingAction): void;
  clearPendingAction(sessionId: string): void;
}
```

| Méthode | Description |
|---------|-------------|
| `processTurn` | Traite un message utilisateur complet |
| `getContext` | Lit le contexte session courant |
| `setPendingAction` | Enregistre une action multi-tours |
| `clearPendingAction` | Annule l'action en attente |

## Événements émis

| Événement | Payload | Quand |
|-----------|---------|-------|
| `conversation.turn.started` | `{ turnId, memberId, message }` | Début traitement |
| `conversation.turn.completed` | `{ turnId, response, actions[] }` | Fin traitement |
| `conversation.pending.created` | `{ pendingAction }` | Action multi-tours créée |
| `conversation.pending.resolved` | `{ pendingAction, outcome }` | Action terminée ou annulée |

## Événements consommés

| Événement | Action |
|-----------|--------|
| `session.expired` | Nettoyer contexte session |
| `member.switched` | Réinitialiser contexte partiel |

## Mapping code actuel

| Fichier | Rôle actuel | Écart vs contrat |
|---------|-------------|------------------|
| `src/ai/nlp/conversationEngine.ts` | `processConversationTurn` — orchestrateur de facto | Mélange orchestration + routing PLM + pending |
| `src/lib/nlp/pendingConversationAction.ts` | Pending générique | Fragmenté (3 fichiers lib) |
| `src/lib/nlp/conversationActionPending.ts` | Pending reschedule fatigue | Devrait être un type de PendingAction unifié |
| `ConversationProvider.tsx` | État React + appels | Contexte en UI, pas moteur isolé |

## Chevauchements identifiés

| Avec | Nature | Résolution prévue |
|------|--------|-------------------|
| PersonalLanguageMemoryEngine | Bridge appelé depuis conversationEngine | ConversationEngine délègue, ne résout pas |
| NaturalResponseEngine | enrichAssistantWithMemory dans le tour | Extraire vers NaturalResponseEngine |
| ActionProposalEngine | handleConversationActionPending | Pending types unifiés sous ConversationEngine |
