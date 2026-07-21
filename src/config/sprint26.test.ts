import { describe, expect, it, vi, afterEach } from "vitest";

import { APP_BETA_LABEL, APP_VERSION } from "./appVersion";
import { isGoogleCalendarEnabled } from "./featureFlags";

describe("Sprint 2.6 — feature flags", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("disables Google Calendar by default", () => {
    vi.stubEnv("VITE_GOOGLE_CALENDAR_ENABLED", undefined);
    expect(isGoogleCalendarEnabled()).toBe(false);
  });

  it("enables Google Calendar only when explicitly true", () => {
    vi.stubEnv("VITE_GOOGLE_CALENDAR_ENABLED", "true");
    expect(isGoogleCalendarEnabled()).toBe(true);
  });

  it("treats false string as disabled", () => {
    vi.stubEnv("VITE_GOOGLE_CALENDAR_ENABLED", "false");
    expect(isGoogleCalendarEnabled()).toBe(false);
  });
});

describe("Sprint 2.6 — app version", () => {
  it("exposes beta version label", () => {
    expect(APP_VERSION).toBe("1.0.0-beta.1");
    expect(APP_BETA_LABEL).toContain("bêta");
  });
});
