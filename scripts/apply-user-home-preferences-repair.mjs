import postgres from "postgres";
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
const password = env.SUPABASE_DB_PASSWORD;
const ref = new URL(env.VITE_SUPABASE_URL).hostname.split(".")[0];
const sql = readFileSync(
  resolve("supabase/migrations/00017_repair_user_home_preferences_missing_columns.sql"),
  "utf8",
);

const urls = [
  `postgresql://postgres:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432/postgres`,
  `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`,
  `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-0-eu-west-1.pooler.supabase.com:6543/postgres`,
  `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-0-eu-west-2.pooler.supabase.com:6543/postgres`,
  `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-0-eu-central-1.pooler.supabase.com:5432/postgres`,
  `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-0-eu-west-3.pooler.supabase.com:6543/postgres`,
];

for (const url of urls) {
  const host = new URL(url).host;
  process.stdout.write(`Trying ${host} ... `);
  const client = postgres(url, { ssl: "require", max: 1, connect_timeout: 15 });
  try {
    await client.unsafe(sql);
    const cols = await client`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'user_home_preferences'
        AND column_name IN ('evening_planning_mode', 'sport_settings')
    `;
    console.log("OK");
    console.log("Columns:", cols.map((column) => column.column_name).join(", "));
    await client.end();
    process.exit(0);
  } catch (error) {
    console.log("FAIL", error.message.slice(0, 160));
    await client.end({ timeout: 1 }).catch(() => undefined);
  }
}

process.exit(1);
