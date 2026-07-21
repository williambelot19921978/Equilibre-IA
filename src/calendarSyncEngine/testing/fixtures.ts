/**
 * EPIC 5B — Test fixtures for Calendar Sync Engine.
 */

import type { CalendarItem } from "../../planningCalendarEngine/types/calendarItem";
import type { ExternalCalendarEventRecord } from "../../types/googleCalendar";
import type { GoogleCalendarConnectionRecord } from "../../types/googleCalendar";

const TZ = "America/Montreal";

export function syncItem(
  overrides: Partial<CalendarItem> & Pick<CalendarItem, "id" | "title" | "start" | "end">,
): CalendarItem {
  return {
    type: "event",
    description: undefined,
    timezone: TZ,
    allDay: false,
    owner: "user-1",
    household: "hh-1",
    participants: [],
    status: "confirmed",
    priority: 3,
    origin: "internal",
    syncState: "synced",
    source: "internal-planning",
    editable: true,
    metadata: {},
    ...overrides,
  };
}

export const LOCAL_LINKED_ITEM = syncItem({
  id: "local-ext-1",
  title: "Réunion équipe",
  start: "2026-07-20T14:00:00.000Z",
  end: "2026-07-20T15:00:00.000Z",
  origin: "internal",
  metadata: { externalEventId: "g-event-1", googleEventId: "g-event-1" },
});

export const EXTERNAL_ITEM = syncItem({
  id: "google-g-event-1",
  title: "Réunion équipe",
  start: "2026-07-20T14:00:00.000Z",
  end: "2026-07-20T15:00:00.000Z",
  origin: "google",
  source: "google-calendar",
  editable: false,
  metadata: { externalEventId: "g-event-1", googleEventId: "g-event-1" },
});

export const EXTERNAL_ITEM_MOVED = syncItem({
  ...EXTERNAL_ITEM,
  start: "2026-07-21T14:00:00.000Z",
  end: "2026-07-21T15:00:00.000Z",
});

export const LOCAL_ITEM_MOVED = syncItem({
  ...LOCAL_LINKED_ITEM,
  start: "2026-07-20T10:00:00.000Z",
  end: "2026-07-20T11:00:00.000Z",
});

export const EXTERNAL_ITEM_RENAMED = syncItem({
  ...EXTERNAL_ITEM,
  title: "Réunion équipe (modifiée)",
});

export function externalRecord(
  overrides: Partial<ExternalCalendarEventRecord> &
    Pick<ExternalCalendarEventRecord, "external_event_id" | "title">,
): ExternalCalendarEventRecord {
  return {
    id: `rec-${overrides.external_event_id}`,
    household_id: "hh-1",
    user_id: "user-1",
    provider: "google",
    external_calendar_id: "cal-primary",
    description: null,
    location: null,
    starts_at: "2026-07-20T14:00:00.000Z",
    ends_at: "2026-07-20T15:00:00.000Z",
    all_day: false,
    recurrence: null,
    status: "confirmed",
    event_type: "work",
    raw_metadata: { googleEventId: overrides.external_event_id },
    last_synced_at: "2026-07-20T12:00:00.000Z",
    created_at: "2026-07-20T10:00:00.000Z",
    updated_at: "2026-07-20T12:00:00.000Z",
    ...overrides,
  };
}

export const CONNECTION_CONNECTED: GoogleCalendarConnectionRecord = {
  id: "conn-1",
  user_id: "user-1",
  household_id: "hh-1",
  google_account_email: "user@gmail.com",
  scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
  status: "connected",
  last_synced_at: "2026-07-20T12:00:00.000Z",
  created_at: "2026-07-20T08:00:00.000Z",
  updated_at: "2026-07-20T12:00:00.000Z",
};

export const DAY_START = "2026-07-20T00:00:00.000Z";
export const DAY_END = "2026-07-20T23:59:59.999Z";
