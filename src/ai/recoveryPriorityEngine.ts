import type {
  RecoveryRecommendation,
  RecoveryTaskSignals,
} from "../types/recoveryPriority";

const BLOCKER_OPTIONS = [
  "mauvais horaire",
  "tâche trop longue",
  "manque d'envie",
  "fatigue",
  "difficulté",
  "priorité devenue faible",
  "autre",
] as const;

const NON_PUNITIVE_PREFIX =
  "J'ai remarqué que cette activité a été annulée plusieurs fois. Je vais t'aider à la rendre plus facile à réaliser. ";

export function resolveRecoveryRecommendation(
  signals: RecoveryTaskSignals,
): RecoveryRecommendation {
  const total =
    signals.skipCount + signals.cancellationCount + signals.consecutiveCancellations;

  if (total === 0) {
    return {
      action: "reschedule",
      reason: "Première tentative — un autre créneau peut mieux convenir.",
      confidence: "medium",
      requiresConfirmation: false,
    };
  }

  if (signals.consecutiveCancellations >= 4 || signals.cancellationCount >= 4) {
    return {
      action: "clarify_blocker",
      reason: `${NON_PUNITIVE_PREFIX}Qu'est-ce qui bloque le plus souvent ?`,
      confidence: "high",
      requiresConfirmation: true,
      blockerOptions: [...BLOCKER_OPTIONS],
      recommendedDuration: 10,
    };
  }

  if (signals.consecutiveCancellations >= 3 || total >= 3) {
    const micro = Math.min(15, Math.max(10, Math.floor(signals.durationMinutes * 0.4)));
    return {
      action: "micro_step",
      recommendedDuration: micro,
      reason: `${NON_PUNITIVE_PREFIX}Je te propose seulement ${micro} minutes pour redémarrer sans pression.`,
      confidence: "high",
      requiresConfirmation: true,
    };
  }

  if (signals.consecutiveCancellations >= 2 || total >= 2) {
    const shortened = Math.max(
      10,
      Math.min(20, Math.floor(signals.durationMinutes * 0.5)),
    );
    return {
      action: "shorten",
      recommendedDuration: shortened,
      reason: `Tu as reporté « ${signals.title} » plusieurs fois — une version plus courte pourrait passer.`,
      confidence: "medium",
      requiresConfirmation: true,
    };
  }

  return {
    action: "reschedule",
    reason: `Je peux proposer un autre créneau pour « ${signals.title} ».`,
    confidence: "medium",
    requiresConfirmation: false,
  };
}

export function buildRecoveryMessage(
  recommendation: RecoveryRecommendation,
  taskTitle: string,
): string {
  if (recommendation.action === "deprioritize") {
    return `Cette tâche semble ne plus être prioritaire. Veux-tu la retirer de ton planning ?`;
  }

  if (recommendation.action === "micro_step" && recommendation.recommendedDuration) {
    return `Tu as reporté « ${taskTitle} » ${recommendation.reason.includes("plusieurs") ? "" : ""}${recommendation.reason}`;
  }

  return recommendation.reason;
}

export function isNonPunitiveWording(text: string): boolean {
  const forbidden = ["tu annules trop", "tu procrastines", "tu devrais"];
  const lower = text.toLowerCase();
  return !forbidden.some((phrase) => lower.includes(phrase));
}
