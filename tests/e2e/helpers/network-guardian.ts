/**
 * QA-2 — Network Guardian (unexpected HTTP status interception).
 */

import type { Page, Request } from "@playwright/test";

import { maskUrl } from "./console-guardian";

export type NetworkGuardianEntry = {
  method: string;
  url: string;
  status: number;
  statusText: string;
  scenario: string;
  step: string;
  allowed: boolean;
};

const IGNORED_URL_PATTERNS = [
  /\.(png|jpe?g|gif|svg|webp|ico|woff2?|ttf|css)(\?|$)/i,
  /favicon/i,
  /chrome-extension:/i,
];

const TRACKED_RESOURCE_TYPES = new Set(["document", "xhr", "fetch"]);

const ERROR_STATUSES = new Set([400, 401, 403, 404, 409, 422, 429, 500, 502, 503, 504]);

export type NetworkAllowRule = {
  status: number;
  urlPattern: RegExp;
  reason: string;
};

export type NetworkGuardian = {
  entries: NetworkGuardianEntry[];
  setScenario: (scenario: string) => void;
  setStep: (step: string) => void;
  allow: (rule: NetworkAllowRule) => void;
  markLogoutStarted: () => void;
  assertClean: () => void;
  getReport: () => NetworkGuardianEntry[];
};

function shouldTrack(request: Request): boolean {
  const url = request.url();
  if (IGNORED_URL_PATTERNS.some((pattern) => pattern.test(url))) {
    return false;
  }

  return TRACKED_RESOURCE_TYPES.has(request.resourceType());
}

export function createNetworkGuardian(page: Page): NetworkGuardian {
  const entries: NetworkGuardianEntry[] = [];
  const allowRules: NetworkAllowRule[] = [];
  let scenario = "unknown";
  let step = "init";
  let logoutStartedAt: number | null = null;

  page.on("response", (response) => {
    const request = response.request();
    if (!shouldTrack(request)) return;

    const status = response.status();
    if (!ERROR_STATUSES.has(status) && status < 400) return;

    const url = request.url();
    const method = request.method();

    if (status === 429 && /\/auth\/v1\//i.test(url)) return;
    if (status === 400 && /\/auth\/v1\/signup/i.test(url)) return;
    if (/\/auth\/v1\/logout/i.test(url)) return;

    if (
      logoutStartedAt !== null &&
      status === 401 &&
      url.includes("supabase.co/rest/v1/") &&
      Date.now() <= logoutStartedAt + 5_000
    ) {
      return;
    }

    const allowed = allowRules.some(
      (rule) => rule.status === status && rule.urlPattern.test(url),
    );

    entries.push({
      method,
      url: maskUrl(url),
      status,
      statusText: response.statusText(),
      scenario,
      step,
      allowed,
    });
  });

  return {
    entries,
    setScenario: (value: string) => {
      scenario = value;
    },
    setStep: (value: string) => {
      step = value;
    },
    allow: (rule: NetworkAllowRule) => {
      allowRules.push(rule);
    },
    markLogoutStarted: () => {
      logoutStartedAt = Date.now();
    },
    assertClean: () => {
      const unexpected = entries.filter((entry) => !entry.allowed);
      if (unexpected.length === 0) return;

      const formatted = unexpected
        .map(
          (entry) =>
            `[${entry.scenario}/${entry.step}] ${entry.method} ${entry.status} ${entry.statusText}\n  ${entry.url}`,
        )
        .join("\n\n");

      throw new Error(`Network Guardian — réponses inattendues:\n${formatted}`);
    },
    getReport: () => [...entries],
  };
}
