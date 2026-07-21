/**
 * EPIC 5C — SemanticCalendarItem extends CalendarItem without modifying it.
 */

import type { CalendarItem } from "../../planningCalendarEngine/types/calendarItem";
import type { GoalImpactLink, SemanticEnrichment } from "./semanticTypes";

/** CalendarItem enriched with computed semantic fields — never mutates source item. */
export type SemanticCalendarItem = CalendarItem &
  SemanticEnrichment & {
    readonly goalLinks: readonly GoalImpactLink[];
  };

export function wrapSemanticItem(
  item: CalendarItem,
  enrichment: SemanticEnrichment,
  goalLinks: readonly GoalImpactLink[] = [],
): SemanticCalendarItem {
  return {
    ...item,
    ...enrichment,
    goalLinks,
  };
}
