/**
 * EPIC 5C — Household Engine (vision foyer).
 */

import type { SemanticCalendarItem } from "../types/semanticCalendarItem";
import type { HouseholdTimeVision } from "../types/semanticTypes";

export type HouseholdEngineInput = {
  readonly items: readonly SemanticCalendarItem[];
  readonly childrenCount: number;
  readonly memberCount: number;
  readonly freeMinutes: number;
};

export function computeHouseholdVision(input: HouseholdEngineInput): HouseholdTimeVision {
  let togetherMinutes = 0;
  let childrenMinutes = 0;
  let familyMinutes = 0;
  let individualMinutes = 0;

  for (const item of input.items) {
    if (item.status === "cancelled") continue;
    const minutes = item.estimatedDuration;

    if (item.category === "famille") {
      familyMinutes += minutes;
      togetherMinutes += minutes;
      if (/enfant|école/i.test(item.title)) {
        childrenMinutes += minutes;
      }
    } else if (item.participants.length > 1) {
      togetherMinutes += minutes;
    } else {
      individualMinutes += minutes;
    }
  }

  const parentMinutes = input.childrenCount > 0 ? familyMinutes + childrenMinutes * 0.5 : 0;
  const sharedFreeMinutes = Math.max(0, Math.round(input.freeMinutes * (input.memberCount > 1 ? 0.4 : 0.2)));

  return {
    togetherMinutes: Math.round(togetherMinutes),
    sharedFreeMinutes,
    parentMinutes: Math.round(parentMinutes),
    childrenMinutes: Math.round(childrenMinutes),
    individualMinutes: Math.round(individualMinutes),
    confidence: input.items.length > 0 ? 0.7 : 0.35,
  };
}
