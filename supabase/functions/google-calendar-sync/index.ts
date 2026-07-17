import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  corsHeaders,
  createSupabaseAdmin,
  decryptRefreshToken,
  getGoogleOAuthConfig,
  refreshGoogleAccessToken,
} from "../_shared/google-oauth.ts";

function classifyEvent(summary: string, calendarName: string, eventType?: string) {
  const text = summary.toLowerCase();
  const calendar = calendarName.toLowerCase();
  if (
    eventType === "birthday" ||
    calendar.includes("birthday") ||
    calendar.includes("anniversaire") ||
    text.includes("anniversaire")
  ) {
    return "birthday";
  }
  if (text.includes("vacances") || text.includes("congé")) return "vacation";
  if (text.includes("travail") || calendar.includes("work")) return "work";
  if (text.includes("famille") || calendar.includes("family")) return "family";
  return "appointment";
}

function parseGoogleEvent(
  event: Record<string, unknown>,
  calendarId: string,
  calendarName: string,
) {
  const start = event.start as { date?: string; dateTime?: string } | undefined;
  const end = event.end as { date?: string; dateTime?: string } | undefined;
  const allDay = Boolean(start?.date && !start?.dateTime);

  let startsAt: string;
  let endsAt: string;

  if (allDay && start?.date) {
    const endDate = end?.date ?? start.date;
    const inclusiveEnd = new Date(`${endDate}T12:00:00`);
    inclusiveEnd.setDate(inclusiveEnd.getDate() - 1);
    startsAt = new Date(`${start.date}T00:00:00`).toISOString();
    endsAt = new Date(
      `${inclusiveEnd.toISOString().slice(0, 10)}T23:59:59.999`,
    ).toISOString();
  } else if (start?.dateTime && end?.dateTime) {
    startsAt = new Date(start.dateTime).toISOString();
    endsAt = new Date(end.dateTime).toISOString();
  } else {
    return null;
  }

  const status = event.status === "cancelled" ? "cancelled" : "confirmed";
  const summary = (event.summary as string | undefined) ?? "Événement Google";

  return {
    external_calendar_id: calendarId,
    external_event_id:
      (event.recurringEventId as string | undefined) ?? (event.id as string),
    title: summary,
    description: (event.description as string | undefined) ?? null,
    location: (event.location as string | undefined) ?? null,
    starts_at: startsAt,
    ends_at: endsAt,
    all_day: allDay,
    recurrence: event.recurringEventId ? "recurring" : null,
    status,
    event_type: classifyEvent(
      summary,
      calendarName,
      event.eventType as string | undefined,
    ),
    raw_metadata: {
      htmlLink: event.htmlLink,
      googleEventId: event.id,
    },
    last_synced_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

Deno.serve(async (request) => {
  const { appOrigin, clientId, clientSecret, tokenSecret } =
    getGoogleOAuthConfig();

  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(appOrigin) });
  }

  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Non authentifié." }), {
        status: 401,
        headers: { ...corsHeaders(appOrigin), "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const householdId = body.householdId as string;

    const { url, serviceRole } = createSupabaseAdmin();
    const supabase = createClient(url, serviceRole, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Session invalide." }), {
        status: 401,
        headers: { ...corsHeaders(appOrigin), "Content-Type": "application/json" },
      });
    }

    const { data: connection, error: connectionError } = await supabase
      .from("google_calendar_connections")
      .select("id, encrypted_refresh_token, status")
      .eq("user_id", user.id)
      .eq("household_id", householdId)
      .maybeSingle();

    if (connectionError || !connection) {
      return new Response(JSON.stringify({ error: "Connexion Google absente." }), {
        status: 400,
        headers: { ...corsHeaders(appOrigin), "Content-Type": "application/json" },
      });
    }

    const refreshToken = await decryptRefreshToken(
      connection.encrypted_refresh_token,
      tokenSecret,
    );

    const tokenPayload = await refreshGoogleAccessToken({
      refreshToken,
      clientId,
      clientSecret,
    });

    const { data: calendars } = await supabase
      .from("google_calendars")
      .select("google_calendar_id, name")
      .eq("connection_id", connection.id)
      .eq("selected_for_sync", true);

    const timeMin = new Date();
    timeMin.setMonth(timeMin.getMonth() - 1);
    const timeMax = new Date();
    timeMax.setMonth(timeMax.getMonth() + 6);

    let synced = 0;

    for (const calendar of calendars ?? []) {
      const eventsUrl = new URL(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.google_calendar_id)}/events`,
      );
      eventsUrl.searchParams.set("singleEvents", "true");
      eventsUrl.searchParams.set("orderBy", "startTime");
      eventsUrl.searchParams.set("timeMin", timeMin.toISOString());
      eventsUrl.searchParams.set("timeMax", timeMax.toISOString());

      const response = await fetch(eventsUrl.toString(), {
        headers: { Authorization: `Bearer ${tokenPayload.access_token}` },
      });

      if (!response.ok) continue;

      const payload = await response.json();
      const items = (payload.items ?? []) as Array<Record<string, unknown>>;

      for (const item of items) {
        const parsed = parseGoogleEvent(
          item,
          calendar.google_calendar_id,
          calendar.name,
        );
        if (!parsed) continue;

        const { error: upsertError } = await supabase
          .from("external_calendar_events")
          .upsert(
            {
              ...parsed,
              household_id: householdId,
              user_id: user.id,
              provider: "google",
            },
            { onConflict: "provider,external_event_id,user_id" },
          );

        if (!upsertError) synced += 1;
      }
    }

    await supabase
      .from("google_calendar_connections")
      .update({
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: "connected",
      })
      .eq("id", connection.id);

    return new Response(JSON.stringify({ synced }), {
      headers: { ...corsHeaders(appOrigin), "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Synchronisation échouée.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders(appOrigin), "Content-Type": "application/json" },
      },
    );
  }
});
