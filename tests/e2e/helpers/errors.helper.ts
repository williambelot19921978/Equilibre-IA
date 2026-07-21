import type { Page } from "@playwright/test";

const IGNORED_URL_PATTERNS = [
  /\.(png|jpe?g|gif|svg|webp|ico|woff2?|ttf|css)(\?|$)/i,
  /favicon/i,
];

const TRACKED_RESOURCE_TYPES = new Set(["document", "xhr", "fetch"]);

function shouldTrackUrl(url: string): boolean {
  return !IGNORED_URL_PATTERNS.some((pattern) => pattern.test(url));
}

export type GuardianErrorMonitor = {
  getJavaScriptErrors: () => string[];
  getNetworkErrors: () => string[];
  markLogoutStarted: () => void;
  assertNoErrors: () => void;
};

export function createGuardianErrorMonitor(page: Page): GuardianErrorMonitor {
  const javascriptErrors: string[] = [];
  const networkErrors: string[] = [];
  let logoutStartedAt: number | null = null;

  page.on("pageerror", (error) => {
    javascriptErrors.push(error.message);
  });

  page.on("console", (message) => {
    if (message.type() === "error") {
      const text = message.text();
      if (
        text.includes("JWT issued at future") ||
        text.includes("status of 429") ||
        text.includes("status of 400") ||
        text.includes("rate limit") ||
        (logoutStartedAt !== null &&
          text.includes("Failed to fetch") &&
          text.includes("signOut"))
      ) {
        return;
      }
      javascriptErrors.push(text);
    }
  });

  page.on("response", (response) => {
    const resourceType = response.request().resourceType();
    const url = response.url();
    const status = response.status();

    if (!TRACKED_RESOURCE_TYPES.has(resourceType) || !shouldTrackUrl(url)) {
      return;
    }

    if (status === 429 && /\/auth\/v1\//i.test(url)) return;

    if (status === 400 && /\/auth\/v1\/signup/i.test(url)) return;

    if (
      logoutStartedAt !== null &&
      status === 401 &&
      url.includes("supabase.co/rest/v1/") &&
      Date.now() <= logoutStartedAt + 5_000
    ) {
      return;
    }

    if (status >= 400 && !/\/auth\/v1\/logout/i.test(url)) {
      networkErrors.push(`${status} ${response.statusText()} — ${url}`);
    }
  });

  return {
    getJavaScriptErrors: () => [...javascriptErrors],
    getNetworkErrors: () => [...networkErrors],
    markLogoutStarted: () => {
      logoutStartedAt = Date.now();
    },
    assertNoErrors: () => {
      if (javascriptErrors.length > 0) {
        throw new Error(
          `Erreurs JavaScript:\n${javascriptErrors.join("\n")}`,
        );
      }
      if (networkErrors.length > 0) {
        throw new Error(`Erreurs réseau:\n${networkErrors.join("\n")}`);
      }
    },
  };
}
