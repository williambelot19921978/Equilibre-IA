/**
 * EPIC 5A — Future external calendar providers (stubs).
 */

import type { ICalendarProvider, ProviderFetchResult } from "./calendarProvider";
import type { PlanningCalendarQuery } from "../types/calendarItem";

const NOT_IMPLEMENTED = "Connecteur non implémenté — EPIC futur.";

function createStubProvider(id: string, label: string): ICalendarProvider {
  return {
    id,
    label,
    async fetchItems(_query: PlanningCalendarQuery): Promise<ProviderFetchResult> {
      return {
        items: [],
        syncState: "pending",
        available: false,
        error: NOT_IMPLEMENTED,
      };
    },
  };
}

export const futureGoogleCalendarProvider = createStubProvider(
  "google-calendar",
  "Google Calendar",
);

export const futureOutlookProvider = createStubProvider("outlook", "Outlook");

export const futureAppleProvider = createStubProvider("apple-calendar", "Apple Calendar");

export const FUTURE_EXTERNAL_PROVIDERS: readonly ICalendarProvider[] = [
  futureGoogleCalendarProvider,
  futureOutlookProvider,
  futureAppleProvider,
];
