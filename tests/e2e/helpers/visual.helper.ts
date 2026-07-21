import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";

import { expect, type Locator, type Page } from "@playwright/test";

import { dismissDailyBriefIfVisible } from "./auth.helper";

const BASELINE_DIR = path.join("tests", "e2e", "screenshots", "baselines");

const STABLE_BASELINES = new Set([
  "login",
  "home",
  "planning",
  "goals",
  "household-overview",
]);

export type VisualRegressionOptions = {
  maxDiffPixelRatio?: number;
  scope?: string;
  dismissDailyBrief?: boolean;
  viewport?: { width: number; height: number };
};

export function isVisualRegressionEnabled(): boolean {
  return (
    process.env.GUARDIAN_VISUAL === "1" ||
    process.env.GUARDIAN_VISUAL === "true" ||
    STABLE_BASELINES.size > 0
  );
}

export function getVisualBaselinePath(name: string): string {
  return path.join(BASELINE_DIR, `${name}.png`);
}

async function stabilizePageForSnapshot(
  page: Page,
  viewport?: { width: number; height: number },
  snapshotName?: string,
): Promise<void> {
  if (viewport) {
    await page.setViewportSize(viewport);
  }
  await page.waitForLoadState("networkidle");
  await page.evaluate((name) => {
    const selectors = [
      "time",
      "[datetime]",
      ".daily-brief-date",
      ".planning-date-label",
      ".household-overview-card time",
      ".day-navigation-bar",
      ".app-header-notifications",
    ];

    for (const selector of selectors) {
      for (const element of document.querySelectorAll(selector)) {
        if (element instanceof HTMLElement) {
          element.style.visibility = "hidden";
        }
      }
    }

    for (const element of document.querySelectorAll("[data-testid='household-page-title']")) {
      element.textContent = "Foyer";
    }

    if (name === "home") {
      for (const element of document.querySelectorAll(".aura-h2")) {
        element.textContent = "Bonjour Test";
      }
      for (const element of document.querySelectorAll(".home-premium-hero-meta .ui-badge, .home-premium-hero-meta .badge")) {
        element.textContent = "Meta";
      }
      for (const element of document.querySelectorAll(".home-premium-panel")) {
        if (element instanceof HTMLElement) {
          element.style.visibility = "hidden";
        }
      }
    }

    if (name === "household-overview") {
      for (const element of document.querySelectorAll(
        ".household-workload-metrics dd, .household-workload-header span",
      )) {
        element.textContent = "—";
      }

      for (const element of document.querySelectorAll(
        ".household-workload-header strong, .household-goals-member strong",
      )) {
        element.textContent = "Membre";
      }

      for (const element of document.querySelectorAll(".household-goals-member li li")) {
        element.textContent = "Objectif actif";
      }

      for (const element of document.querySelectorAll(".household-overview-badges li")) {
        element.textContent = "Indicateur";
      }

      for (const element of document.querySelectorAll(".household-planning-notes li")) {
        element.textContent = "Note planning";
      }
    }
  }, snapshotName ?? "");

  await page.waitForTimeout(300);
}

function resolveVisualTarget(page: Page, scope?: string): Page | Locator {
  if (!scope) return page;
  return page.locator(scope).first();
}

function buildVisualMasks(page: Page, name: string) {
  const masks = [
    page.locator("time"),
    page.locator("[datetime]"),
    page.locator(".conversation-panel"),
    page.locator(".day-navigation-bar"),
    page.locator(".app-header-notifications"),
    page.locator("[data-testid='household-opportunities-section']"),
    page.locator(".daily-brief-card"),
    page.locator(".motivation-card"),
  ];

  if (name === "home") {
    masks.push(
      page.locator(".home-widgets-stack"),
      page.locator(".daily-brief-section"),
      page.locator(".daily-brief-modal-backdrop"),
      page.locator(".proactive-coach-banner"),
      page.locator(".daily-mission-banner"),
      page.locator(".home-premium-panel"),
    );
  }

  if (name === "household-overview") {
    masks.push(
      page.locator("[data-testid='household-opportunities-section']"),
      page.locator(".household-opportunities-cards"),
      page.locator(".household-availability-list"),
    );
  }

  return masks;
}

/**
 * Visual regression for stable Guardian pages.
 * Captures baseline on first run; compares when baseline exists.
 */
export async function assertVisualRegression(
  page: Page,
  name: string,
  options?: VisualRegressionOptions,
): Promise<void> {
  if (!STABLE_BASELINES.has(name)) return;

  mkdirSync(BASELINE_DIR, { recursive: true });

  if (options?.dismissDailyBrief) {
    await dismissDailyBriefIfVisible(page);
  }

  await stabilizePageForSnapshot(page, options?.viewport, name);

  const target =
    name === "household-overview"
      ? page.locator(".household-overview-layout").first()
      : resolveVisualTarget(page, options?.scope);
  const baselinePath = getVisualBaselinePath(name);
  const screenshotName = `${name}.png`;

  if (!existsSync(baselinePath)) {
    if (options?.scope) {
      await (target as Locator).screenshot({ path: baselinePath });
    } else {
      await page.screenshot({ path: baselinePath, fullPage: true });
    }
    return;
  }

  if (!isVisualRegressionEnabled()) return;

  const screenshotOptions = {
    maxDiffPixelRatio: options?.maxDiffPixelRatio ?? 0.04,
    mask: buildVisualMasks(page, name),
    animations: "disabled" as const,
    ...(options?.scope || name === "household-overview" ? {} : { fullPage: true }),
  };

  await dismissDailyBriefIfVisible(page);
  await expect(target).toHaveScreenshot(screenshotName, screenshotOptions);
}
