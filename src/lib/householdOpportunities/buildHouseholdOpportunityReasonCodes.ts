/**
 * EPIC3-B — Reason codes for household opportunities (orchestrator only).
 */

import type { ExplainabilityReasonCode } from "../explainability/explainabilityReasonCodes";
import { rankExplainabilityReasonCodes } from "../explainability/translateExplainabilityReasons";

export function buildLoadImbalanceReasonCodes(
  noConflict: boolean = true,
): ExplainabilityReasonCode[] {
  const codes: ExplainabilityReasonCode[] = [
    "HOUSEHOLD_MEMBER_AVAILABLE",
    "HOUSEHOLD_MEMBER_LOW_MARGIN",
  ];

  if (noConflict) {
    codes.push("NO_CONFLICT");
  }

  return rankExplainabilityReasonCodes(codes);
}

export function buildSharedFreeTimeReasonCodes(): ExplainabilityReasonCode[] {
  return rankExplainabilityReasonCodes([
    "HOUSEHOLD_SHARED_WINDOW",
    "CALM_MOMENT",
    "NO_CONFLICT",
  ]);
}

export function buildBothBusyReasonCodes(): ExplainabilityReasonCode[] {
  return rankExplainabilityReasonCodes([
    "HOUSEHOLD_BOTH_BUSY_DAY",
    "AVOID_HEAVY_TASKS",
    "NO_CHANGE_NEEDED",
  ]);
}

export function buildStaleGoalSupportReasonCodes(): ExplainabilityReasonCode[] {
  return rankExplainabilityReasonCodes([
    "HOUSEHOLD_GOAL_STALE",
    "HOUSEHOLD_SUPPORT_POSSIBLE",
    "HOUSEHOLD_MEMBER_AVAILABLE",
    "NO_CONFLICT",
  ]);
}
