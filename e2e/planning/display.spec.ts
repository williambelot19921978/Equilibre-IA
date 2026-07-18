import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { test, expect } from "../../fixtures/base.fixture";
import { hasTestCredentials } from "../helpers/auth";
import { goToPlanning } from "../helpers/navigation";

const authFile = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../playwright/.auth/user.json",
);

test.describe("PLANNING — affichage", () => {
  test.skip(
    !hasTestCredentials(),
    "PLAYWRIGHT_TEST_EMAIL et PLAYWRIGHT_TEST_PASSWORD requis",
  );
  test.skip(!existsSync(authFile), "Fichier playwright/.auth/user.json absent");

  test("page planning chargée avec navigation journalière", async ({ page }) => {
    await goToPlanning(page);

    await expect(page).toHaveURL(/\/planning$/);
    await expect(page.getByText("Planning vivant")).toBeVisible();
    await expect(page.locator(".planning-header-main h1")).toBeVisible();
    await expect(page.locator(".day-navigation-bar")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Timeline du jour" }),
    ).toBeVisible();
  });
});
