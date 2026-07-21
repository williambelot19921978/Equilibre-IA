#!/usr/bin/env node
/**
 * QA-2 — Mandatory pre-flight checks before Guardian E2E run.
 */

import { createClient } from "@supabase/supabase-js";
import { accessSync, constants, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  getGuardianFlagSnapshot,
  getPlaywrightCredentials,
  getSupabaseConfig,
  GUARDIAN_FLAGS,
  loadGuardianEnv,
  maskSecret,
  root,
} from "./load-guardian-env.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const reportDir = path.join(root, "tests", "e2e", "reports");

function check(name, ok, detail) {
  return { name, ok, detail };
}

function canWriteDirectory(relativePath) {
  try {
    mkdirSync(path.join(root, relativePath), { recursive: true });
    accessSync(path.join(root, relativePath), constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

function isPortListening(port) {
  try {
    if (process.platform === "win32") {
      const result = spawnSync("netstat", ["-ano"], { encoding: "utf8", shell: true });
      return result.stdout.includes(`:${port}`) && result.stdout.includes("LISTENING");
    }

    const result = spawnSync("lsof", [`-ti:${port}`], { encoding: "utf8" });
    return Boolean(result.stdout.trim());
  } catch {
    return false;
  }
}

function checkChromium() {
  const result = spawnSync(
    "npx",
    ["playwright", "install", "--dry-run", "chromium"],
    { cwd: root, encoding: "utf8", shell: process.platform === "win32" },
  );

  if (result.status !== 0) {
    return { ok: false, detail: "Impossible de vérifier Chromium via Playwright." };
  }

  const output = `${result.stdout}\n${result.stderr}`;
  if (/already installed|is already installed/i.test(output)) {
    return { ok: true, detail: "Chromium Playwright disponible." };
  }

  const installResult = spawnSync("npx", ["playwright", "install", "chromium"], {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  return installResult.status === 0
    ? { ok: true, detail: "Chromium installé." }
    : { ok: false, detail: "Installation Chromium échouée." };
}

async function checkSupabaseConnection(url, key) {
  const client = createClient(url, key);
  const session = await client.auth.getSession();
  if (session.error) {
    return { ok: false, detail: session.error.message };
  }

  return { ok: true, detail: "Client Supabase initialisé." };
}

async function checkStableAccount(url, key, email, password) {
  const client = createClient(url, key);
  const signIn = await client.auth.signInWithPassword({ email, password });

  if (signIn.error || !signIn.data.user) {
    return {
      ok: false,
      detail: `Connexion compte stable impossible : ${signIn.error?.message ?? "user absent"}`,
    };
  }

  const membership = await client
    .from("household_members")
    .select("household_id, display_name, role")
    .eq("user_id", signIn.data.user.id)
    .maybeSingle();

  if (membership.error) {
    return { ok: false, detail: `Lecture foyer impossible : ${membership.error.message}` };
  }

  if (!membership.data?.household_id) {
    return { ok: false, detail: "Compte stable sans foyer — onboarding requis." };
  }

  await client.auth.signOut();

  return {
    ok: true,
    detail: `Compte stable OK (foyer ${membership.data.household_id.slice(0, 8)}…).`,
  };
}

async function checkBaseUrl(baseUrl) {
  try {
    const response = await fetch(baseUrl, { redirect: "follow" });
    return response.ok || response.status === 304
      ? { ok: true, detail: `HTTP ${response.status}` }
      : { ok: false, detail: `HTTP ${response.status}` };
  } catch (error) {
    return {
      ok: false,
      detail: `Serveur non accessible (${error instanceof Error ? error.message : "erreur"}) — le webServer Guardian le démarrera.`,
      warning: true,
    };
  }
}

async function main() {
  loadGuardianEnv();
  mkdirSync(reportDir, { recursive: true });

  const runId =
    process.env.GUARDIAN_RUN_ID ??
    new Date().toISOString().replace(/[:.]/g, "-");

  const supabase = getSupabaseConfig();
  const credentials = getPlaywrightCredentials();
  const flags = getGuardianFlagSnapshot();

  const checks = [];

  checks.push(
    check(
      "Variables Supabase",
      Boolean(supabase.url && supabase.publishableKey),
      supabase.url
        ? `URL ${supabase.url} — clé ${maskSecret("VITE_SUPABASE_PUBLISHABLE_KEY", supabase.publishableKey)}`
        : "VITE_SUPABASE_URL ou VITE_SUPABASE_PUBLISHABLE_KEY manquantes dans .env.local",
    ),
  );

  checks.push(
    check(
      "Compte de test stable",
      Boolean(credentials.email && credentials.password),
      credentials.email
        ? `Email ${credentials.email} — mot de passe ${maskSecret("PLAYWRIGHT_TEST_PASSWORD", credentials.password)}`
        : "PLAYWRIGHT_TEST_EMAIL / PLAYWRIGHT_TEST_PASSWORD requis dans .env.local",
    ),
  );

  const flagsOk = Object.keys(GUARDIAN_FLAGS).every((key) => flags[key] === "true");
  checks.push(
    check(
      "Feature flags Guardian",
      flagsOk,
      Object.entries(flags)
        .map(([key, value]) => `${key}=${value}`)
        .join(", "),
    ),
  );

  checks.push(
    check(
      "Dossier reports",
      canWriteDirectory("tests/e2e/reports"),
      "tests/e2e/reports accessible en écriture",
    ),
  );

  checks.push(
    check(
      "Dossier screenshots",
      canWriteDirectory("tests/e2e/screenshots/runs"),
      "tests/e2e/screenshots/runs accessible en écriture",
    ),
  );

  const portBusy = isPortListening(5173);
  checks.push(
    check(
      "Port Vite 5173",
      true,
      portBusy
        ? "Occupé — ensure-vite-port le libérera au démarrage."
        : "Libre.",
    ),
  );

  const chromium = checkChromium();
  checks.push(check("Chromium Playwright", chromium.ok, chromium.detail));

  if (supabase.url && supabase.publishableKey) {
    const connection = await checkSupabaseConnection(
      supabase.url,
      supabase.publishableKey,
    );
    checks.push(check("Connexion Supabase", connection.ok, connection.detail));
  }

  if (supabase.url && supabase.publishableKey && credentials.email && credentials.password) {
    const account = await checkStableAccount(
      supabase.url,
      supabase.publishableKey,
      credentials.email,
      credentials.password,
    );
    checks.push(check("Compte stable + foyer", account.ok, account.detail));
  }

  const baseUrlCheck = await checkBaseUrl(credentials.baseUrl);

  checks.push(
    check(
      "URL Guardian locale",
      /^https?:\/\/(localhost|127\.0\.0\.1):5173\/?$/i.test(credentials.baseUrl),
      `${credentials.baseUrl} — le Guardian doit cibler localhost:5173, jamais la production.`,
    ),
  );
  checks.push(
    check(
      "URL de base",
      baseUrlCheck.ok || baseUrlCheck.warning === true,
      `${credentials.baseUrl} — ${baseUrlCheck.detail}`,
    ),
  );

  checks.push(
    check(
      "Fichier .env.guardian",
      existsSync(path.join(root, ".env.guardian")),
      existsSync(path.join(root, ".env.guardian"))
        ? "Présent"
        : "Manquant — flags EPIC non garantis",
    ),
  );

  checks.push(
    check(
      "Service role (optionnel)",
      true,
      supabase.serviceRoleKey
        ? "Présent — provisioning multi-membres activé."
        : "Absent — provisioning limité (1 membre/foyer via UI).",
    ),
  );

  const blockingFailures = checks.filter(
    (entry) => !entry.ok && entry.name !== "URL de base",
  );
  const passed = blockingFailures.length === 0;

  const report = {
    runId,
    date: new Date().toISOString(),
    baseUrl: credentials.baseUrl,
    flags,
    checks,
    passed,
  };

  writeFileSync(
    path.join(reportDir, "preflight-report.json"),
    JSON.stringify(report, null, 2),
    "utf8",
  );

  console.log("\n🛡️  Quality Guardian — PRE-FLIGHT\n");

  for (const entry of checks) {
    const icon = entry.ok ? "✅" : "❌";
    console.log(`${icon} ${entry.name}`);
    console.log(`   ${entry.detail}\n`);
  }

  if (!passed) {
    console.error("❌ PRE-FLIGHT ÉCHOUÉ — exécution Guardian interrompue.\n");
    process.exit(1);
  }

  console.log("✅ PRE-FLIGHT OK\n");
}

main().catch((error) => {
  console.error("❌ PRE-FLIGHT fatal:", error);
  process.exit(1);
});
