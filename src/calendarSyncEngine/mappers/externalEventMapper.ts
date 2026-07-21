/**
 * EPIC 5B — Map external_calendar_events → CalendarItem.
 */

import type { ExternalCalendarEventRecord } from "../../types/googleCalendar";
import type { CalendarItem, CalendarItemType } from "../../planningCalendarEngine/types/calendarItem";

const DEFAULT_TIMEZONE = "America/Montreal";

function mapEventType(eventType: string): CalendarItemType {
  if (eventType === "appointment") return "appointment";
  if (eventType === "birthday") return "event";
  if (eventType === "work") return "event";
  if (eventType === "vacation") return "event";
  if (eventType === "family") return "event";
  return "event";
}

export function externalEventToCalendarItem(
  record: ExternalCalendarEventRecord,
  timezone = DEFAULT_TIMEZONE,
): CalendarItem {
  return {
    id: `google-${record.external_event_id}`,
    type: mapEventType(record.event_type),
    title: record.title,
    description: record.description ?? undefined,
    start: record.starts_at,
    end: record.ends_at,
    timezone,
    allDay: record.all_day,
    location: record.location ?? undefined,
    owner: record.user_id,
    household: record.household_id,
    participants: [],
    status: record.status === "cancelled" ? "cancelled" : record.status === "tentative" ? "tentative" : "confirmed",
    priority: 3,
    origin: "google",
    syncState: "synced",
    source: "google-calendar",
    editable: false,
    recurrence: record.recurrence ? { rule: record.recurrence } : undefined,
    metadata: {
      externalEventId: record.external_event_id,
      googleEventId: record.raw_metadata?.googleEventId,
      externalCalendarId: record.external_calendar_id,
      provider: record.provider,
      htmlLink: record.raw_metadata?.htmlLink,
      lastSyncedAt: record.last_synced_at,
      updatedAt: record.updated_at,
    },
  };
}
