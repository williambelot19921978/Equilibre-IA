import type { Page } from "@playwright/test";

const IGNORED_URL_PATTERNS = [
  /\.(png|jpe?g|gif|svg|webp|ico|woff2?|ttf|css)(\?|$)/i,
  /favicon/i,
  /google-analytics/i,
  /googletagmanager/i,
];

const TRACKED_RESOURCE_TYPES = new Set(["document", "xhr", "fetch"]);

const EXPECTED_LOGOUT_URL_PATTERNS = [
  /\/auth\/v1\/logout/i,
  /\/auth\/v1\/token/i,
];

type ErrorMonitorOptions = {
  allowPostLogout401Until?: number;
};

function shouldTrackUrl(url: string): boolean {
  return !IGNORED_URL_PATTERNS.some((pattern) => pattern.test(url));
}

function isExpectedLogoutResponse(url: string, status: number): boolean {
  if (!EXPECTED_LOGOUT_URL_PATTERNS.some((pattern) => pattern.test(url))) {
    return false;
  }
  return status === 204 || status === 200 || status === 401;
}

export type ErrorMonitor = {
  getJavaScriptErrors: () => string[];
  getNetworkErrors: () => string[];
  markLogoutStarted: () => void;
  assertNoErrors: () => void;
};

export function createErrorMonitor(
  page: Page,
  options: ErrorMonitorOptions = {},
): ErrorMonitor {
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
        (text.includes("429") && /auth\/v1/i.test(text)) ||
        (logoutStartedAt !== null &&
          text.includes("Failed to fetch") &&
          text.includes("signOut"))
      ) {
        return;
      }
      javascriptErrors.push(text);
    }
  });

  page.on("requestfailed", (request) => {
    const resourceType = request.resourceType();
    const url = request.url();
    const failureText = request.failure()?.errorText ?? "";
    if (
      failureText.includes("ERR_ABORTED") ||
      failureText.includes("NS_BINDING_ABORTED") ||
      failureText.includes("net::ERR_FAILED")
    ) {
      return;
    }
    if (!TRACKED_RESOURCE_TYPES.has(resourceType) || !shouldTrackUrl(url)) {
      return;
    }
    networkErrors.push(`request failed: ${failureText || "unknown"} — ${url}`);
  });

  page.on("response", (response) => {
    const resourceType = response.request().resourceType();
    const url = response.url();
    const status = response.status();

    if (!TRACKED_RESOURCE_TYPES.has(resourceType) || !shouldTrackUrl(url)) {
      return;
    }

    if (isExpectedLogoutResponse(url, status)) {
      return;
    }

    if (status === 429 && /\/auth\/v1\//i.test(url)) {
      return;
    }

    if (
      logoutStartedAt !== null &&
      status === 401 &&
      url.includes("supabase.co/rest/v1/") &&
      Date.now() <= logoutStartedAt + (options.allowPostLogout401Until ?? 3_000)
    ) {
      return;
    }

    if (status >= 400) {
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
          `Erreurs JavaScript détectées:\n${javascriptErrors.join("\n")}`,
        );
      }
      if (networkErrors.length > 0) {
        throw new Error(
          `Erreurs réseau détectées:\n${networkErrors.join("\n")}`,
        );
      }
    },
  };
}
