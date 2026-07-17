/**
 * Diagnostic non destructif du schéma Supabase.
 * Usage : npm run verify:schema
 *
 * Variables optionnelles dans .env.local :
 * - VERIFY_TEST_EMAIL
 * - VERIFY_TEST_PASSWORD
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), ".env.local");
  const content = readFileSync(envPath, "utf8");
  const vars = {};

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...rest] = trimmed.split("=");
    vars[key] = rest.join("=");
  }

  return vars;
}

const env = loadEnvLocal();
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.error("❌ Variables VITE_SUPABASE_URL ou VITE_SUPABASE_PUBLISHABLE_KEY manquantes.");
  process.exit(1);
}

const supabase = createClient(url, key);

const TABLES = [
  "profiles",
  "households",
  "household_members",
  "children",
  "profile_facts",
  "tasks",
  "calendar_items",
  "family_context_periods",
  "child_routines",
  "google_calendar_connections",
  "google_calendars",
  "external_calendar_events",
  "spiritual_favorites",
  "user_home_preferences",
  "task_activity_events",
  "leisure_favorites",
  "daily_checkins",
];

function classifyError(message = "", code = "") {
  if (
    message.includes("does not exist") ||
    code === "42P01" ||
    code === "PGRST205"
  ) {
    return "missing";
  }

  if (
    message.includes("permission denied") ||
    message.includes("row-level security") ||
    code === "42501"
  ) {
    return "rls";
  }

  return "other";
}

async function probeTable(table) {
  const { error } = await supabase.from(table).select("*").limit(0);

  if (!error) {
    return { table, status: "ok", message: "table accessible (anon ou session)" };
  }

  return {
    table,
    status: classifyError(error.message, error.code),
    message: error.message,
    code: error.code ?? null,
  };
}

console.log("🔍 Diagnostic schéma Supabase (non destructif)\n");
console.log(`URL : ${url}\n`);

const authResult = await supabase.auth.getSession();

if (authResult.error) {
  console.error("❌ Auth endpoint:", authResult.error.message);
  process.exit(1);
}

console.log(
  `Session : ${authResult.data.session ? "active" : "aucune (tests table en mode anon/RLS)"}`,
);

const testEmail = env.VERIFY_TEST_EMAIL;
const testPassword = env.VERIFY_TEST_PASSWORD;

if (testEmail && testPassword) {
  const signIn = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (signIn.error) {
    console.warn(`⚠️  Connexion test échouée : ${signIn.error.message}`);
  } else {
    console.log(`✅ Connecté en tant que ${testEmail}`);
  }
} else {
  console.log(
    "ℹ️  Ajoute VERIFY_TEST_EMAIL / VERIFY_TEST_PASSWORD pour tester avec RLS authentifié.",
  );
}

console.log("\n--- Tables ---\n");

const results = [];

for (const table of TABLES) {
  const result = await probeTable(table);
  results.push(result);

  const icon =
    result.status === "ok"
      ? "✅"
      : result.status === "missing"
        ? "❌"
        : result.status === "rls"
          ? "⚠️ "
          : "❌";

  console.log(`${icon} ${table} — ${result.message}${result.code ? ` (${result.code})` : ""}`);
}

const missing = results.filter((result) => result.status === "missing");
const rlsBlocked = results.filter((result) => result.status === "rls");

console.log("\n--- Résumé ---\n");

if (missing.length === 0 && rlsBlocked.length === 0) {
  console.log("✅ Toutes les tables probées sont accessibles.");
} else {
  if (missing.length > 0) {
    console.log("Tables absentes ou inaccessibles :");
    for (const item of missing) {
      console.log(`  - ${item.table}`);
    }
    console.log(
      "\n→ Exécute les migrations dans supabase/migrations/ (notamment 00003, 00004, 00005).",
    );
  }

  if (rlsBlocked.length > 0) {
    console.log("\nAccès RLS refusé (policies ou session manquante) :");
    for (const item of rlsBlocked) {
      console.log(`  - ${item.table}`);
    }
    console.log(
      "\n→ Vérifie les policies RLS et connecte un utilisateur test (VERIFY_TEST_EMAIL).",
    );
  }
}

const exitCode = missing.length > 0 ? 1 : 0;
process.exit(exitCode);
