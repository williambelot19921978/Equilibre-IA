#!/usr/bin/env node
/**
 * EPIC 4C — Dev server for Secure Action Engine certification E2E.
 */

import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { EPIC4C_FLAGS, loadEpic4cEnv } from "./load-epic4c-env.mjs";
import { GUARDIAN_RUNTIME } from "./load-guardian-env.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

loadEpic4cEnv();

const epic4cProcessEnv = {
  ...process.env,
  ...EPIC4C_FLAGS,
  ...GUARDIAN_RUNTIME,
};

const predev = spawn("node", ["scripts/ensure-vite-port.mjs"], {
  cwd: root,
  stdio: "inherit",
  shell: process.platform === "win32",
  env: epic4cProcessEnv,
});

predev.on("exit", (code) => {
  if (code !== 0) {
    process.exit(code ?? 1);
  }

  const child = spawn("npx", ["vite", "--mode", "guardian"], {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: epic4cProcessEnv,
  });

  child.on("exit", (exitCode) => {
    process.exit(exitCode ?? 0);
  });

  process.on("SIGINT", () => child.kill("SIGINT"));
  process.on("SIGTERM", () => child.kill("SIGTERM"));
});
