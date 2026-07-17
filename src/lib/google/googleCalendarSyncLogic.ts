import { classifyGoogleEvent } from "./classifyGoogleEvent";
import type {
  ExternalCalendarEventRecord,
  GoogleCalendarEventPayload,
} from "../../types/googleCalendar";

export type ParsedGoogleEvent = {
  external_event_id: string;
  external_calendar_id: string;
  title: string;
  description: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string;
  all_day: boolean;
  recurrence: string | null;
  status: "confirmed" | "cancelled" | "tentative";
  event_type: ReturnType<typeof classifyGoogleEvent>;
  raw_metadata: Record<string, unknown>;
};

function parseGoogleStatus(status?: string): ParsedGoogleEvent["status"] {
  if (status === "cancelled") return "cancelled";
  if (status === "tentative") return "tentative";
  return "confirmed";
}

function exclusiveEndDate(dateOnly: string): string {
  const end = new Date(`${dateOnly}T12:00:00`);
  end.setDate(end.getDate() - 1);
  return end.toISOString().slice(0, 10);
}

export function parseGoogleEventPayload({
  event,
  calendarId,
  calendarName,
}: {
  event: GoogleCalendarEventPayload;
  calendarId: string;
  calendarName?: string;
}): ParsedGoogleEvent | null {
  if (!event.id) return null;

  const allDay = Boolean(event.start?.date && !event.start?.dateTime);
  let startsAt: string;
  let endsAt: string;

  if (allDay && event.start?.date) {
    const startDate = event.start.date;
    const endDateRaw = event.end?.date ?? event.start.date;
    const inclusiveEnd = exclusiveEndDate(endDateRaw);
    startsAt = new Date(`${startDate}T00:00:00`).toISOString();
    endsAt = new Date(`${inclusiveEnd}T23:59:59.999`).toISOString();
  } else if (event.start?.dateTime && event.end?.dateTime) {
    startsAt = new Date(event.start.dateTime).toISOString();
    endsAt = new Date(event.end.dateTime).toISOString();
  } else {
    return null;
  }

  return {
    external_event_id: event.recurringEventId ?? event.id,
    external_calendar_id: calendarId,
    title: event.summary?.trim() || "Événement Google",
    description: event.description ?? null,
    location: event.location ?? null,
    starts_at: startsAt,
    ends_at: endsAt,
    all_day: allDay,
    recurrence: event.recurringEventId ? "recurring" : null,
    status: parseGoogleStatus(event.status),
    event_type: classifyGoogleEvent(event, calendarName),
    raw_metadata: {
      htmlLink: event.htmlLink,
      googleEventId: event.id,
      recurringEventId: event.recurringEventId,
    },
  };
}

export function upsertExternalEvents({
  existing,
  incoming,
}: {
  existing: ExternalCalendarEventRecord[];
  incoming: ParsedGoogleEvent[];
}): {
  upserted: ParsedGoogleEvent[];
  cancelledIds: string[];
  duplicateCount: number;
} {
  const byExternalId = new Map(
    existing.map((item) => [item.external_event_id, item]),
  );
  const seen = new Set<string>();
  let duplicateCount = 0;

  for (const event of incoming) {
    if (seen.has(event.external_event_id)) {
      duplicateCount += 1;
      continue;
    }
    seen.add(event.external_event_id);
    byExternalId.set(event.external_event_id, {
      ...(byExternalId.get(event.external_event_id) as ExternalCalendarEventRecord),
      ...event,
    } as ExternalCalendarEventRecord);
  }

  const upserted = incoming.filter((event, index, array) => {
    return array.findIndex((item) => item.external_event_id === event.external_event_id) === index;
  });

  const incomingIds = new Set(incoming.map((event) => event.external_event_id));
  const cancelledIds = existing
    .filter(
      (item) =>
        item.status !== "cancelled" &&
        incoming.some(
          (parsed) =>
            parsed.external_event_id === item.external_event_id &&
            parsed.status === "cancelled",
        ),
    )
    .map((item) => item.id);

  for (const parsed of incoming) {
    if (parsed.status === "cancelled" && !incomingIds.has(parsed.external_event_id)) {
      cancelledIds.push(parsed.external_event_id);
    }
  }

  return { upserted, cancelledIds, duplicateCount };
}

export function validateOAuthCallbackParams(params: {
  code?: string | null;
  state?: string | null;
  error?: string | null;
}): { valid: true; code: string; state: string } | { valid: false; reason: string } {
  if (params.error) {
    return { valid: false, reason: params.error };
  }

  if (!params.code) {
    return { valid: false, reason: "Code OAuth absent." };
  }

  if (!params.state) {
    return { valid: false, reason: "État OAuth absent." };
  }

  return { valid: true, code: params.code, state: params.state };
}

export function shouldAutoSync(lastSyncedAt: string | null, now = Date.now()): boolean {
  if (!lastSyncedAt) return true;
  const last = new Date(lastSyncedAt).getTime();
  const sixHours = 6 * 60 * 60 * 1000;
  return now - last > sixHours;
}
