import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  createSupabaseAdmin,
  encryptRefreshToken,
  exchangeGoogleCode,
  fetchGoogleUserEmail,
  getGoogleOAuthConfig,
} from "../_shared/google-oauth.ts";

Deno.serve(async (request) => {
  const { appOrigin, clientId, clientSecret, redirectUri, tokenSecret } =
    getGoogleOAuthConfig();

  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    if (error || !code || !state) {
      return Response.redirect(
        `${appOrigin}/profile?google=error&message=${encodeURIComponent(error ?? "Callback OAuth invalide.")}`,
      );
    }

    const parsedState = JSON.parse(atob(state)) as {
      userId: string;
      householdId: string;
      redirectAfter?: string;
    };

    const tokens = await exchangeGoogleCode({
      code,
      clientId,
      clientSecret,
      redirectUri,
    });

    if (!tokens.refresh_token) {
      return Response.redirect(
        `${appOrigin}/profile?google=error&message=${encodeURIComponent("Refresh token absent — révoque l’accès et reconnecte.")}`,
      );
    }

    const email = await fetchGoogleUserEmail(tokens.access_token);
    const encryptedRefreshToken = await encryptRefreshToken(
      tokens.refresh_token,
      tokenSecret,
    );

    const { url: supabaseUrl, serviceRole } = createSupabaseAdmin();
    const admin = createClient(supabaseUrl, serviceRole);

    const { data: connection, error: upsertError } = await admin
      .from("google_calendar_connections")
      .upsert(
        {
          user_id: parsedState.userId,
          household_id: parsedState.householdId,
          google_account_email: email,
          encrypted_refresh_token: encryptedRefreshToken,
          scopes: [tokens.scope ?? "calendar.readonly"],
          status: "connected",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,household_id" },
      )
      .select("id")
      .single();

    if (upsertError || !connection) {
      throw new Error(upsertError?.message ?? "Impossible d’enregistrer la connexion.");
    }

    const calendarListResponse = await fetch(
      "https://www.googleapis.com/calendar/v3/users/me/calendarList",
      { headers: { Authorization: `Bearer ${tokens.access_token}` } },
    );

    if (calendarListResponse.ok) {
      const payload = await calendarListResponse.json();
      const items = (payload.items ?? []) as Array<{
        id: string;
        summary: string;
        primary?: boolean;
        backgroundColor?: string;
        timeZone?: string;
      }>;

      for (const calendar of items) {
        await admin.from("google_calendars").upsert(
          {
            connection_id: connection.id,
            google_calendar_id: calendar.id,
            name: calendar.summary,
            color: calendar.backgroundColor ?? null,
            selected_for_sync: Boolean(calendar.primary),
            is_primary: Boolean(calendar.primary),
            time_zone: calendar.timeZone ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "connection_id,google_calendar_id" },
        );
      }
    }

    const redirectPath = parsedState.redirectAfter ?? "/profile";
    return Response.redirect(`${appOrigin}${redirectPath}?google=connected`);
  } catch (callbackError) {
    const message =
      callbackError instanceof Error
        ? callbackError.message
        : "Callback OAuth échoué.";
    return Response.redirect(
      `${appOrigin}/profile?google=error&message=${encodeURIComponent(message)}`,
    );
  }
});
