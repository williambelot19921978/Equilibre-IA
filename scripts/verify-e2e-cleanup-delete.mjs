import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  const vars = {};
  for (const line of readFileSync(resolve(".env.local"), "utf8").split("\n")) {
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
const client = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY);
const signIn = await client.auth.signInWithPassword({
  email: env.PLAYWRIGHT_TEST_EMAIL,
  password: env.PLAYWRIGHT_TEST_PASSWORD,
});

if (signIn.error || !signIn.data.user) {
  console.error("❌ Auth E2E impossible :", signIn.error?.message ?? "user absent");
  process.exit(1);
}

const userId = signIn.data.user.id;
const today = new Date().toISOString().slice(0, 10);

const { data: events, error: selectError } = await client
  .from("task_activity_events")
  .select("id, metadata")
  .eq("user_id", userId)
  .gte("occurred_at", `${today}T00:00:00`)
  .limit(5);

if (selectError) {
  console.error("❌ SELECT events :", selectError.message);
  process.exit(1);
}

const workoutIds = (events ?? [])
  .filter((event) => {
    const metadata = event.metadata;
    return (
      metadata?.workoutCompleted === true || metadata?.partialCompletion === true
    );
  })
  .map((event) => event.id);

if (workoutIds.length === 0) {
  console.log("ℹ️  Aucun event workout du jour à tester — DELETE policy non exercée (OK).");
  process.exit(0);
}

const { data: deleted, error: deleteError } = await client
  .from("task_activity_events")
  .delete()
  .in("id", workoutIds)
  .select("id");

if (deleteError) {
  console.error("❌ DELETE events refusé :", deleteError.message, deleteError.code);
  process.exit(1);
}

console.log(`✅ Cleanup DELETE autorisé — ${deleted?.length ?? 0} event(s) supprimé(s).`);
