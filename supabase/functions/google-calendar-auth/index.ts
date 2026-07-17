import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  buildGoogleAuthUrl,
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

    const { url, serviceRole } = createSupabaseAdmin();
    const supabase = createClient(url, serviceRole, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Session invalide." }), {
        status: 401,
        headers: { ...corsHeaders(appOrigin), "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const householdId = body.householdId as string;
    const redirectAfter = (body.redirectAfter as string) ?? "/profile";

    if (!householdId) {
      return new Response(JSON.stringify({ error: "Foyer manquant." }), {
        status: 400,
        headers: { ...corsHeaders(appOrigin), "Content-Type": "application/json" },
      });
    }

    const { clientId, redirectUri } = getGoogleOAuthConfig();
    const state = btoa(
      JSON.stringify({
        userId: user.id,
        householdId,
        redirectAfter,
      }),
    );

    const authUrl = buildGoogleAuthUrl({ clientId, redirectUri, state });

    return new Response(JSON.stringify({ authUrl }), {
      headers: { ...corsHeaders(appOrigin), "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erreur OAuth.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders(appOrigin), "Content-Type": "application/json" },
      },
    );
  }
});
