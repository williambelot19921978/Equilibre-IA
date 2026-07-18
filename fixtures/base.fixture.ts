import { test as base, expect } from "@playwright/test";

import { saveFailureArtifacts } from "../e2e/helpers/artifacts";
import { createErrorMonitor } from "../e2e/helpers/errors";

type QaFixtures = {
  qaMonitor: void;
  errorMonitor: ReturnType<typeof createErrorMonitor>;
};

export const test = base.extend<QaFixtures>({
  errorMonitor: async ({ page }, use) => {
    const monitor = createErrorMonitor(page, { allowPostLogout401Until: 5_000 });
    await use(monitor);
  },
  qaMonitor: [
    async ({ page, errorMonitor }, use, testInfo) => {
      await use();
      errorMonitor.assertNoErrors();
      await saveFailureArtifacts(page, testInfo);
    },
    { auto: true },
  ],
});

export { expect };
