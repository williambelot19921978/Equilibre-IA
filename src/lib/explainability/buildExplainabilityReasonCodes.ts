/**
 * EPIC1-B — Build reason codes from existing engine outputs (orchestrator only).
 */

import type { DecisionFactor } from "../../types/lifeDecision";
import type { ExplainabilityReasonCode } from "./explainabilityReasonCodes";
import {
  mapReasoningFactorToCode,
  rankExplainabilityReasonCodes,
} from "./translateExplainabilityReasons";

export function buildStudyExplainabilityReasonCodes(input: {
  decisionApproved: boolean;
  slotMinutes: number;
  requiredMinutes: number;
  priority: "high" | "medium" | "low";
  reasoningFactors?: DecisionFactor[];
}): ExplainabilityReasonCode[] {
  const codes: ExplainabilityReasonCode[] = ["FREE_SLOT"];

  if (input.requiredMinutes <= input.slotMinutes) {
    codes.push("DURATION_COMPATIBLE");
  }

  if (input.decisionApproved) {
    codes.push("NO_CONFLICT");
  }

  if (input.priority === "high") {
    codes.push("HIGH_PRIORITY");
  }

  for (const factor of input.reasoningFactors ?? []) {
    const mapped = mapReasoningFactorToCode(factor);
    if (mapped) codes.push(mapped);
  }

  return rankExplainabilityReasonCodes(codes);
}

export function buildSportExplainabilityReasonCodes(input: {
  variant: "scheduled" | "completed";
}): ExplainabilityReasonCode[] {
  if (input.variant === "completed") {
    return rankExplainabilityReasonCodes([
      "SPORT_ALREADY_DONE",
      "NO_CHANGE_NEEDED",
    ]);
  }

  return rankExplainabilityReasonCodes([
    "SPORT_ALREADY_PLANNED",
    "NO_CHANGE_NEEDED",
  ]);
}

export function buildTimeRiskExplainabilityReasonCodes(): ExplainabilityReasonCode[] {
  return rankExplainabilityReasonCodes([
    "AFTERNOON_DENSE",
    "AVOID_HEAVY_TASKS",
  ]);
}
