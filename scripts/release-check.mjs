#!/usr/bin/env node
/**
 * EPIC 9 — Release check: lint, tests, typecheck, build, PWA, optional Guardian.
 * Usage: node scripts/release-check.mjs [--with-guardian] [--skip-build]
 */

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const reportsDir = path.join(root, "reports");
const reportPath = path.join(reportsDir, "RELEASE_CHECK.md");

const args = process.argv.slice(2);
const withGuardian = args.includes("--with-guardian");
const skipBuild = args.includes("--skip-build");

const results = [];

function runStep(name, command, stepArgs, optional = false) {
  const started = Date.now();
  console.log(`\n→ ${name}…\n`);

  const result = spawnSync(command, stepArgs, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  });

  const ok = (result.status ?? 1) === 0;
  const durationMs = Date.now() - started;

  results.push({ name, ok, durationMs, optional });
  return ok;
}

function checkPwaArtifacts() {
  const manifest = path.join(root, "dist", "manifest.webmanifest");
  const sw = path.join(root, "dist", "sw.js");
  const ok = existsSync(manifest) && existsSync(sw);
  results.push({
    name: "PWA artifacts",
    ok,
    durationMs: 0,
    optional: false,
  });
  if (!ok) {
    console.error("\n✗ PWA: dist/manifest.webmanifest ou dist/sw.js manquant\n");
  } else {
    console.log("\n✓ PWA artifacts présents\n");
  }
  return ok;
}

const steps = [
  ["Lint", "npm", ["run", "lint"]],
  ["Unit tests", "npm", ["test"]],
  ["Typecheck", "npx", ["tsc", "-b", "--pretty"]],
];

if (!skipBuild) {
  steps.push(["Build", "npm", ["run", "build"]]);
}

let allOk = true;

for (const [name, command, stepArgs] of steps) {
  const ok = runStep(name, command, stepArgs);
  if (!ok) allOk = false;
}

if (!skipBuild) {
  const pwaOk = checkPwaArtifacts();
  if (!pwaOk) allOk = false;
}

if (withGuardian) {
  const guardianOk = runStep("Quality Guardian", "npm", ["run", "quality-guardian:report"], true);
  if (!guardianOk) allOk = false;
} else {
  results.push({
    name: "Quality Guardian",
    ok: true,
    durationMs: 0,
    optional: true,
    skipped: true,
  });
  console.log("\n○ Quality Guardian ignoré (ajoutez --with-guardian pour l'exécuter)\n");
}

mkdirSync(reportsDir, { recursive: true });

const lines = [
  "# Release Check Report",
  "",
  `Date: ${new Date().toISOString()}`,
  "",
  `Statut global: **${allOk ? "OK" : "ÉCHEC"}**`,
  "",
  "| Étape | Résultat | Durée |",
  "| --- | --- | --- |",
];

for (const item of results) {
  const status = item.skipped ? "Ignoré" : item.ok ? "OK" : "ÉCHEC";
  lines.push(`| ${item.name} | ${status} | ${item.durationMs} ms |`);
}

lines.push("", "## Commandes", "", "```bash", "npm run release-check", "npm run release-check -- --with-guardian", "```", "");

writeFileSync(reportPath, lines.join("\n"), "utf8");
console.log(`\nRapport écrit : ${reportPath}\n`);

process.exit(allOk ? 0 : 1);
