/** EPIC 6B — Proactive behavior rule (observations only). */

import type { HumanModelRule } from "../types/ruleTypes";
import { ruleOutput } from "../types/ruleTypes";

export type ProactiveBehaviorSummary = {
  readonly interruptionTolerance: number;
  readonly notificationPreference: "minimal" | "balanced" | "active";
  readonly acceptanceRate: number;
  readonly dismissRate: number;
  readonly preferredMoments: readonly string[];
};

export const proactiveBehaviorRule: HumanModelRule<ProactiveBehaviorSummary | null> = {
  id: "proactiveBehavior",
  label: "Comportement proactif",
  evaluate(input) {
    if (!input.proactiveEnabled) {
      return ruleOutput(null, 0, "Proactive Intelligence désactivé.", [], ["Proactive Engine"]);
    }

    const metrics = input.proactiveBehaviorMetrics;
    if (!metrics) {
      return ruleOutput(null, 0.2, "Métriques proactives indisponibles.", [], [
        "Historique suggestions",
      ]);
    }

    const reasons: string[] = [];
    if (metrics.dismissRate > 0.6) {
      reasons.push("Taux de refus élevé — interventions réduites.");
    }
    if (metrics.acceptanceRate > 0.6) {
      reasons.push("Bon taux d'acceptation — suggestions adaptées.");
    }
    if (metrics.notificationPreference === "minimal") {
      reasons.push("Préférence notifications minimales.");
    }

    return ruleOutput(
      {
        interruptionTolerance: metrics.interruptionTolerance,
        notificationPreference: metrics.notificationPreference,
        acceptanceRate: metrics.acceptanceRate,
        dismissRate: metrics.dismissRate,
        preferredMoments: metrics.preferredMoments,
      },
      Math.min(0.9, 0.4 + metrics.acceptanceRate * 0.3 + metrics.interruptionTolerance * 0.2),
      "Métriques proactives dérivées des observations utilisateur.",
      reasons,
    );
  },
};
