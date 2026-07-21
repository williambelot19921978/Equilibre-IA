/** @vitest-environment happy-dom */
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  APP_VERSION,
  CHANGELOG,
  formatDisplayVersion,
  getChannelLabel,
  getChecklistProgress,
  getLaunchChecklist,
  getReleaseChannel,
  hasUnseenChangelog,
  isBetaModeEnabled,
  markChangelogSeen,
  parseVersion,
  resetLaunchChecklist,
  updateLaunchChecklistItem,
} from "./index";
import { consumeErrorReport, stashErrorReport } from "./errorReport";

describe("release versioning", () => {
  it("parses semver with prerelease", () => {
    const parsed = parseVersion("1.0.0-beta.1");
    expect(parsed).toEqual({
      major: 1,
      minor: 0,
      patch: 0,
      prerelease: "beta.1",
    });
  });

  it("formats display version with v prefix", () => {
    expect(formatDisplayVersion("1.0.0-beta.1")).toBe("v1.0.0-beta.1");
  });

  it("detects beta channel from version", () => {
    expect(getReleaseChannel()).toBe("beta");
    expect(getChannelLabel("beta")).toBe("Beta");
  });
});

describe("beta mode", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.unstubAllEnvs();
  });

  it("is enabled for beta version by default", () => {
    expect(isBetaModeEnabled()).toBe(true);
  });

  it("can be disabled via env", () => {
    vi.stubEnv("VITE_AURA_BETA_MODE", "false");
    expect(isBetaModeEnabled()).toBe(false);
  });
});

describe("launch checklist", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("tracks progress", () => {
    const items = getLaunchChecklist();
    expect(items.length).toBeGreaterThan(8);
    updateLaunchChecklistItem("build", { status: "done" });
    const progress = getChecklistProgress();
    expect(progress.done).toBe(1);
  });

  it("resets to defaults", () => {
    updateLaunchChecklistItem("build", { status: "done", comment: "ok" });
    resetLaunchChecklist();
    expect(getLaunchChecklist().find((item) => item.id === "build")?.status).toBe("pending");
  });
});

describe("changelog", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("has entries for current version", () => {
    expect(CHANGELOG.some((entry) => entry.version === APP_VERSION)).toBe(true);
  });

  it("marks changelog as seen", () => {
    expect(hasUnseenChangelog(APP_VERSION)).toBe(true);
    markChangelogSeen(APP_VERSION);
    expect(hasUnseenChangelog(APP_VERSION)).toBe(false);
  });
});

describe("error report stash", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("stashes and consumes error context", () => {
    stashErrorReport(new Error("boom"), "test");
    const report = consumeErrorReport();
    expect(report?.message).toBe("boom");
    expect(report?.context).toBe("test");
    expect(consumeErrorReport()).toBeNull();
  });
});
