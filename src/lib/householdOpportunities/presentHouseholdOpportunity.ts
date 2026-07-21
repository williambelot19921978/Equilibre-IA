/**
 * EPIC3-B — Presentation layer for household opportunities (translation outside React).
 */

import { isExplainableAiEnabled } from "../../config/featureFlags";
import { MAX_EXPLAINABILITY_REASONS } from "../explainability/explainabilityReasonCodes";
import { presentExplainabilityReasons } from "../explainability/presentExplainabilityReasons";
import type {
  HouseholdOpportunity,
  PresentedHouseholdOpportunity,
} from "../../types/householdOpportunity";

export function presentHouseholdOpportunity(
  opportunity: HouseholdOpportunity,
  explainableEnabled: boolean = isExplainableAiEnabled(),
): PresentedHouseholdOpportunity {
  const staticReasons = explainableEnabled
    ? presentExplainabilityReasons(opportunity.explainabilityReasonCodes)
    : [];

  const whyReasons = [...opportunity.contextLabels, ...staticReasons].slice(
    0,
    MAX_EXPLAINABILITY_REASONS,
  );

  return {
    ...opportunity,
    whyReasons,
  };
}

export function presentHouseholdOpportunities(
  opportunities: readonly HouseholdOpportunity[],
  explainableEnabled?: boolean,
): PresentedHouseholdOpportunity[] {
  return opportunities.map((opportunity) =>
    presentHouseholdOpportunity(opportunity, explainableEnabled),
  );
}
