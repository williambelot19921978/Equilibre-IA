import { expect, type Page } from "@playwright/test";

export function getTestCredentials(): { email: string; password: string } {
  const email = process.env.PLAYWRIGHT_TEST_EMAIL?.trim();
  const password = process.env.PLAYWRIGHT_TEST_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "PLAYWRIGHT_TEST_EMAIL et PLAYWRIGHT_TEST_PASSWORD sont requis.",
    );
  }

  return { email, password };
}

export function hasTestCredentials(): boolean {
  return Boolean(
    process.env.PLAYWRIGHT_TEST_EMAIL?.trim() &&
      process.env.PLAYWRIGHT_TEST_PASSWORD,
  );
}

export async function loginWithTestAccount(page: Page): Promise<void> {
  const { email, password } = getTestCredentials();

  await page.goto("/login");
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: /se connecter/i }).click();

  await page.waitForURL(/\/(home|onboarding|discovery|tasks|planning)/, {
    timeout: 30_000,
  });

  await expect(page).not.toHaveURL(/\/login$/);
}

export async function logoutFromApp(
  page: Page,
  options?: { markLogout?: () => void },
): Promise<void> {
  await page.getByRole("button", { name: "Menu utilisateur" }).click();
  options?.markLogout?.();
  await page.getByRole("menuitem", { name: /se déconnecter/i }).click();
  await expect(page).toHaveURL(/\/login$/, { timeout: 15_000 });
}
