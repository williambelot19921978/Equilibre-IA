/**
 * EPIC 5A — Calendar provider interface.
 */

import type { CalendarItem, CalendarSyncState, PlanningCalendarQuery } from "../types/calendarItem";

export type ProviderFetchResult = {
  readonly items: readonly CalendarItem[];
  readonly syncState: CalendarSyncState;
  readonly available: boolean;
  readonly error?: string;
};

export type ICalendarProvider = {
  readonly id: string;
  readonly label: string;
  fetchItems(query: PlanningCalendarQuery): Promise<ProviderFetchResult>;
};
