import { isGoogleCalendarEnabled } from "../config/featureFlags";
import { supabase } from "../lib/supabase/client";
import { shouldAutoSync } from "../lib/google/googleCalendarSyncLogic";
import type {
  ExternalCalendarEventRecord,
  GoogleCalendarConnectionRecord,
  GoogleCalendarRecord,
} from "../types/googleCalendar";

const CONNECTION_SELECT = `
  id,
  user_id,
  household_id,
  google_account_email,
  scopes,
  status,
  last_synced_at,
  created_at,
  updated_at
`;

const CALENDAR_SELECT = `
  id,
  connection_id,
  google_calendar_id,
  name,
  color,
  selected_for_sync,
  is_primary,
  time_zone,
  created_at,
  updated_at
`;

const EVENT_SELECT = `
  id,
  household_id,
  user_id,
  provider,
  external_calendar_id,
  external_event_id,
  title,
  description,
  location,
  starts_at,
  ends_at,
  all_day,
  recurrence,
  status,
  event_type,
  raw_metadata,
  last_synced_at,
  created_at,
  updated_at
`;

async function invokeFunction<T>(
  name: string,
  body: Record<string, unknown> = {},
): Promise<T> {
  if (!isGoogleCalendarEnabled()) {
    throw new Error("Google Calendar n’est pas activé pour cette version.");
  }

  const { data, error } = await supabase.functions.invoke(name, { body });

  if (error) {
    throw new Error(error.message);
  }

  return data as T;
}

export async function getGoogleCalendarConnection(
  userId: string,
  householdId: string,
): Promise<GoogleCalendarConnectionRecord | null> {
  if (!isGoogleCalendarEnabled()) {
    return null;
  }
  const { data, error } = await supabase
    .from("google_calendar_connections")
    .select(CONNECTION_SELECT)
    .eq("user_id", userId)
    .eq("household_id", householdId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as GoogleCalendarConnectionRecord | null) ?? null;
}

export async function listGoogleCalendars(
  connectionId: string,
): Promise<GoogleCalendarRecord[]> {
  const { data, error } = await supabase
    .from("google_calendars")
    .select(CALENDAR_SELECT)
    .eq("connection_id", connectionId)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as GoogleCalendarRecord[];
}

export async function startGoogleCalendarAuth({
  householdId,
  redirectAfter,
}: {
  householdId: string;
  redirectAfter?: string;
}): Promise<{ authUrl: string }> {
  return invokeFunction("google-calendar-auth", {
    householdId,
    redirectAfter: redirectAfter ?? "/profile",
  });
}

export async function syncGoogleCalendar({
  householdId,
  userId,
  force = false,
}: {
  householdId: string;
  userId: string;
  force?: boolean;
}): Promise<{ synced: number; message?: string }> {
  const connection = await getGoogleCalendarConnection(userId, householdId);

  if (!connection) {
    throw new Error("Aucune connexion Google Calendar active.");
  }

  if (!force && !shouldAutoSync(connection.last_synced_at)) {
    return { synced: 0, message: "Synchronisation récente — ignorée." };
  }

  return invokeFunction("google-calendar-sync", { householdId, force });
}

export async function disconnectGoogleCalendar({
  householdId,
}: {
  householdId: string;
}): Promise<void> {
  await invokeFunction("google-calendar-disconnect", { householdId });
}

export async function updateGoogleCalendarSelection({
  calendarId,
  selected,
}: {
  calendarId: string;
  selected: boolean;
}): Promise<void> {
  const { error } = await supabase
    .from("google_calendars")
    .update({ selected_for_sync: selected, updated_at: new Date().toISOString() })
    .eq("id", calendarId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function loadExternalEventsForMonth({
  userId,
  householdId,
  year,
  month,
}: {
  userId: string;
  householdId: string;
  year: number;
  month: number;
}): Promise<ExternalCalendarEventRecord[]> {
  if (!isGoogleCalendarEnabled()) {
    return [];
  }
  const start = new Date(year, month, 1).toISOString();
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999).toISOString();

  const { data, error } = await supabase
    .from("external_calendar_events")
    .select(EVENT_SELECT)
    .eq("household_id", householdId)
    .eq("user_id", userId)
    .neq("status", "cancelled")
    .lte("starts_at", end)
    .gte("ends_at", start)
    .order("starts_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ExternalCalendarEventRecord[];
}

export async function loadExternalEventsForDate({
  userId,
  householdId,
  date,
}: {
  userId: string;
  householdId: string;
  date: string;
}): Promise<ExternalCalendarEventRecord[]> {
  if (!isGoogleCalendarEnabled()) {
    return [];
  }
  const start = new Date(`${date}T00:00:00`).toISOString();
  const end = new Date(`${date}T23:59:59.999`).toISOString();

  const { data, error } = await supabase
    .from("external_calendar_events")
    .select(EVENT_SELECT)
    .eq("household_id", householdId)
    .eq("user_id", userId)
    .neq("status", "cancelled")
    .lte("starts_at", end)
    .gte("ends_at", start)
    .order("starts_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ExternalCalendarEventRecord[];
}

export async function maybeAutoSyncGoogleCalendar({
  householdId,
}: {
  householdId: string;
}): Promise<void> {
  if (!isGoogleCalendarEnabled()) {
    return;
  }

  try {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    const connection = await getGoogleCalendarConnection(user.id, householdId);
    if (!connection || connection.status !== "connected") return;

    if (shouldAutoSync(connection.last_synced_at)) {
      await syncGoogleCalendar({ householdId, userId: user.id });
    }
  } catch {
    // Sync auto silencieuse — ne bloque pas l'UI
  }
}
