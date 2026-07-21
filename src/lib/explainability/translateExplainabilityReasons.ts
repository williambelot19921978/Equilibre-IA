/**
 * EPIC1-B — Human-readable translation of engine reason codes.
 */

import type { DecisionFactor } from "../../types/lifeDecision";
import {
  EXPLAINABILITY_REASON_PRIORITY,
  MAX_EXPLAINABILITY_REASONS,
  type ExplainabilityReasonCode,
} from "./explainabilityReasonCodes";

const REASON_COPY: Record<ExplainabilityReasonCode, string> = {
  FREE_SLOT: "Tu disposes d'un créneau libre.",
  DURATION_COMPATIBLE: "La durée disponible convient à cette activité.",
  NO_CONFLICT: "Aucun autre engagement n'entre en conflit.",
  HIGH_PRIORITY: "Cette tâche est actuellement prioritaire.",
  SPORT_ALREADY_PLANNED: "Ta séance est déjà inscrite au planning.",
  SPORT_ALREADY_DONE: "Tu as déjà bougé aujourd'hui.",
  NO_CHANGE_NEEDED: "Aucun changement n'est nécessaire.",
  AFTERNOON_DENSE: "Ton après-midi compte plusieurs engagements.",
  AVOID_HEAVY_TASKS:
    "Mieux vaut éviter d'ajouter de nouvelles tâches importantes.",
  SLOT_FITS_ACTIVITY: "Le créneau est adapté à cette activité.",
  STUDY_GOAL_PENDING:
    "Ton objectif de révision mérite encore un effort cette semaine.",
  CALM_MOMENT: "C'est un moment calme dans ta journée.",
  SUFFICIENT_ENERGY: "Ton énergie semble suffisante pour avancer.",
  HOUSEHOLD_MEMBER_AVAILABLE: "Un membre du foyer dispose de temps libre.",
  HOUSEHOLD_MEMBER_LOW_MARGIN: "Un membre du foyer a peu de marge aujourd'hui.",
  HOUSEHOLD_SHARED_WINDOW: "Un créneau commun semble disponible.",
  HOUSEHOLD_BOTH_BUSY_DAY: "La journée du foyer est globalement dense.",
  HOUSEHOLD_GOAL_STALE: "Un objectif n'a pas avancé depuis plusieurs jours.",
  HOUSEHOLD_SUPPORT_POSSIBLE: "Un soutien ponctuel pourrait être utile.",
};

const TECHNICAL_PATTERN =
  /(\{|\}|"score"|confidence|proposalId|p\d-|\b\d{2,3}\s*%|JSON|engine|factor\.id)/i;

export function translateExplainabilityReason(
  code: ExplainabilityReasonCode,
): string {
  return REASON_COPY[code];
}

export function rankExplainabilityReasonCodes(
  codes: readonly ExplainabilityReasonCode[],
): ExplainabilityReasonCode[] {
  const unique = [...new Set(codes)];

  return EXPLAINABILITY_REASON_PRIORITY.filter((code) => unique.includes(code));
}

export function translateExplainabilityReasons(
  codes: readonly ExplainabilityReasonCode[],
): string[] {
  return rankExplainabilityReasonCodes(codes)
    .slice(0, MAX_EXPLAINABILITY_REASONS)
    .map(translateExplainabilityReason)
    .filter((line) => line.length > 0 && !TECHNICAL_PATTERN.test(line));
}

export function mapReasoningFactorToCode(
  factor: DecisionFactor,
): ExplainabilityReasonCode | null {
  if (!factor.positive) return null;

  switch (factor.id) {
    case "slot-fit":
      return "SLOT_FITS_ACTIVITY";
    case "study-goal":
      return "STUDY_GOAL_PENDING";
    case "calm-slot":
      return "CALM_MOMENT";
    case "energy-ok":
      return "SUFFICIENT_ENERGY";
    default:
      return null;
  }
}

export function containsTechnicalExplainabilityText(text: string): boolean {
  return TECHNICAL_PATTERN.test(text);
}
