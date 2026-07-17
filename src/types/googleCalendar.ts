export type GoogleConnectionStatus = "connected" | "disconnected" | "error";

export type GoogleCalendarConnectionRecord = {
  id: string;
  user_id: string;
  household_id: string;
  google_account_email: string;
  scopes: string[];
  status: GoogleConnectionStatus;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
};

export type GoogleCalendarRecord = {
  id: string;
  connection_id: string;
  google_calendar_id: string;
  name: string;
  color: string | null;
  selected_for_sync: boolean;
  is_primary: boolean;
  time_zone: string | null;
  created_at: string;
  updated_at: string;
};

export type ExternalEventType =
  | "appointment"
  | "birthday"
  | "work"
  | "vacation"
  | "family"
  | "other";

export type ExternalCalendarEventRecord = {
  id: string;
  household_id: string;
  user_id: string;
  provider: "google";
  external_calendar_id: string;
  external_event_id: string;
  title: string;
  description: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string;
  all_day: boolean;
  recurrence: string | null;
  status: "confirmed" | "cancelled" | "tentative";
  event_type: ExternalEventType;
  raw_metadata: Record<string, unknown> | null;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
};

export type GoogleCalendarListItem = {
  id: string;
  summary: string;
  primary?: boolean;
  backgroundColor?: string;
  timeZone?: string;
};

export type GoogleCalendarEventPayload = {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  status?: string;
  start?: { date?: string; dateTime?: string; timeZone?: string };
  end?: { date?: string; dateTime?: string; timeZone?: string };
  htmlLink?: string;
  recurringEventId?: string;
  eventType?: string;
};
