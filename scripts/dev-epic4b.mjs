#!/usr/bin/env node
/**
 * EPIC 4B — Dev server for Human Model certification E2E.
 * Activates VITE_ASSISTANT_IA + VITE_HUMAN_MODEL without changing production defaults.
 */

import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { EPIC4B_FLAGS, loadEpic4bEnv } from "./load-epic4b-env.mjs";
import { GUARDIAN_RUNTIME } from "./load-guardian-env.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

loadEpic4bEnv();

const epic4bProcessEnv = {
  ...process.env,
  ...EPIC4B_FLAGS,
  ...GUARDIAN_RUNTIME,
};

const predev = spawn("node", ["scripts/ensure-vite-port.mjs"], {
  cwd: root,
  stdio: "inherit",
  shell: process.platform === "win32",
  env: epic4bProcessEnv,
});

predev.on("exit", (code) => {
  if (code !== 0) {
    process.exit(code ?? 1);
  }

  const child = spawn("npx", ["vite", "--mode", "guardian"], {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: epic4bProcessEnv,
  });

  child.on("exit", (exitCode) => {
    process.exit(exitCode ?? 0);
  });

  process.on("SIGINT", () => child.kill("SIGINT"));
  process.on("SIGTERM", () => child.kill("SIGTERM"));
});
