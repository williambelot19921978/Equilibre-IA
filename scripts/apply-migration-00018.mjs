import postgres from "postgres";
import { readFileSync } from "node:fs";
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
    console.log("Mot de passe : variable d'environnement SUPABASE_DB_PASSWORD.");
    return process.env.SUPABASE_DB_PASSWORD.trim();
  }

  if (input.isTTY) {
    const rl = readline.createInterface({ input, output });
    const password = await rl.question(
      `Mot de passe PostgreSQL pour le projet ${ref} : `,
    );
    await rl.close();
    return password;
  }

  const env = loadEnvLocal();
  if (env.SUPABASE_DB_PASSWORD?.trim()) {
    console.log(
      "Terminal non interactif — mot de passe lu depuis SUPABASE_DB_PASSWORD dans .env.local.",
    );
    return env.SUPABASE_DB_PASSWORD.trim();
  }

  return "";
}

async function main() {
  const env = loadEnvLocal();
  const url = env.VITE_SUPABASE_URL;
  if (!url) {
    console.error("❌ VITE_SUPABASE_URL manquant dans .env.local");
    process.exit(1);
  }

  const ref = new URL(url).hostname.split(".")[0];
  const password = await resolvePassword(ref);

  if (!password) {
    console.error(
      "❌ Mot de passe absent. Saisis-le au prompt, ou exporte SUPABASE_DB_PASSWORD, ou ajoute-le à .env.local.",
    );
    process.exit(1);
  }

  const sql = readFileSync(
    resolve("supabase/migrations/00018_task_activity_events_delete_own.sql"),
    "utf8",
  );

  const urls = [
    `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-0-eu-west-3.pooler.supabase.com:6543/postgres`,
    `postgresql://postgres:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432/postgres`,
    `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`,
  ];

  for (const connectionUrl of urls) {
    const host = new URL(connectionUrl).host;
    process.stdout.write(`Connexion ${host} ... `);
    const client = postgres(connectionUrl, {
      ssl: "require",
      max: 1,
      connect_timeout: 15,
    });

    try {
      await client.unsafe(sql);

      const policies = await client`
        SELECT policyname, cmd, qual
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'task_activity_events'
          AND policyname = 'task_activity_events_delete_own'
      `;

      if (policies.length === 0) {
        throw new Error(
          "Policy task_activity_events_delete_own introuvable après migration",
        );
      }

      console.log("OK");
      console.log("Policy appliquée :", policies[0]);
      await client.end();
      process.exit(0);
    } catch (error) {
      console.log("ÉCHEC", error.message.slice(0, 160));
      await client.end({ timeout: 1 }).catch(() => undefined);
    }
  }

  process.exit(1);
}

await main();
