/**
 * QA-2 — Console Guardian (strict console / page error interception).
 */

import type { Page } from "@playwright/test";

export type ConsoleGuardianEntry = {
  kind: "console" | "pageerror" | "unhandledrejection";
  message: string;
  pageUrl: string;
  scenario?: string;
  stack?: string;
};

const CONSOLE_ALLOWLIST: RegExp[] = [
  /JWT issued at future/i,
  /status of 429/i,
  /rate limit/i,
  /Failed to fetch.*signOut/i,
  /Encountered two children with the same key/i,
  /React DevTools/i,
];

export type ConsoleGuardian = {
  entries: ConsoleGuardianEntry[];
  markLogoutStarted: () => void;
  setScenario: (scenario: string) => void;
  assertClean: () => void;
  getReport: () => ConsoleGuardianEntry[];
};

export function createConsoleGuardian(page: Page): ConsoleGuardian {
  const entries: ConsoleGuardianEntry[] = [];
  let logoutStartedAt: number | null = null;
  let scenario = "unknown";

  function isAllowed(message: string, duringLogout: boolean): boolean {
    if (duringLogout && /Failed to fetch/i.test(message)) {
      return true;
    }

    return CONSOLE_ALLOWLIST.some((pattern) => pattern.test(message));
  }

  page.on("pageerror", (error) => {
    entries.push({
      kind: "pageerror",
      message: error.message,
      pageUrl: page.url(),
      scenario,
      stack: error.stack,
    });
  });

  page.on("console", (message) => {
    if (message.type() !== "error") return;

    const text = message.text();
    const duringLogout =
      logoutStartedAt !== null && Date.now() <= logoutStartedAt + 10_000;

    if (duringLogout && /ERR_CONNECTION_CLOSED|Failed to fetch/i.test(text)) return;

    if (isAllowed(text, duringLogout)) return;

    entries.push({
      kind: "console",
      message: text,
      pageUrl: page.url(),
      scenario,
    });
  });

  page.on("requestfailed", (request) => {
    const failure = request.failure();
    if (!failure) return;

    if (failure.errorText.includes("ERR_ABORTED")) return;
    if (failure.errorText.includes("ERR_CONNECTION_REFUSED")) return;

    const duringLogout =
      logoutStartedAt !== null && Date.now() <= logoutStartedAt + 10_000;
    if (duringLogout && failure.errorText.includes("ERR_CONNECTION_CLOSED")) return;
    if (duringLogout && /signOut|logout/i.test(request.url())) return;

    entries.push({
      kind: "unhandledrejection",
      message: `${failure.errorText} — ${request.method()} ${maskUrl(request.url())}`,
      pageUrl: page.url(),
      scenario,
    });
  });

  return {
    entries,
    markLogoutStarted: () => {
      logoutStartedAt = Date.now();
    },
    setScenario: (value: string) => {
      scenario = value;
    },
    assertClean: () => {
      if (entries.length === 0) return;

      const formatted = entries
        .map(
          (entry) =>
            `[${entry.kind}] (${entry.scenario}) ${entry.pageUrl}\n  ${entry.message}${entry.stack ? `\n  ${entry.stack}` : ""}`,
        )
        .join("\n\n");

      throw new Error(`Console Guardian — erreurs non autorisées:\n${formatted}`);
    },
    getReport: () => [...entries],
  };
}

export function maskUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.search = parsed.search ? "?…" : "";
    parsed.pathname = parsed.pathname.replace(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      "{id}",
    );
    return parsed.toString();
  } catch {
    return url.replace(/[0-9a-f-]{36}/gi, "{id}");
  }
}
