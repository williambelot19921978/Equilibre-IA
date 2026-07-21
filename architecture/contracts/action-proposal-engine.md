# ActionProposalEngine — Contrat

> ID : `action-proposal-engine` · Pipeline #13

## Mission

Transformer intent + décision validée en **actions typées** (`NlpAction[]`, `PendingAction`, replan requests) prêtes pour exécution. Pont entre compréhension et couche services.

## Entrées

| Entrée | Type conceptuel | Source |
|--------|-----------------|--------|
| `intentResult` | Intent + entités | IntentEngine |
| `decisionValidation` | Décision approuvée | DecisionEngine |
| `reasoningResult` | Contexte arbitré | ReasoningEngine |
| `conversationContext` | Pending, historique | ConversationEngine |

## Sorties

| Sortie | Type conceptuel | Consommateur(s) |
|--------|-----------------|-----------------|
| `proposedActions[]` | Actions typées | ActionExecution (nlpActionService) |
| `pendingAction` | Action multi-tours | ConversationEngine |
| `confirmationPrompt` | Demande confirmation | NaturalResponseEngine |

## Dépendances

| Moteur | Obligatoire |
|--------|-------------|
| IntentEngine | Oui |
| DecisionEngine | Oui |
| ConversationEngine | Oui |

## Responsabilités

- Mapper intent → actions concrètes (create_task, reschedule, modify_travel, etc.).
- Gérer flux confirmation (autonomie 1–2).
- Proposer pending actions (fatigue → décale).
- Ne **pas** exécuter — seulement proposer.

## Ce qu'il ne doit jamais faire

- Appeler Supabase ou services directement (→ ActionExecution).
- Formater la réponse finale seul (partagé avec NaturalResponseEngine).
- Exécuter sans validation DecisionEngine.

## Interfaces publiques (cibles)

```typescript
interface IActionProposalEngine {
  resolveActions(input: ResolveActionsInput): ActionProposalResult;
  buildConfirmationPrompt(actions: ProposedAction[]): ConfirmationPrompt;
}
```

## Événements émis

| Événement | Payload | Quand |
|-----------|---------|-------|
| `action.proposed` | `{ actions[] }` | Actions générées |
| `action.confirmation.requested` | `{ prompt }` | Confirmation requise |

## Mapping code actuel

| Fichier | Rôle | Écart |
|---------|------|-------|
| `nlp/actionResolver.ts` | resolveActions, formatAssistantReply | **Mélange** ActionProposal + NaturalResponse |
| `nlp/handleConversationActionPending.ts` | Fatigue reschedule | → types PendingAction unifiés |
| `rescheduleNonUrgentTasksService.ts` | Exécution | Hors cerveau (OK) |

## Chevauchements

| Avec | Résolution |
|------|------------|
| NaturalResponseEngine | Extraire formatAssistantReply |
| SchedulerEngine | Actions calendrier → SchedulerEngine valide slots |
