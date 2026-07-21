# NotificationEngine — Contrat

> ID : `notification-engine` · Auxiliaire · *(planifié — ROADMAP Sprint 6)*

## Mission

Canal **parallèle** pour notifications proactives (max 3/jour, jamais après coucher, désactivables). Consomme événements du cerveau sans bloquer le pipeline principal.

## Entrées

| Entrée | Type conceptuel | Source |
|--------|-----------------|--------|
| `events[]` | Événements système | Bus événements moteurs |
| `humanModel.preferences` | Préférences notif | HumanModelEngine |
| `constraints.sleepSchedule` | Heure coucher | ConstraintEngine |

## Sorties

| Sortie | Type conceptuel | Consommateur(s) |
|--------|-----------------|-----------------|
| `Notification[]` | Notifications à envoyer | PWA / push service |
| `suppressed[]` | Notifications bloquées + raison | Logs |

## Dépendances

| Moteur | Obligatoire |
|--------|-------------|
| HumanModelEngine | Oui |
| ConstraintEngine | Oui (sommeil) |

## Responsabilités

- Filtrer selon préférences et limites (AI_RULEBOOK).
- Ne jamais notifier après bedtime.
- Proposer relais couple uniquement avec consentement.
- Traçabilité des notifications envoyées.

## Ce qu'il ne doit jamais faire

- Envoyer message à un membre sans accord initiateur.
- Culpabiliser.
- Bloquer le pipeline conversationnel.
- Décider priorités produit.

## Interfaces publiques (cibles)

```typescript
interface INotificationEngine {
  processEvent(event: SystemEvent): NotificationDecision;
  send(notifications: Notification[]): Promise<SendResult>;
}
```

## Événements consommés

| Événement | Action |
|-----------|--------|
| `reasoning.overload.detected` | Proposer allègement (si proactif autorisé) |
| `decision.confirmation.required` | Rappel doux (si configuré) |
| `household.relay.proposed` | Notifier membre sollicité |

## Événements émis

| Événement | Payload | Quand |
|-----------|---------|-------|
| `notification.sent` | `{ type, memberId }` | Envoi |
| `notification.suppressed` | `{ reason }` | Bloqué (bedtime, quota) |

## Mapping code actuel

| Fichier | Rôle |
|---------|------|
| — | **Non implémenté** (Sprint 6 PWA) |

## Chevauchements

| Avec | Résolution |
|------|------------|
| proactiveCoachEngine | Coach → événements ; NotificationEngine envoie |
