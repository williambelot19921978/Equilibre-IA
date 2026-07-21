/** @vitest-environment happy-dom */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildHealthDashboard } from "./aggregatesService";
import { isAuraAdmin } from "./adminAccess";
import { toAnonymousId, sanitizeMeta } from "./anonymize";
import { clearInsightEvents, listInsightEvents, trackInsightEvent } from "./eventStore";
import { isAnalyticsAllowedForUser } from "./privacyGate";
import { setPrivacyPreference } from "../trustCenter/privacyPreferencesStore";

const USER = "insights-user-1";

describe("AuraInsights anonymization", () => {
  it("produces stable anonymous ids without raw user id", () => {
    const anon = toAnonymousId(USER);
    expect(anon).toMatch(/^anon_/);
    expect(anon).not.toContain(USER);
    expect(toAnonymousId(USER)).toBe(anon);
  });

  it("sanitizes meta and drops free text", () => {
    const safe = sanitizeMeta({
      domain: "sport",
      note: "secret personal note",
      durationMs: 120,
    });
    expect(safe.domain).toBe("sport");
    expect(safe.durationMs).toBe(120);
    expect(safe.note).toBeUndefined();
  });
});

describe("AuraInsights privacy gate", () => {
  beforeEach(() => {
    localStorage.clear();
    clearInsightEvents();
  });

  it("does not track when shareAnalytics is disabled", () => {
    setPrivacyPreference(USER, "shareAnalytics", false);
    expect(isAnalyticsAllowedForUser(USER)).toBe(false);
    trackInsightEvent(USER, "app_opened", { feature: "home" });
    expect(listInsightEvents()).toHaveLength(0);
  });

  it("tracks anonymous events when allowed", () => {
    setPrivacyPreference(USER, "shareAnalytics", true);
    trackInsightEvent(USER, "account_created", {});
    trackInsightEvent(USER, "onboarding_completed", { durationMs: 1000 });
    trackInsightEvent(USER, "checkin_completed", { mode: "standard" });
    expect(listInsightEvents()).toHaveLength(3);
  });
});

describe("AuraInsights aggregates", () => {
  beforeEach(() => {
    localStorage.clear();
    clearInsightEvents();
    setPrivacyPreference(USER, "shareAnalytics", true);
    trackInsightEvent(USER, "account_created", {});
    trackInsightEvent(USER, "onboarding_completed", { durationMs: 2000 });
    trackInsightEvent(USER, "advice_accepted", { domain: "sport" });
    trackInsightEvent(USER, "advice_ignored", { domain: "family" });
  });

  it("builds health dashboard with funnel", () => {
    const dashboard = buildHealthDashboard();
    expect(dashboard.funnel.steps.account_created).toBeGreaterThan(0);
    expect(dashboard.adviceAccepted).toBe(1);
    expect(dashboard.coachByDomain.sport.accepted).toBe(1);
  });
});

describe("AuraInsights admin access", () => {
  it("checks admin allowlist from env", () => {
    vi.stubEnv("VITE_AURA_ADMIN_EMAILS", "admin@test.com,other@test.com");
    expect(isAuraAdmin("admin@test.com")).toBe(true);
    expect(isAuraAdmin("user@test.com")).toBe(false);
    vi.unstubAllEnvs();
  });
});
