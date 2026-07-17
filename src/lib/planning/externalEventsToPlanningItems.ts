import type { CalendarItemRecord } from "../../types";
import type { ExternalCalendarEventRecord } from "../../types/googleCalendar";
import { overlapsLocalDay } from "../time/dayBounds";

export function externalEventToCalendarItem(
  event: ExternalCalendarEventRecord,
): CalendarItemRecord {
  const isBirthday = event.event_type === "birthday";

  return {
    id: `external-${event.id}`,
    household_id: event.household_id,
    user_id: event.user_id,
    task_id: null,
    title: event.title,
    item_type: "event",
    starts_at: event.starts_at,
    ends_at: event.ends_at,
    locked: true,
    source: "calendar_sync",
    details: {
      provider: event.provider,
      externalEventId: event.external_event_id,
      externalCalendarId: event.external_calendar_id,
      eventType: event.event_type,
      allDay: event.all_day,
      location: event.location,
      description: event.description,
      htmlLink: event.raw_metadata?.htmlLink,
      readOnly: true,
      visualType: isBirthday ? "appointment" : "appointment",
      constraintType: isBirthday ? "appointment" : "appointment",
      googleImported: true,
    },
    created_at: event.created_at,
    updated_at: event.updated_at,
  };
}

export function mergeExternalEventsForDay({
  date,
  persistedItems,
  externalEvents,
}: {
  date: string;
  persistedItems: CalendarItemRecord[];
  externalEvents: ExternalCalendarEventRecord[];
}): CalendarItemRecord[] {
  const dayExternal = externalEvents
    .filter(
      (event) =>
        event.status !== "cancelled" &&
        !event.all_day &&
        event.event_type !== "birthday" &&
        overlapsLocalDay({
          startsAt: event.starts_at,
          endsAt: event.ends_at,
          date,
        }),
    )
    .map(externalEventToCalendarItem);

  const existingIds = new Set(persistedItems.map((item) => item.id));

  return [
    ...persistedItems,
    ...dayExternal.filter((item) => !existingIds.has(item.id)),
  ];
}

export function detectGoogleConflictMessages({
  externalEvents,
  flexibleTaskTitles,
  date,
}: {
  externalEvents: ExternalCalendarEventRecord[];
  flexibleTaskTitles: string[];
  date: string;
}): string[] {
  if (flexibleTaskTitles.length === 0) return [];

  const timedEvents = externalEvents.filter(
    (event) =>
      event.status !== "cancelled" &&
      !event.all_day &&
      overlapsLocalDay({
        startsAt: event.starts_at,
        endsAt: event.ends_at,
        date,
      }),
  );

  if (timedEvents.length === 0) return [];

  const event = timedEvents[0];
  const hour = new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(event.starts_at));

  return [
    `Ton rendez-vous Google de ${hour} chevauche une activité existante. J’ai déplacé les tâches flexibles.`,
  ];
}
