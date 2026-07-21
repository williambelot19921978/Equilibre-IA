import { test as guardianTest, expect } from "./guardian.fixture";
import {
  hasStablePrimaryCredentials,
  loginStablePrimaryUser,
} from "../helpers/auth.helper";
import { assertCriticalPrecondition } from "../helpers/skip-policy";

export const test = guardianTest.extend({
  page: async ({ page }, use) => {
    assertCriticalPrecondition(
      hasStablePrimaryCredentials(),
      "PLAYWRIGHT_TEST_EMAIL et PLAYWRIGHT_TEST_PASSWORD requis pour les scénarios authentifiés.",
    );

    await page.goto("/home");
    if (page.url().includes("/login")) {
      await loginStablePrimaryUser(page);
    }

    await use(page);
  },
});

export { expect };
export { getStablePrimaryCredentials } from "../helpers/auth.helper";
