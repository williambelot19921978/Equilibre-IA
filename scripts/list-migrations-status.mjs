import postgres from "postgres";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

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

async function resolvePassword(ref) {
  if (process.env.SUPABASE_DB_PASSWORD?.trim()) {
    return process.env.SUPABASE_DB_PASSWORD.trim();
  }
  if (input.isTTY) {
    const rl = readline.createInterface({ input, output });
    const password = await rl.question(
      `Mot de passe PostgreSQL pour le projet ${ref} (Entrée = ignorer distant) : `,
    );
    await rl.close();
    return password;
  }
  return loadEnvLocal().SUPABASE_DB_PASSWORD?.trim() ?? "";
}

async function main() {
  const localMigrations = readdirSync(resolve("supabase/migrations"))
    .filter((name) => name.endsWith(".sql"))
    .sort();

  console.log("--- Migrations locales ---");
  for (const name of localMigrations) {
    console.log(name);
  }

  const env = loadEnvLocal();
  const url = env.VITE_SUPABASE_URL;
  if (!url) {
    console.error("❌ VITE_SUPABASE_URL manquant — arrêt avant vérification distante.");
    process.exit(1);
  }

  const ref = new URL(url).hostname.split(".")[0];
  const password = await resolvePassword(ref);

  if (!password) {
    console.log("Vérification distante ignorée (mot de passe absent).");
    process.exit(0);
  }

  const connectionUrl = `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-0-eu-west-3.pooler.supabase.com:6543/postgres`;
  const client = postgres(connectionUrl, { ssl: "require", max: 1, connect_timeout: 15 });

  try {
    let remoteRows = [];
    try {
      remoteRows = await client`
        SELECT version, name
        FROM supabase_migrations.schema_migrations
        ORDER BY version
      `;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes("schema_migrations")) {
        throw error;
      }
      console.log(
        "\nℹ️  Table supabase_migrations.schema_migrations absente (migrations appliquées manuellement).",
      );
    }

    if (remoteRows.length > 0) {
      console.log("\n--- Migrations distantes (schema_migrations) ---");
      for (const row of remoteRows) {
        console.log(`${row.version}  ${row.name ?? ""}`);
      }
    }

    const has00018Policy = await client`
      SELECT policyname, cmd, qual
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'task_activity_events'
        AND policyname = 'task_activity_events_delete_own'
    `;

    console.log("\n--- Policy DELETE task_activity_events ---");
    if (has00018Policy.length > 0) {
      console.log("✅ task_activity_events_delete_own présente");
      console.log(has00018Policy[0]);
    } else {
      console.log("❌ task_activity_events_delete_own absente");
    }

    const localHas00018 = localMigrations.some((name) => name.startsWith("00018"));
    const remoteHas00018 =
      remoteRows.some((row) => String(row.version).includes("00018")) ||
      has00018Policy.length > 0;

    console.log("\n--- Synthèse 00018 ---");
    console.log(`Local  : ${localHas00018 ? "✅ fichier présent" : "❌ absent"}`);
    console.log(
      `Distant: ${remoteHas00018 ? "✅ enregistrée / policy présente" : "❌ absente"}`,
    );

    await client.end();
  } catch (error) {
    console.error("❌ Lecture distante impossible :", error.message);
    await client.end({ timeout: 1 }).catch(() => undefined);
    process.exit(1);
  }
}

await main();
