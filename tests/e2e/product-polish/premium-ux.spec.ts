import { test, expect } from "@playwright/test";

import { completeMinimalOnboarding } from "../helpers/navigation.helper";

test.describe("EPIC 7A — Onboarding premium", () => {
  test("affiche bienvenue puis intro pour un nouvel utilisateur", async ({ page }) => {
    test.skip(!process.env.GUARDIAN_E2E, "Nécessite environnement Guardian");

    await page.goto("/onboarding/welcome");
    await expect(page.getByRole("heading", { name: /bienvenue/i })).toBeVisible();
    await page.getByTestId("onboarding-welcome-continue").click();
    await expect(page.getByRole("heading", { name: /aura en bref/i })).toBeVisible();
  });
});

test.describe("EPIC 7A — Accueil premium", () => {
  test("dashboard premium visible après onboarding", async ({ page }) => {
    test.skip(!process.env.GUARDIAN_E2E, "Nécessite session authentifiée");

    await completeMinimalOnboarding(page);
    await expect(page.getByTestId("home-premium-dashboard")).toBeVisible({
      timeout: 30_000,
    });
  });
});
