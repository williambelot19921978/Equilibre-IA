/**
 * QA-2 — Load merged Guardian environment (.env.local + .env.guardian*).
 * Never logs secret values.
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const GUARDIAN_FLAGS = {
  VITE_GOALS: "true",
  VITE_HOUSEHOLD_OVERVIEW: "true",
  VITE_HOUSEHOLD_OPPORTUNITIES: "true",
  VITE_HOUSEHOLD_COLLABORATION: "true",
  VITE_DAILY_BRIEF: "true",
  VITE_EXPLAINABLE_AI: "true",
  VITE_DYNAMIC_DAILY_BRIEF: "true",
  VITE_GOAL_PROGRESS_ASSISTANT: "true",
};

const GUARDIAN_RUNTIME = {
  PLAYWRIGHT_BASE_URL: "http://localhost:5173",
  VITE_APP_ORIGIN: "http://localhost:5173",
};

const SECRET_KEYS = new Set([
  "VITE_SUPABASE_PUBLISHABLE_KEY",
  "PLAYWRIGHT_TEST_PASSWORD",
  "GUARDIAN_TEST_PASSWORD",
  "GUARDIAN_SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_DB_PASSWORD",
  "SUPABASE_DB_URL",
]);

function parseEnvFile(filePath) {
  const vars = {};
  if (!existsSync(filePath)) return vars;

  for (const line of readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;
    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    vars[key] = value;
  }

  return vars;
}

export function loadGuardianEnv() {
  const merged = {
    ...parseEnvFile(path.join(root, ".env")),
    ...parseEnvFile(path.join(root, ".env.local")),
    ...parseEnvFile(path.join(root, ".env.guardian")),
    ...parseEnvFile(path.join(root, ".env.guardian.local")),
    ...GUARDIAN_FLAGS,
    ...GUARDIAN_RUNTIME,
  };

  for (const [key, value] of Object.entries(merged)) {
    if (value !== undefined && value !== "") {
      process.env[key] = value;
    }
  }

  return merged;
}

export function getGuardianFlagSnapshot(env = loadGuardianEnv()) {
  return Object.fromEntries(
    Object.keys(GUARDIAN_FLAGS).map((key) => [key, env[key] ?? "unset"]),
  );
}

export function maskSecret(key, value) {
  if (!value) return "absent";
  if (SECRET_KEYS.has(key)) return "present (masked)";
  return value;
}

export function getSupabaseConfig(env = loadGuardianEnv()) {
  return {
    url: env.VITE_SUPABASE_URL ?? "",
    publishableKey: env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "",
    serviceRoleKey:
      env.GUARDIAN_SUPABASE_SERVICE_ROLE_KEY ??
      env.SUPABASE_SERVICE_ROLE_KEY ??
      "",
  };
}

export function getPlaywrightCredentials(env = loadGuardianEnv()) {
  return {
    email: env.PLAYWRIGHT_TEST_EMAIL?.trim() ?? "",
    password: env.PLAYWRIGHT_TEST_PASSWORD ?? "",
    baseUrl: env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5173",
  };
}

export { GUARDIAN_FLAGS, GUARDIAN_RUNTIME, root };
