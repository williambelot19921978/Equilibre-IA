import { test, expect } from "@playwright/test";

const email = process.env.PLAYWRIGHT_TEST_EMAIL;
const password = process.env.PLAYWRIGHT_TEST_PASSWORD;

test.describe("Workout player", () => {
  test.skip(!email || !password, "PLAYWRIGHT_TEST_EMAIL/PASSWORD requis");

  test("Faire la séance ouvre le player et démarre le chrono", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(email!);
    await page.getByLabel(/mot de passe/i).fill(password!);
    await page.getByRole("button", { name: /connexion|se connecter/i }).click();
    await page.waitForURL("**/home**", { timeout: 30_000 });

    const startButton = page.getByRole("button", { name: /faire la séance|faire cette séance/i }).first();
    await expect(startButton).toBeVisible({ timeout: 30_000 });
    await startButton.click();

    await expect(page.getByRole("dialog", { name: /séance en cours/i })).toBeVisible();
    await page.getByRole("button", { name: "Démarrer" }).click();
    await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
  });
});
