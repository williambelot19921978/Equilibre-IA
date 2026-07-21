/**
 * EPIC3-B — Household opportunity types (suggest only, no actions).
 */

import type { ExplainabilityReasonCode } from "../lib/explainability/explainabilityReasonCodes";

export type HouseholdOpportunityKind =
  | "load_imbalance"
  | "shared_free_time"
  | "both_busy"
  | "stale_goal_support";

export type HouseholdOpportunity = {
  readonly id: string;
  readonly kind: HouseholdOpportunityKind;
  readonly title: string;
  readonly explanation: string;
  readonly explainabilityReasonCodes: readonly ExplainabilityReasonCode[];
  readonly contextLabels: readonly string[];
  readonly priority: number;
};

export type PresentedHouseholdOpportunity = HouseholdOpportunity & {
  readonly whyReasons: readonly string[];
};

export const MAX_HOUSEHOLD_OPPORTUNITIES = 3;
