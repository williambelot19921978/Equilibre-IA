import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  corsHeaders,
  createSupabaseAdmin,
  getGoogleOAuthConfig,
} from "../_shared/google-oauth.ts";

Deno.serve(async (request) => {
  const { appOrigin } = getGoogleOAuthConfig();

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

    const { data: connection } = await supabase
      .from("google_calendar_connections")
      .select("id")
      .eq("user_id", user.id)
      .eq("household_id", householdId)
      .maybeSingle();

    if (connection) {
      await supabase.from("google_calendars").delete().eq("connection_id", connection.id);
      await supabase.from("google_calendar_connections").delete().eq("id", connection.id);
    }

    await supabase
      .from("external_calendar_events")
      .delete()
      .eq("user_id", user.id)
      .eq("household_id", householdId)
      .eq("provider", "google");

    return new Response(JSON.stringify({ disconnected: true }), {
      headers: { ...corsHeaders(appOrigin), "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Déconnexion échouée.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders(appOrigin), "Content-Type": "application/json" },
      },
    );
  }
});
