/** @typedef {import('@playwright/test/reporter').FullResult} FullResult */
/** @typedef {import('@playwright/test/reporter').TestCase} TestCase */
/** @typedef {import('@playwright/test/reporter').TestResult} TestResult */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const CRITICAL_PATHS = [
  "/auth/",
  "/onboarding/",
  "/planning/",
  "/goals/",
  "/dailyBrief/",
  "/household/",
  "/collaboration/",
  "/rls/",
  "/zz-session/",
];

function isCriticalTest(test) {
  const file = test.location.file.replace(/\\/g, "/");
  return CRITICAL_PATHS.some((fragment) => file.includes(fragment));
}

function loadJson(relativePath) {
  const absolutePath = path.join(process.cwd(), relativePath);
  if (!existsSync(absolutePath)) return null;
  try {
    return JSON.parse(readFileSync(absolutePath, "utf8"));
  } catch {
    return null;
  }
}

function countScreenshots(runId) {
  const runsDir = path.join(process.cwd(), "tests", "e2e", "screenshots", "runs", runId);
  if (!existsSync(runsDir)) return { count: 0, path: runsDir };

  let count = 0;
  const stack = [runsDir];

  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(entryPath);
      if (entry.isFile() && entry.name.endsWith(".png")) count += 1;
    }
  }

  return { count, path: runsDir };
}

class GuardianMarkdownReporter {
  constructor() {
    /** @type {Array<{title: string, status: string, duration: number, project: string, file: string, error?: string}>} */
    this.entries = [];
    this.startedAt = Date.now();
  }

  /** @param {TestCase} test @param {TestResult} result */
  onTestEnd(test, result) {
    this.entries.push({
      title: test.title,
      status: result.status,
      duration: result.duration,
      project: test.parent.project()?.name ?? "unknown",
      file: test.location.file,
      error: result.error?.message,
    });
  }

