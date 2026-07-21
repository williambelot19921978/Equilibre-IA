#!/usr/bin/env node
/**
 * QA-2 — Quality Guardian single entrypoint.
 * clean → preflight → dev server → playwright → report → exit code
 */

import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadGuardianEnv, getPlaywrightCredentials } from "./load-guardian-env.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

loadGuardianEnv();
const guardianBaseUrl = getPlaywrightCredentials().baseUrl;

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    cwd: root,
    env: process.env,
    ...options,
  });

  return result.status ?? 1;
}

async function waitForServer(url, timeoutMs = 120_000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url, { redirect: "follow" });
      if (response.ok || response.status === 304) {
        return;
      }
    } catch {
      // retry
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Serveur Guardian inaccessible après ${timeoutMs}ms : ${url}`);
}

function startDevServer() {
  console.log("\n→ Démarrage Vite Guardian (mode guardian, port 5173)…\n");

  const child = spawn("node", ["scripts/dev-guardian.mjs"], {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  });

  return child;
}

function stopDevServer(child) {
  if (!child || child.killed) return;

  try {
    if (process.platform === "win32") {
      spawnSync("taskkill", ["/pid", String(child.pid), "/f", "/t"], {
        stdio: "ignore",
        shell: true,
      });
    } else {
      child.kill("SIGTERM");
    }
  } catch {
    // best effort
  }
}

const args = process.argv.slice(2);
const isCleanOnly = args.includes("--clean-only");
const isReportOnly = args.includes("--report-only");
const isDebug = args.includes("--debug");

process.env.GUARDIAN_RUN_ID =
  process.env.GUARDIAN_RUN_ID ??
  new Date().toISOString().replace(/[:.]/g, "-");

console.log("\n🛡️  Quality Guardian — démarrage\n");
console.log(`Run ID : ${process.env.GUARDIAN_RUN_ID}`);

if (isCleanOnly) {
  process.exit(run("node", ["scripts/guardian-clean.mjs"]));
}

if (!isReportOnly) {
  run("node", ["scripts/guardian-clean.mjs"]);

  const preflightCode = run("node", ["scripts/guardian-preflight.mjs"]);
  if (preflightCode !== 0) {
    process.exit(preflightCode);
  }

  const shouldBuild =
    args.includes("--build") ||
    process.env.GUARDIAN_BUILD === "1" ||
    !existsSync(path.join(root, "dist", "index.html"));

  if (shouldBuild) {
    console.log("\n→ Build production (Guardian)…\n");
    const buildCode = run("npm", ["run", "build"]);
    if (buildCode !== 0) process.exit(buildCode);
  } else {
    console.log("\n→ Build ignoré (dist présent). Utilisez --build pour forcer.\n");
  }

  const devServer = startDevServer();
  let playwrightCode = 1;

  try {
    await waitForServer(guardianBaseUrl);
    console.log(`\n✅ Serveur Guardian prêt : ${guardianBaseUrl}\n`);

    process.env.PLAYWRIGHT_SKIP_WEBSERVER = "1";

    console.log("\n→ Exécution Playwright (config guardian)…\n");

    const playwrightArgs = [
      "playwright",
      "test",
      "--config",
      "playwright.guardian.config.ts",
    ];

    if (args.includes("--headed")) {
      playwrightArgs.push("--headed");
    }

    if (isDebug) {
      playwrightArgs.push("--debug");
    }

    playwrightCode = run("npx", playwrightArgs);
  } catch (error) {
    console.error("\n❌ Guardian — échec serveur ou exécution :", error);
    playwrightCode = 1;
  } finally {
    console.log("\n→ Arrêt du serveur Guardian…\n");
    stopDevServer(devServer);
    run("node", ["scripts/ensure-vite-port.mjs"]);
  }

  const reportPath = path.join(root, "tests/e2e/reports/guardian-report.md");
  if (existsSync(reportPath)) {
    const report = readFileSync(reportPath, "utf8");
    const verdictMatch = report.match(
      /## VERDICT\s*\n\s*(READY FOR DEPLOYMENT|NOT READY FOR DEPLOYMENT)/,
    );
    const verdict = verdictMatch?.[1] ?? "NOT READY FOR DEPLOYMENT";

    console.log("\n────────────────────────────────────────");
    console.log(`VERDICT : ${verdict}`);
    console.log("────────────────────────────────────────\n");
    console.log("   Rapport MD  : tests/e2e/reports/guardian-report.md");
    console.log("   Rapport HTML: tests/e2e/reports/html/index.html");
    console.log("   Captures    : tests/e2e/screenshots/runs/\n");

    if (verdict !== "READY FOR DEPLOYMENT" || playwrightCode !== 0) {
      process.exit(playwrightCode !== 0 ? playwrightCode : 1);
    }

    process.exit(0);
  }

  process.exit(playwrightCode);
}

console.log("\n→ Mode rapport seul — ouvrir tests/e2e/reports/html/index.html\n");
process.exit(0);
