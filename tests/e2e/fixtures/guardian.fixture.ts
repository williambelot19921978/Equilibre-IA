import { test as base, expect } from "@playwright/test";

import { createConsoleGuardian } from "../helpers/console-guardian";
import { createNetworkGuardian } from "../helpers/network-guardian";
import {
  captureFailureScreenshot,
  captureGuardianScreenshot,
} from "../helpers/screenshots.helper";

type GuardianFixtures = {
  guardianMonitor: void;
  consoleGuardian: ReturnType<typeof createConsoleGuardian>;
  networkGuardian: ReturnType<typeof createNetworkGuardian>;
  captureBefore: () => Promise<void>;
  captureAfter: () => Promise<void>;
};

export const test = base.extend<GuardianFixtures>({
  consoleGuardian: async ({ page }, use, testInfo) => {
    const monitor = createConsoleGuardian(page);
    monitor.setScenario(`${testInfo.project.name} — ${testInfo.title}`);
    await use(monitor);
  },

  networkGuardian: async ({ page }, use, testInfo) => {
    const monitor = createNetworkGuardian(page);
    monitor.setScenario(`${testInfo.project.name} — ${testInfo.title}`);
    await use(monitor);
  },

  captureBefore: async ({ page }, use, testInfo) => {
    await use(async () => {
      await captureGuardianScreenshot(page, testInfo, "before");
    });
  },

  captureAfter: async ({ page }, use, testInfo) => {
    await use(async () => {
      await captureGuardianScreenshot(page, testInfo, "after");
    });
  },

  guardianMonitor: [
    async (
      { page, consoleGuardian, networkGuardian, captureBefore, captureAfter },
      use,
      testInfo,
    ) => {
      await captureBefore();
      await use();
      await captureAfter();
      consoleGuardian.assertClean();
      networkGuardian.assertClean();
      await captureFailureScreenshot(page, testInfo);
    },
    { auto: true },
  ],
});

export { expect };

/** @deprecated Use consoleGuardian / networkGuardian */
export type GuardianErrorMonitor = {
  markLogoutStarted: () => void;
};

export function createLegacyErrorMonitorAdapter(
  consoleGuardian: ReturnType<typeof createConsoleGuardian>,
  networkGuardian: ReturnType<typeof createNetworkGuardian>,
): GuardianErrorMonitor {
  return {
    markLogoutStarted: () => {
      consoleGuardian.markLogoutStarted();
      networkGuardian.markLogoutStarted();
    },
  };
}
