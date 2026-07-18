/**
 * Diagnostic complet user_home_preferences (requêtes + colonnes).
 * Usage : npm run probe:user-home-preferences
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), ".env.local");
  const vars = {};
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;
    vars[trimmed.slice(0, separatorIndex).trim()] = trimmed
      .slice(separatorIndex + 1)
      .trim();
  }
  return vars;
}

const env = loadEnvLocal();
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_PUBLISHABLE_KEY;
const email = env.PLAYWRIGHT_TEST_EMAIL ?? env.VERIFY_TEST_EMAIL;
const password = env.PLAYWRIGHT_TEST_PASSWORD ?? env.VERIFY_TEST_PASSWORD;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY requis.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

if (email && password) {
  const signIn = await supabase.auth.signInWithPassword({ email, password });
  if (signIn.error) {
    console.error("❌ Auth:", signIn.error.message);
    process.exit(1);
  }
  console.log(`✅ Connecté : ${email}\n`);
}

const QUERIES = [
  {
    service: "layoutPreferencesService.loadLayoutPreferences",
    select: "sidebar_collapsed, show_saint_calendar, evening_planning_mode",
    operation: "SELECT",
  },
  {
    service: "homePreferencesService.loadHomePreferences",
    select:
      "visible_widgets, widget_order, compact_mode, calendar_widget_position, calendar_widget_position_mobile, meal_settings",
    operation: "SELECT",
  },
  {
    service: "homePreferencesService.loadSportSettings",
    select: "sport_settings",
    operation: "SELECT",
  },
  {
    service: "homePreferencesService.loadMealSettings",
    select: "meal_settings",
    operation: "SELECT",
  },
  {
    service: "layoutPreferencesService.saveLayoutPreferences",
    select: "sidebar_collapsed, show_saint_calendar, evening_planning_mode",
    operation: "UPSERT (probe select only)",
  },
];

console.log("=== Requêtes user_home_preferences ===\n");

for (const query of QUERIES) {
  const url = `${supabaseUrl}/rest/v1/user_home_preferences?select=${encodeURIComponent(query.select)}`;
  const { data, error, status } = await supabase
    .from("user_home_preferences")
    .select(query.select)
    .limit(1);

  console.log(`--- ${query.service} ---`);
  console.log(`Operation : ${query.operation}`);
  console.log(`URL       : ${url}`);
  console.log(`Payload   : (GET — pas de body)`);
  if (error) {
    console.log(`HTTP      : ${status ?? 400}`);
    console.log(`Code      : ${error.code}`);
    console.log(`Message   : ${error.message}`);
    console.log(`Details   : ${error.details ?? "null"}`);
    console.log(`Hint      : ${error.hint ?? "null"}`);
  } else {
    console.log(`HTTP      : 200`);
    console.log(`Réponse   : ${data?.length ?? 0} ligne(s)`);
  }
  console.log("");
}

const COLUMNS = [
  "sidebar_collapsed",
  "show_saint_calendar",
  "evening_planning_mode",
  "calendar_widget_position",
  "calendar_widget_position_mobile",
  "meal_settings",
  "sport_settings",
];

console.log("=== Colonnes distantes ===\n");
for (const column of COLUMNS) {
  const { error } = await supabase
    .from("user_home_preferences")
    .select(column)
    .limit(0);
  console.log(`${error ? "❌" : "✅"} ${column}${error ? ` — ${error.message}` : ""}`);
}
