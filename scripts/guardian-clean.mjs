#!/usr/bin/env node
/**
 * QA-2 — Clean temporary Guardian artefacts before a run.
 */

import { existsSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const TARGETS = [
  "tests/e2e/test-results",
  "tests/e2e/reports/html",
  "tests/e2e/reports/results.json",
  "tests/e2e/reports/guardian-report.md",
  "tests/e2e/reports/preflight-report.json",
  "tests/e2e/reports/guardian-state.json",
  "tests/e2e/reports/console-network-log.json",
  "tests/e2e/.auth/william-admin.json",
  "tests/e2e/.auth/madeline.json",
  "tests/e2e/.auth/rls-household-b.json",
  "tests/e2e/.auth/solo.json",
  "tests/e2e/.auth/famille-test.json",
];

function clean() {
  console.log("\n🧹 Quality Guardian — nettoyage\n");

  for (const relativePath of TARGETS) {
    const absolutePath = path.join(root, relativePath);
    if (!existsSync(absolutePath)) continue;

    rmSync(absolutePath, { recursive: true, force: true });
    console.log(`   supprimé : ${relativePath}`);
  }

  console.log("\n✅ Nettoyage terminé.\n");
}

clean();
