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
  await page.context().storageState({ path: authFile });
});
