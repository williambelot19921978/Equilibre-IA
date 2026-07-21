/**
 * EPIC 5A — Calendar connector contract (external sync — not implemented).
 */

import type { CalendarItem } from "../types/calendarItem";

export const CALENDAR_CONNECTOR_NOT_IMPLEMENTED =
  "Synchronisation agenda externe — non implémentée dans EPIC 5A.";

export type CalendarConnectorResult = {
  readonly success: boolean;
  readonly message: string;
  readonly items?: readonly CalendarItem[];
  readonly redirectUrl?: string;
};

export type CalendarConnector = {
  readonly id: string;
  readonly label: string;
  connect(): Promise<CalendarConnectorResult>;
  disconnect(): Promise<CalendarConnectorResult>;
  fetchEvents(range: { start: string; end: string }): Promise<CalendarConnectorResult>;
  pushChanges(items: readonly CalendarItem[]): Promise<CalendarConnectorResult>;
  deleteEvent(eventId: string): Promise<CalendarConnectorResult>;
  updateEvent(item: CalendarItem): Promise<CalendarConnectorResult>;
  watch(): Promise<CalendarConnectorResult>;
};

function notImplemented(): CalendarConnectorResult {
  return { success: false, message: CALENDAR_CONNECTOR_NOT_IMPLEMENTED };
}

export function createStubCalendarConnector(id: string, label: string): CalendarConnector {
  return {
    id,
    label,
    connect: async () => notImplemented(),
    disconnect: async () => notImplemented(),
    fetchEvents: async () => notImplemented(),
    pushChanges: async () => notImplemented(),
    deleteEvent: async () => notImplemented(),
    updateEvent: async () => notImplemented(),
    watch: async () => notImplemented(),
  };
}

export const stubGoogleCalendarConnector = createStubCalendarConnector(
  "google",
  "Google Calendar",
);

export const stubOutlookConnector = createStubCalendarConnector("outlook", "Outlook");

export const stubAppleCalendarConnector = createStubCalendarConnector(
  "apple",
  "Apple Calendar",
);

export const CALENDAR_CONNECTORS: readonly CalendarConnector[] = [
  stubGoogleCalendarConnector,
  stubOutlookConnector,
  stubAppleCalendarConnector,
];
