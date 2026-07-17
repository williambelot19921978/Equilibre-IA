import { discoveryQuestions } from "../../config/discoveryQuestions";
import {
  buildFactsValueMap,
  countAnsweredDiscoveryQuestions,
  countApplicableDiscoveryQuestions,
  filterAvailableQuestions,
} from "../discovery/questionFilters";
import type { ProfileFactRecord } from "../../types";

const BASE_PROFILE_REQUIRED_KEY = "main_priority";

export type DiscoveryProgressSummary = {
  percentage: number;
  answeredCount: number;
  applicableCount: number;
  remainingCount: number;
  isComplete: boolean;
};

export function getDiscoveryProgressSummary(
  facts: ProfileFactRecord[],
): DiscoveryProgressSummary {
  const factsMap = buildFactsValueMap(facts);
  const applicableCount = countApplicableDiscoveryQuestions(
    discoveryQuestions,
    factsMap,
  );
  const answeredCount = countAnsweredDiscoveryQuestions(
    discoveryQuestions,
    factsMap,
  );
  const remainingQuestions = filterAvailableQuestions(
    discoveryQuestions,
    factsMap,
  );

  const percentage =
    applicableCount === 0
      ? 100
      : Math.min(100, Math.round((answeredCount / applicableCount) * 100));

  return {
    percentage,
    answeredCount,
    applicableCount,
    remainingCount: remainingQuestions.length,
    isComplete: remainingQuestions.length === 0,
  };
}

/** Source de vérité unique pour Home, Discovery et navigation. */
export function calculateDiscoveryProgress(
  facts: ProfileFactRecord[],
): number {
  return getDiscoveryProgressSummary(facts).percentage;
}

export function isBaseProfileComplete(
  facts: ProfileFactRecord[],
): boolean {
  const mainPriorityFact = facts.find(
    (fact) => fact.fact_key === BASE_PROFILE_REQUIRED_KEY,
  );
  const value = mainPriorityFact?.fact_value?.value;

  return typeof value === "string" && value.trim().length > 0;
}

export function isDiscoveryComplete(
  facts: ProfileFactRecord[],
): boolean {
  return getDiscoveryProgressSummary(facts).isComplete;
}