  /** @param {FullResult} result */
  onEnd(result) {
    const reportDir = path.join("tests", "e2e", "reports");
    mkdirSync(reportDir, { recursive: true });

    const preflight = loadJson("tests/e2e/reports/preflight-report.json");
    const personaState = loadJson("tests/e2e/reports/guardian-state.json");
    const runId = preflight?.runId ?? process.env.GUARDIAN_RUN_ID ?? "unknown";
    const durationMs = Date.now() - this.startedAt;
    const screenshots = countScreenshots(runId);

    const total = this.entries.length;
    const passed = this.entries.filter((entry) => entry.status === "passed").length;
    const failed = this.entries.filter((entry) => entry.status === "failed").length;
    const skipped = this.entries.filter((entry) => entry.status === "skipped").length;
    const voluntarySkipped = this.entries.filter(
      (entry) =>
        entry.status === "skipped" &&
        (entry.error?.includes("CRITICAL_SKIP") ||
          entry.error?.includes("GuardianCriticalSkipError")),
    );
    const dependencySkipped = this.entries.filter(
      (entry) =>
        entry.status === "skipped" &&
        !entry.error?.includes("CRITICAL_SKIP") &&
        !entry.error?.includes("GuardianCriticalSkipError"),
    );
    const criticalSkipped = this.entries.filter(
      (entry) => entry.status === "skipped" && isCriticalTest({ location: { file: entry.file } }),
    );
    const criticalFailures = this.entries.filter(
      (entry) =>
        entry.status === "failed" &&
        (isCriticalTest({ location: { file: entry.file } }) ||
          entry.error?.includes("CRITICAL_SKIP")),
    );

    const executed = total - skipped;
    const flags = preflight?.flags ?? {};
    const baseUrl = preflight?.baseUrl ?? "http://localhost:5173";

    const ready =
      failed === 0 &&
      criticalSkipped.length === 0 &&
      criticalFailures.length === 0 &&
      dependencySkipped.length === 0 &&
      executed >= 15 &&
      result.status === "passed";

    const verdict = ready
      ? "READY FOR DEPLOYMENT"
      : "NOT READY FOR DEPLOYMENT";

    const lines = [
      "# QUALITY GUARDIAN REPORT",
      "",
      "## Run",
      "",
      `| Champ | Valeur |`,
      `|-------|--------|`,
      `| Run ID | ${runId} |`,
      `| Date | ${new Date().toISOString()} |`,
      `| Durée | ${(durationMs / 1000).toFixed(1)} s |`,
      `| URL testée | ${baseUrl} |`,
      `| Build testé | dist ${existsSync(path.join(process.cwd(), "dist/index.html")) ? "présent" : "absent"} |`,
      "",
      "## PRE-FLIGHT",
      "",
    ];

    if (preflight?.checks) {
      for (const check of preflight.checks) {
        lines.push(`- ${check.ok ? "✅" : "❌"} **${check.name}** — ${check.detail}`);
      }
    } else {
      lines.push("- ⚠️ Rapport preflight absent");
    }

    lines.push("", "## PERSONAS", "");

    if (personaState?.personas) {
      for (const persona of personaState.personas) {
        lines.push(
          `- **${persona.label}** (${persona.id}) — ${persona.email} — foyer ${persona.householdId ?? "n/a"} — ${persona.notes.join("; ")}`,
        );
      }
      lines.push(
        "",
        `- Service role : ${personaState.serviceRoleAvailable ? "oui" : "non"}`,
        `- Nettoyage seed : ${personaState.cleanupPerformed ? "oui" : "non"}`,
      );
      if (personaState.seedSummary?.length) {
        lines.push("", "Seed :", ...personaState.seedSummary.map((item) => `- ${item}`));
      }
    } else {
      lines.push("- ⚠️ État personas non disponible");
    }

    lines.push("", "## FEATURE FLAGS", "");
    for (const [key, value] of Object.entries(flags)) {
      lines.push(`- ${key} = ${value}`);
    }

    lines.push(
      "",
      "## SCÉNARIOS",
      "",
      `| Métrique | Valeur |`,
      `|----------|--------|`,
      `| Exécutés | ${executed} |`,
      `| Réussis | ${passed} |`,
      `| Échoués | ${failed} |`,
      `| Ignorés | ${skipped} |`,
      `| Ignorés volontaires | ${voluntarySkipped.length} |`,
      `| Non exécutés (dépendance) | ${dependencySkipped.length} |`,
      `| Ignorés critiques | ${criticalSkipped.length} |`,
      "",
      "| Projet | Scénario | Statut | Durée (ms) |",
      "|--------|----------|--------|------------|",
    );

    for (const entry of this.entries) {
      lines.push(
        `| ${entry.project} | ${entry.title} | ${entry.status} | ${Math.round(entry.duration)} |`,
      );
    }

    const consoleErrors = this.entries
      .filter((entry) => entry.error?.includes("Console Guardian"))
      .map((entry) => `- ${entry.title}: ${entry.error?.split("\n")[0] ?? ""}`);
    const networkErrors = this.entries
      .filter((entry) => entry.error?.includes("Network Guardian"))
      .map((entry) => `- ${entry.title}: ${entry.error?.split("\n")[0] ?? ""}`);

    lines.push("", "## CONSOLE", "");
    lines.push(consoleErrors.length ? consoleErrors.join("\n") : "- Aucune erreur console remontée.");

    lines.push("", "## RÉSEAU", "");
    lines.push(networkErrors.length ? networkErrors.join("\n") : "- Aucune erreur réseau remontée.");

    lines.push(
      "",
      "## CAPTURES",
      "",
      `- Nombre : ${screenshots.count}`,
      `- Chemin : \`${path.relative(process.cwd(), screenshots.path).replace(/\\/g, "/")}\``,
      "",
      "## VERDICT",
      "",
      verdict,
      "",
      "## Rapport HTML",
      "",
      "Ouvrir : `tests/e2e/reports/html/index.html`",
      "",
    );

    writeFileSync(path.join(reportDir, "guardian-report.md"), lines.join("\n"), "utf8");

    writeFileSync(
      path.join(reportDir, "guardian-verdict.json"),
      JSON.stringify(
        {
          runId,
          verdict,
          ready,
          passed,
          failed,
          skipped,
          criticalSkipped: criticalSkipped.length,
          executed,
          durationMs,
        },
        null,
        2,
      ),
      "utf8",
    );
  }
}

export default GuardianMarkdownReporter;
