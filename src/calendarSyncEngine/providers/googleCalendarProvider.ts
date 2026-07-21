/**
 * EPIC 5B — Google Calendar provider for PlanningCalendarEngine.
 * Reads synced external_calendar_events — never calls Google API directly.
 */

import type { ExternalCalendarEventRecord } from "../../types/googleCalendar";
import type { ICalendarProvider, ProviderFetchResult } from "../../planningCalendarEngine/providers/calendarProvider";
import type { PlanningCalendarQuery } from "../../planningCalendarEngine/types/calendarItem";
import { externalEventToCalendarItem } from "../mappers/externalEventMapper";
import { isGoogleCalendarEnabled } from "../../config/featureFlags";
import { isCalendarSyncEngineEnabled } from "../../config/featureFlags";

export type GoogleCalendarProviderDeps = {
  readonly loadExternalEventsForDate: (input: {
    userId: string;
    householdId: string;
    date: string;
  }) => Promise<ExternalCalendarEventRecord[]>;
  readonly getConnectionStatus?: (input: {
    userId: string;
    householdId: string;
  }) => Promise<"connected" | "disconnected" | "error">;
};

export function createGoogleCalendarProvider(
  deps: GoogleCalendarProviderDeps,
): ICalendarProvider {
  return {
    id: "google-calendar",
    label: "Google Calendar",
    async fetchItems(query: PlanningCalendarQuery): Promise<ProviderFetchResult> {
      if (!isGoogleCalendarEnabled() || !isCalendarSyncEngineEnabled()) {
        return {
          items: [],
          syncState: "pending",
          available: false,
          error: "Synchronisation calendrier désactivée.",
        };
      }

      if (!query.householdId) {
        return {
          items: [],
          syncState: "error",
          available: false,
          error: "Foyer requis pour Google Calendar.",
        };
      }

      try {
        const date = query.start.slice(0, 10);
        const records = await deps.loadExternalEventsForDate({
          userId: query.userId,
          householdId: query.householdId,
          date,
        });

        const timezone = query.timezone ?? "America/Montreal";
        const startMs = new Date(query.start).getTime();
        const endMs = new Date(query.end).getTime();

        const items = records
          .map((record) => externalEventToCalendarItem(record, timezone))
          .filter((item) => {
            const itemStart = new Date(item.start).getTime();
            const itemEnd = new Date(item.end).getTime();
            return itemEnd > startMs && itemStart < endMs;
          });

        const status = deps.getConnectionStatus
          ? await deps.getConnectionStatus({
              userId: query.userId,
              householdId: query.householdId,
            })
          : "connected";

        return {
          items,
          syncState: status === "connected" ? "synced" : status === "error" ? "error" : "pending",
          available: status === "connected",
        };
      } catch (error) {
        return {
          items: [],
          syncState: "error",
          available: false,
          error: error instanceof Error ? error.message : "Erreur Google provider.",
        };
      }
    },
  };
}
