import { describe, expect, it, vi } from "vitest";

import { BackgroundSyncScheduler, DEFAULT_BACKGROUND_SYNC_CONFIG } from "../sync/backgroundSyncScheduler";

describe("EPIC5B backgroundSyncScheduler", () => {
  it("architecture — disabled by default", () => {
    const scheduler = new BackgroundSyncScheduler();
    expect(scheduler.getConfig()).toEqual(DEFAULT_BACKGROUND_SYNC_CONFIG);
    expect(scheduler.isRunning()).toBe(false);
  });

  it("start ne démarre pas si disabled", () => {
    vi.useFakeTimers();
    const handler = vi.fn();
    const scheduler = new BackgroundSyncScheduler();
    scheduler.start(handler);
    vi.advanceTimersByTime(60 * 60 * 1000);
    expect(handler).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("start avec enabled appelle le handler", () => {
    vi.useFakeTimers();
    const handler = vi.fn();
    const scheduler = new BackgroundSyncScheduler();
    scheduler.configure({ enabled: true, intervalMinutes: 1 });
    scheduler.start(handler);
    expect(scheduler.isRunning()).toBe(true);
    vi.advanceTimersByTime(60 * 1000);
    expect(handler).toHaveBeenCalled();
    scheduler.stop();
    vi.useRealTimers();
  });
});
