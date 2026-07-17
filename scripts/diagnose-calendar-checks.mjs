/**
 * Lit la définition réelle des CHECK constraints calendar_items depuis PostgreSQL.
 * Usage : npm run diagnose:calendar-checks
 *
 * Nécessite la fonction SQL get_calendar_items_check_definitions (migration 00007).
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
  console.error("❌ Variables Supabase manquantes dans .env.local");
  process.exit(1);
}

const supabase = createClient(url, key);

const CANDIDATE_ITEM_TYPES = [
  "constraint",
  "task",
  "buffer",
  "margin",
  "event",
  "routine",
  "rest",
  "sport",
];

const CANDIDATE_SOURCES = [
  "user",
  "ai",
  "calendar_sync",
  "system",
  "engine",
  "manual",
];

async function main() {
  console.log("🔍 Diagnostic CHECK calendar_items\n");
  console.log(`URL : ${url}\n`);

  const { data: rpcData, error: rpcError } = await supabase.rpc(
    "get_calendar_items_check_definitions",
  );

  if (!rpcError && rpcData) {
    console.log("--- Définitions CHECK (PostgreSQL) ---\n");
    console.log(JSON.stringify(rpcData, null, 2));
  } else {
    console.log(
      "⚠️  RPC get_calendar_items_check_definitions indisponible.",
    );
    if (rpcError) {
      console.log(`   ${rpcError.message} (${rpcError.code ?? "no code"})`);
    }
    console.log(
      "   → Exécute la migration 00007 dans Supabase SQL Editor.\n",
    );
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const testEmail = env.VERIFY_TEST_EMAIL;
  const testPassword = env.VERIFY_TEST_PASSWORD;

  if (testEmail && testPassword && !sessionData.session) {
    await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });
  }

  const { data: distinctTypes, error: distinctError } = await supabase
    .from("calendar_items")
    .select("item_type")
    .limit(200);

  if (!distinctError && distinctTypes) {
    const values = [...new Set(distinctTypes.map((row) => row.item_type))];
    console.log("--- item_type observés en base ---\n");
    console.log(values.length > 0 ? values.join(", ") : "(aucune ligne)");
    console.log();
  }

  const { data: distinctSources } = await supabase
    .from("calendar_items")
    .select("source")
    .limit(200);

  if (distinctSources) {
    const values = [...new Set(distinctSources.map((row) => row.source))];
    console.log("--- source observées en base ---\n");
    console.log(values.length > 0 ? values.join(", ") : "(aucune ligne)");
    console.log();
  }

  console.log(
    "ℹ️  Pour sonder les INSERT, connecte VERIFY_TEST_EMAIL / VERIFY_TEST_PASSWORD.",
  );
  console.log(
    `   Candidats item_type testés côté code : ${CANDIDATE_ITEM_TYPES.join(", ")}`,
  );
  console.log(
    `   Candidats source testés côté code : ${CANDIDATE_SOURCES.join(", ")}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
