import { expect, type Page } from "@playwright/test";

import {
  buildGuardianEmail,
  getStablePrimaryCredentials,
  hasStablePrimaryCredentials,
  type GuardianPersona,
} from "../fixtures/users";
import { assertCriticalPrecondition } from "./skip-policy";

export { hasStablePrimaryCredentials, getStablePrimaryCredentials };

export async function signupGuardianUser(
  page: Page,
  persona: GuardianPersona,
  email?: string,
): Promise<
  | { email: string; password: string; outcome: "redirect" | "email_confirmation" }
  | { outcome: "rate_limited" }
> {
  const resolvedEmail = email ?? buildGuardianEmail(persona);

  await page.goto("/signup");
  await expect(
    page.getByRole("heading", { name: /créer mon compte/i }),
  ).toBeVisible();

  await page.locator("#signup-first-name").fill(persona.firstName);
  await page.locator('input[type="email"]').fill(resolvedEmail);
  await page.locator('input[type="password"]').first().fill(persona.password);
  await page.locator('input[type="password"]').nth(1).fill(persona.password);
  await page.getByRole("button", { name: /créer mon compte/i }).click();

  const rateLimitMessage = page.getByText(/rate limit|trop de tentatives/i);
  if (await rateLimitMessage.isVisible({ timeout: 5_000 }).catch(() => false)) {
    return { outcome: "rate_limited" };
  }

  const successMessage = page.getByText(/compte a été créé|consulte tes e-mails/i);
  const redirected = await page
    .waitForURL(/\/(home|onboarding|discovery|login|household|profile)/, {
      timeout: 15_000,
    })
    .then(() => true)
    .catch(() => false);

  if (redirected) {
    return {
      email: resolvedEmail,
      password: persona.password,
      outcome: "redirect",
    };
  }

  if (await successMessage.isVisible({ timeout: 3_000 }).catch(() => false)) {
    return {
      email: resolvedEmail,
      password: persona.password,
      outcome: "email_confirmation",
    };
  }

  const errorMessage = await page.locator(".message-error").textContent().catch(() => null);
  if (errorMessage?.match(/rate limit|trop de tentatives/i)) {
    return { outcome: "rate_limited" };
  }

  throw new Error(
    errorMessage?.trim() ||
      "Inscription sans redirection ni message de confirmation.",
  );
}

export async function loginGuardianUser(
  page: Page,
  credentials: { email: string; password: string },
): Promise<void> {
  await page.goto("/login");
  await page.locator('input[type="email"]').fill(credentials.email);
  await page.locator('input[type="password"]').fill(credentials.password);
  await page.getByRole("button", { name: /se connecter/i }).click();

  await page.waitForURL(
    /\/(home|daily-check-in|onboarding|discovery|tasks|planning|household)/,
    {
      timeout: 30_000,
    },
  );

  await expect(page).not.toHaveURL(/\/login$/);

  const skip = page.getByTestId("daily-checkin-skip");
  if (await skip.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await skip.click();
    await expect(page).toHaveURL(/\/home/, { timeout: 15_000 });
  }
}

export async function loginStablePrimaryUser(page: Page): Promise<void> {
  const credentials = getStablePrimaryCredentials();
  assertCriticalPrecondition(
    Boolean(credentials?.email && credentials.password),
    "PLAYWRIGHT_TEST_EMAIL et PLAYWRIGHT_TEST_PASSWORD requis pour ce scénario.",
  );

  await loginGuardianUser(page, credentials!);
}

export async function logoutGuardianUser(
  page: Page,
  options?: { markLogout?: () => void },
): Promise<void> {
  await page.getByRole("button", { name: "Menu utilisateur" }).click();
  options?.markLogout?.();
  await page.getByRole("menuitem", { name: /se déconnecter/i }).click();
  await expect(page).toHaveURL(/\/login$/, { timeout: 15_000 });
}

export async function clearDailyBriefPresentation(page: Page): Promise<void> {
  await page.evaluate(() => {
    const keys: string[] = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key?.startsWith("daily-brief-presented:")) {
        keys.push(key);
      }
    }
    for (const key of keys) localStorage.removeItem(key);
  });
}

export async function dismissDailyBriefIfVisible(page: Page): Promise<void> {
  const backdrop = page.locator(".daily-brief-modal-backdrop");

  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (!(await backdrop.isVisible({ timeout: 1_500 }).catch(() => false))) {
      return;
    }

    const compris = backdrop.getByRole("button", { name: /^Compris$/i });
    const fermer = backdrop.getByRole("button", { name: /^Fermer$/i });

    if (await compris.isVisible().catch(() => false)) {
      await compris.click();
    } else if (await fermer.isVisible().catch(() => false)) {
      await fermer.click();
    } else {
      return;
    }

    await backdrop.waitFor({ state: "hidden", timeout: 10_000 }).catch(() => undefined);
  }
}
