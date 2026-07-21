/**
 * EPIC1-B — Semantic reason codes (translation layer input only).
 * Populated from existing engine outputs — never invented in UI.
 */

export const EXPLAINABILITY_REASON_CODES = [
  "FREE_SLOT",
  "DURATION_COMPATIBLE",
  "NO_CONFLICT",
  "HIGH_PRIORITY",
  "SPORT_ALREADY_PLANNED",
  "SPORT_ALREADY_DONE",
  "NO_CHANGE_NEEDED",
  "AFTERNOON_DENSE",
  "AVOID_HEAVY_TASKS",
  "SLOT_FITS_ACTIVITY",
  "STUDY_GOAL_PENDING",
  "CALM_MOMENT",
  "SUFFICIENT_ENERGY",
  "HOUSEHOLD_MEMBER_AVAILABLE",
  "HOUSEHOLD_MEMBER_LOW_MARGIN",
  "HOUSEHOLD_SHARED_WINDOW",
  "HOUSEHOLD_BOTH_BUSY_DAY",
  "HOUSEHOLD_GOAL_STALE",
  "HOUSEHOLD_SUPPORT_POSSIBLE",
] as const;

export type ExplainabilityReasonCode =
  (typeof EXPLAINABILITY_REASON_CODES)[number];

export function isExplainabilityReasonCode(
  value: string,
): value is ExplainabilityReasonCode {
  return (EXPLAINABILITY_REASON_CODES as readonly string[]).includes(value);
}

/** Priority order when more than four reasons are available. */
export const EXPLAINABILITY_REASON_PRIORITY: readonly ExplainabilityReasonCode[] =
  [
    "FREE_SLOT",
    "DURATION_COMPATIBLE",
    "NO_CONFLICT",
    "HIGH_PRIORITY",
    "SPORT_ALREADY_PLANNED",
    "SPORT_ALREADY_DONE",
    "NO_CHANGE_NEEDED",
    "AFTERNOON_DENSE",
    "AVOID_HEAVY_TASKS",
    "STUDY_GOAL_PENDING",
    "SLOT_FITS_ACTIVITY",
    "SUFFICIENT_ENERGY",
    "CALM_MOMENT",
    "HOUSEHOLD_MEMBER_AVAILABLE",
    "HOUSEHOLD_MEMBER_LOW_MARGIN",
    "HOUSEHOLD_SHARED_WINDOW",
    "HOUSEHOLD_BOTH_BUSY_DAY",
    "HOUSEHOLD_GOAL_STALE",
    "HOUSEHOLD_SUPPORT_POSSIBLE",
  ];

export const MAX_EXPLAINABILITY_REASONS = 4;
