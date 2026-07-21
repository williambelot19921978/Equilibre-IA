/**
 * EPIC 5A — Internal planning provider (calendar items from Supabase).
 */

import type { CalendarItemRecord } from "../../types/database";
import type { ICalendarProvider, ProviderFetchResult } from "./calendarProvider";
import type { PlanningCalendarQuery } from "../types/calendarItem";
import { calendarRecordToItem } from "./mappers";

export type InternalPlanningProviderDeps = {
  readonly loadCalendarItems: (input: {
    userId: string;
    householdId: string;
    date: string;
  }) => Promise<CalendarItemRecord[]>;
};

export function createInternalPlanningProvider(
  deps: InternalPlanningProviderDeps,
): ICalendarProvider {
  return {
    id: "internal-planning",
    label: "Planning interne",
    async fetchItems(query: PlanningCalendarQuery): Promise<ProviderFetchResult> {
      if (!query.householdId) {
        return {
          items: [],
          syncState: "local",
          available: false,
          error: "Foyer requis pour le planning interne.",
        };
      }

      try {
        const date = query.start.slice(0, 10);
        const records = await deps.loadCalendarItems({
          userId: query.userId,
          householdId: query.householdId,
          date,
        });

        const timezone = query.timezone ?? "America/Montreal";
        const startMs = new Date(query.start).getTime();
        const endMs = new Date(query.end).getTime();

        const items = records
          .map((record) => calendarRecordToItem(record, timezone))
          .filter((item) => {
            const itemStart = new Date(item.start).getTime();
            const itemEnd = new Date(item.end).getTime();
            return itemEnd > startMs && itemStart < endMs;
          });

        return { items, syncState: "local", available: true };
      } catch (error) {
        return {
          items: [],
          syncState: "error",
          available: false,
          error: error instanceof Error ? error.message : "Erreur planning interne.",
        };
      }
    },
  };
}
