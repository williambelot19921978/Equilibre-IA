#!/usr/bin/env node
/**
 * QA-2 — Dev server for Quality Guardian (Vite mode guardian + EPIC flags ON).
 */

import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadGuardianEnv, GUARDIAN_FLAGS, GUARDIAN_RUNTIME } from "./load-guardian-env.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const guardianProcessEnv = {
  ...process.env,
  ...GUARDIAN_FLAGS,
  ...GUARDIAN_RUNTIME,
};

loadGuardianEnv();

const predev = spawn("node", ["scripts/ensure-vite-port.mjs"], {
  cwd: root,
  stdio: "inherit",
  shell: process.platform === "win32",
  env: guardianProcessEnv,
});

predev.on("exit", (code) => {
  if (code !== 0) {
    process.exit(code ?? 1);
  }

  const child = spawn("npx", ["vite", "--mode", "guardian"], {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: guardianProcessEnv,
  });

  child.on("exit", (exitCode) => {
    process.exit(exitCode ?? 0);
  });

  process.on("SIGINT", () => child.kill("SIGINT"));
  process.on("SIGTERM", () => child.kill("SIGTERM"));
});
