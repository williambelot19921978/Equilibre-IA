import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { test as setup } from "../fixtures/guardian.fixture";
import { loginStablePrimaryUser, hasStablePrimaryCredentials } from "../helpers/auth.helper";
import { provisionGuardianPersonas } from "../helpers/personas.helper";
import { assertCriticalPrecondition } from "../helpers/skip-policy";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const authDir = path.join(__dirname, "../.auth");
const authFile = path.join(authDir, "william-admin.json");

setup("provisionner personas et authentifier William Admin", async ({ page }) => {
  mkdirSync(authDir, { recursive: true });

  assertCriticalPrecondition(
    hasStablePrimaryCredentials(),
    "PLAYWRIGHT_TEST_EMAIL et PLAYWRIGHT_TEST_PASSWORD requis pour les scénarios authentifiés.",
  );

  process.env.GUARDIAN_RUN_ID =
    process.env.GUARDIAN_RUN_ID ??
    new Date().toISOString().replace(/[:.]/g, "-");

  await provisionGuardianPersonas();
  await loginStablePrimaryUser(page);

  const currentUrl = page.url();
  if (!currentUrl.includes("localhost:5173") && !currentUrl.includes("127.0.0.1:5173")) {
    throw new Error(
      `CRITICAL_SKIP: la session Guardian doit être sur localhost:5173, reçu ${currentUrl}`,
    );
  }

  await page.context().storageState({ path: authFile });
});
