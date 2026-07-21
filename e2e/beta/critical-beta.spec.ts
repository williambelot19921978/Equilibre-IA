import { test, expect } from "../../fixtures/base.fixture";

/**
 * EPIC 9 — Critical beta smoke routes (authenticated).
 * Requires auth setup + PLAYWRIGHT_TEST_EMAIL/PASSWORD.
 */

const CRITICAL_ROUTES = [
  { path: "/home", testId: null, heading: /accueil|bonjour|aujourd/i },
  { path: "/settings", testId: "beta-release-settings", heading: /paramètres|contrôler/i },
  { path: "/settings/whats-new", testId: "whats-new-page", heading: /quoi de neuf/i },
  { path: "/settings/trust", testId: "trust-center-page", heading: /confiance|confidentialité/i },
  { path: "/settings/notifications", testId: null, heading: /notification/i },
  { path: "/planning", testId: null, heading: /planning/i },
  { path: "/daily-check-in", testId: null, heading: /check-in|ressenti/i },
  { path: "/organization/personal-coach", testId: null, heading: /coach/i },
  { path: "/goals", testId: null, heading: /objectif/i },
  { path: "/daily-state/history", testId: null, heading: /historique|ressenti/i },
  { path: "/about", testId: null, heading: /à propos|aura/i },
];

test.describe("BETA — parcours critiques", () => {
  for (const route of CRITICAL_ROUTES) {
    test(`charge ${route.path}`, async ({ page }) => {
      await page.goto(route.path);
      await expect(page).not.toHaveURL(/\/login$/);

      if (route.testId) {
        await expect(page.getByTestId(route.testId)).toBeVisible({ timeout: 15_000 });
      } else if (route.heading) {
        await expect(page.getByRole("heading", { name: route.heading }).first()).toBeVisible({
          timeout: 15_000,
        });
      }
    });
  }

  test("Trust Center — panneaux export et suppression visibles", async ({ page }) => {
    await page.goto("/settings/trust");
    await expect(page.getByTestId("trust-center-page")).toBeVisible();
    await expect(page.getByRole("heading", { name: /export/i }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /suppression|effacer/i }).first()).toBeVisible();
  });

  test("page d'erreur 404 avec actions", async ({ page }) => {
    await page.goto("/route-inexistante-beta-9");
    await expect(page.getByTestId("error-home")).toBeVisible();
    await expect(page.getByTestId("error-report")).toBeVisible();
  });

  test("mode hors ligne — indicateur sync visible", async ({ page, context }) => {
    await page.goto("/home");
    await context.setOffline(true);
    await expect(page.getByTestId("sync-status-indicator")).toBeVisible({
      timeout: 15_000,
    });
    await context.setOffline(false);
  });
});

const VIEWPORTS = [
  { name: "mobile", width: 375, height: 667 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
];

for (const viewport of VIEWPORTS) {
  test.describe(`BETA — responsive ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test("home et paramètres restent utilisables", async ({ page }) => {
      await page.goto("/home");
      await expect(page).not.toHaveURL(/\/login$/);
      await expect(page.locator("main")).toBeVisible();

      await page.goto("/settings");
      await expect(page.getByTestId("beta-release-settings")).toBeVisible({
        timeout: 15_000,
      });
    });
  });
}

test.describe("BETA — check-in direct sans boucle", () => {
  test("navigation directe /daily-check-in reste sur check-in", async ({ page }) => {
    await page.goto("/daily-check-in");
    await expect(page).toHaveURL(/\/daily-check-in/);
    await expect(page.getByRole("heading", { name: /check-in|ressenti/i }).first()).toBeVisible({
      timeout: 15_000,
    });
  });
});
