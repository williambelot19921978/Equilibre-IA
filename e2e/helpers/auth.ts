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

  await page.waitForURL(
    /\/(home|daily-check-in|onboarding|discovery|tasks|planning)/,
    {
      timeout: 30_000,
    },
  );

  await expect(page).not.toHaveURL(/\/login$/);

  // Persiste un skip du jour dans le storageState (évite la gate Accueil).
  const skip = page.getByTestId("daily-checkin-skip");
  if (await skip.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await skip.click();
    await expect(page).toHaveURL(/\/home/, { timeout: 15_000 });
  }

  // Désactive la préférence check-in pour les E2E (défaut = enabled).
  await page.evaluate(() => {
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key?.startsWith("sb-") || !key.includes("-auth-token")) continue;
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw) as {
          user?: { id?: string };
          currentSession?: { user?: { id?: string } };
        };
        const userId = parsed.user?.id ?? parsed.currentSession?.user?.id;
        if (userId) {
          localStorage.setItem(
            `daily-checkin-pref-${userId}`,
            JSON.stringify({ enabled: false }),
          );
        }
      } catch {
        // ignore malformed session payloads
      }
    }
  });
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
