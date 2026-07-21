/**
 * EPIC 6B — Attention Engine.
 * Détermine si une intervention est utile — toujours explicable.
 */

import type { AttentionDecision, CalendarEventInput, ProactiveSuggestion } from "../types/proactiveTypes";
import { evaluateQuietHours, DEFAULT_QUIET_HOURS, type QuietHoursConfig } from "../quiet/quietHoursPolicy";
import {
  detectSensitivePeriod,
  interventionEndTime,
  PERIOD_LABELS,
  shouldBlockIntervention,
} from "../policy/interventionPolicy";
import { computeProactiveScore, dismissHistoryPenalty } from "../score/proactiveScoreEngine";

export function evaluateAttention(input: {
  readonly suggestion: ProactiveSuggestion;
  readonly now: string;
  readonly calendarEvents: readonly CalendarEventInput[];
  readonly mentalLoad: number;
  readonly availability: number;
  readonly dismissCount: number;
  readonly totalShown: number;
  readonly kindDismissRate?: number;
  readonly quietConfig?: QuietHoursConfig;
}): AttentionDecision & { readonly score: ReturnType<typeof computeProactiveScore> } {
  const quiet = evaluateQuietHours({
    now: input.now,
    config: input.quietConfig ?? DEFAULT_QUIET_HOURS,
    calendarEvents: input.calendarEvents,
  });

  const dismissPenalty = dismissHistoryPenalty({
    dismissCount: input.dismissCount,
    totalShown: input.totalShown,
    kindDismissRate: input.kindDismissRate,
  });

  const score = computeProactiveScore({
    urgency: input.suggestion.urgency,
    importance: input.suggestion.priority / 100,
    confidence: input.suggestion.confidence,
    userImpact: 0.6,
    opportuneMoment: quiet.isQuiet ? 0.1 : 0.75,
    mentalLoad: input.mentalLoad,
    dismissHistory: dismissPenalty,
    availability: input.availability,
  });

  if (quiet.isQuiet) {
    return {
      shouldIntervene: false,
      delayUntil: quiet.deferUntil,
      cancel: false,
      why: quiet.reason ?? "Période de quiet hours.",
      whyNotNow: "Attente de la fin de la période sensible.",
      sensitivePeriod: quiet.reason,
      score,
    };
  }

  const sensitive = detectSensitivePeriod({
    calendarEvents: input.calendarEvents,
    now: input.now,
  });

  if (sensitive && shouldBlockIntervention(sensitive.kind)) {
    return {
      shouldIntervene: false,
      delayUntil: interventionEndTime(sensitive.event),
      cancel: false,
      why: `Intervention différée — ${PERIOD_LABELS[sensitive.kind]} en cours.`,
      whyNotNow: `Attendre la fin de : ${sensitive.event.title}.`,
      sensitivePeriod: sensitive.kind,
      score,
    };
  }

  if (!score.shouldDisplay) {
    return {
      shouldIntervene: false,
      cancel: true,
      why: `Score insuffisant (${Math.round(score.finalScore * 100)}%) — suggestion annulée.`,
      whyNotNow: dismissPenalty > 0.2 ? "Historique de refus élevé pour ce type." : "Moment non opportun.",
      score,
    };
  }

  if (input.mentalLoad > 0.85 && input.suggestion.urgency < 0.7) {
    return {
      shouldIntervene: false,
      delayUntil: undefined,
      cancel: false,
      why: "Charge mentale élevée — suggestion non urgente différée.",
      whyNotNow: "Attendre une baisse de charge mentale.",
      score,
    };
  }

  return {
    shouldIntervene: true,
    cancel: false,
    why: `Score ${Math.round(score.finalScore * 100)}% — moment opportun.`,
    whyNotNow: undefined,
    score,
  };
}

export class AttentionEngine {
  evaluate(input: Parameters<typeof evaluateAttention>[0]): ReturnType<typeof evaluateAttention> {
    return evaluateAttention(input);
  }
}

export const defaultAttentionEngine = new AttentionEngine();
