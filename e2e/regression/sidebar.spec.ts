import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { test, expect, type Page } from "../../fixtures/base.fixture";
import { hasTestCredentials } from "../helpers/auth";
import { getSidebar, goToHome } from "../helpers/navigation";

const authFile = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../playwright/.auth/user.json",
);

async function ensureSidebarExpanded(page: Page): Promise<void> {
  const sidebar = getSidebar(page);
  if ((await sidebar.getAttribute("data-collapsed")) === "true") {
    await page.getByRole("button", { name: /déplier la navigation/i }).click();
    await expect(sidebar).toHaveAttribute("data-collapsed", "false");
  }
}

async function waitForSidebarPersistence(page: Page): Promise<void> {
  await page.waitForResponse(
    (response) =>
      response.url().includes("/rest/v1/user_home_preferences") &&
      ["POST", "PATCH", "PUT"].includes(response.request().method()) &&
      response.ok(),
    { timeout: 15_000 },
  );
}

async function collapseSidebar(page: Page): Promise<void> {
  const sidebar = getSidebar(page);
  await ensureSidebarExpanded(page);
  await Promise.all([
    waitForSidebarPersistence(page),
    page.getByRole("button", { name: /replier la navigation/i }).click(),
  ]);
  await expect(sidebar).toHaveAttribute("data-collapsed", "true");
}

async function expandSidebar(page: Page): Promise<void> {
  const sidebar = getSidebar(page);
  if ((await sidebar.getAttribute("data-collapsed")) !== "true") {
    return;
  }

  await Promise.all([
    waitForSidebarPersistence(page),
    page.getByRole("button", { name: /déplier la navigation/i }).click(),
  ]);
  await expect(sidebar).toHaveAttribute("data-collapsed", "false");
}

test.describe("SIDEBAR — navigation latérale", () => {
  test.describe.configure({ mode: "serial" });

  test.skip(
    !hasTestCredentials(),
    "PLAYWRIGHT_TEST_EMAIL et PLAYWRIGHT_TEST_PASSWORD requis",
  );
  test.skip(!existsSync(authFile), "Fichier playwright/.auth/user.json absent");

  test.use({ viewport: { width: 1280, height: 720 } });

  test("replier et déplier la sidebar", async ({ page }) => {
    await goToHome(page);
    await ensureSidebarExpanded(page);

    const sidebar = getSidebar(page);
    await expect(sidebar).toBeVisible();

    await collapseSidebar(page);

    await expandSidebar(page);
  });

  test("persistance de l'état collapsed après reload et navigation", async ({
    page,
  }) => {
    await goToHome(page);
    await ensureSidebarExpanded(page);

    const sidebar = getSidebar(page);
    await collapseSidebar(page);

    await page.reload();
    await expect(page.locator("main.home-page-clean")).toBeVisible();
    await expect(sidebar).toHaveAttribute("data-collapsed", "true");

    await page.getByRole("complementary", { name: "Navigation principale" })
      .getByRole("button", { name: "Planning" })
      .click();
    await expect(page.locator("main.planning-page")).toBeVisible();
    await expect(sidebar).toHaveAttribute("data-collapsed", "true");

    await expandSidebar(page);

    await page.reload();
    await expect(page.locator("main.planning-page")).toBeVisible();
    await expect(sidebar).toHaveAttribute("data-collapsed", "false");
  });
});
