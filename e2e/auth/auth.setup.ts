import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { test as setup } from "../../fixtures/base.fixture";
import { getTestCredentials, hasTestCredentials, loginWithTestAccount } from "../helpers/auth";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const authDir = path.join(__dirname, "../../playwright/.auth");
const authFile = path.join(authDir, "user.json");

setup("authentifier le compte de test", async ({ page }) => {
  mkdirSync(authDir, { recursive: true });

  if (!hasTestCredentials()) {
    await page.goto("/login");
    await page.context().storageState({ path: authFile });
    setup.skip(true, "PLAYWRIGHT_TEST_EMAIL et PLAYWRIGHT_TEST_PASSWORD requis");
  }

  await loginWithTestAccount(page);
  // S'assurer d'être sur l'accueil (skip check-in déjà géré dans login).
  if (!page.url().includes("/home")) {
    await page.goto("/home");
    const skip = page.getByTestId("daily-checkin-skip");
    if (await skip.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await skip.click();
      await page.waitForURL(/\/home/, { timeout: 15_000 });
    }
  }
  await page.context().storageState({ path: authFile });
});
