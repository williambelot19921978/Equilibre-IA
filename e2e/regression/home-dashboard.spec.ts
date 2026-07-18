import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { test, expect } from "../../fixtures/base.fixture";
import { hasTestCredentials } from "../helpers/auth";
import { goToHome } from "../helpers/navigation";

const authFile = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../playwright/.auth/user.json",
);

test.describe("HOME — tableau de bord", () => {
  test.skip(
    !hasTestCredentials(),
    "PLAYWRIGHT_TEST_EMAIL et PLAYWRIGHT_TEST_PASSWORD requis",
  );
  test.skip(!existsSync(authFile), "Fichier playwright/.auth/user.json absent");

  test("ouverture du tableau de bord", async ({ page }) => {
    await goToHome(page);
    await expect(page).toHaveURL(/\/home$/);
    await expect(
      page
        .locator("main.home-page-clean")
        .getByRole("heading", { level: 1, name: /bonjour/i }),
    ).toBeVisible();
  });

  test("widgets principaux présents", async ({ page }) => {
    await goToHome(page);

    await expect(page.locator(".home-widgets-stack")).toBeVisible();
    await expect(page.locator(".home-widget-checkin")).toBeVisible();
    await expect(page.locator(".home-widget-timeline")).toBeVisible();
    await expect(
      page
        .locator(".home-widget-timeline")
        .getByText("Aujourd'hui", { exact: true }),
    ).toBeVisible();
    await expect(page.locator(".home-widget-next")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /prochaine activité/i }),
    ).toBeVisible();
  });
});
