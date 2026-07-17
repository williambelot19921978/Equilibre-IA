import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { shouldShowConversationBar } from "./conversationAccess";
import {
  AppRoutes,
  APPLICATION_ROUTES,
  isApplicationRoute,
} from "./routes";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "../..");

function readSrc(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("Sprint 3.1.1 — shell global", () => {
  it("A. barre absente sur /login", () => {
    expect(
      shouldShowConversationBar({
        isAuthenticated: true,
        pathname: AppRoutes.LOGIN,
        progressLoading: false,
      }),
    ).toBe(false);
  });

  it("B. barre absente sur /onboarding/household", () => {
    expect(
      shouldShowConversationBar({
        isAuthenticated: true,
        pathname: AppRoutes.HOUSEHOLD,
        progressLoading: false,
      }),
    ).toBe(false);
  });

  it("C. barre visible sur /home", () => {
    expect(
      shouldShowConversationBar({
        isAuthenticated: true,
        pathname: AppRoutes.HOME,
        progressLoading: false,
      }),
    ).toBe(true);
  });

  it("D. barre visible sur /planning", () => {
    expect(
      shouldShowConversationBar({
        isAuthenticated: true,
        pathname: AppRoutes.PLANNING,
        progressLoading: false,
      }),
    ).toBe(true);
  });

  it("E. barre visible sur /calendar", () => {
    expect(
      shouldShowConversationBar({
        isAuthenticated: true,
        pathname: AppRoutes.CALENDAR,
        progressLoading: false,
      }),
    ).toBe(true);
  });

  it("F. barre visible sur /daily-routine", () => {
    expect(
      shouldShowConversationBar({
        isAuthenticated: true,
        pathname: AppRoutes.DAILY_ROUTINE,
        progressLoading: false,
      }),
    ).toBe(true);
  });

  it("G. barre visible sur /profile", () => {
    expect(
      shouldShowConversationBar({
        isAuthenticated: true,
        pathname: AppRoutes.USER_PROFILE,
        progressLoading: false,
      }),
    ).toBe(true);
  });

  it("H. barre visible sur /spiritual", () => {
    expect(
      shouldShowConversationBar({
        isAuthenticated: true,
        pathname: AppRoutes.SPIRITUAL,
        progressLoading: false,
      }),
    ).toBe(true);
  });

  it("I. routes applicatives reconnues", () => {
    for (const route of APPLICATION_ROUTES) {
      expect(isApplicationRoute(route)).toBe(true);
    }
  });

  it("J. AuthenticatedAppLayout — un seul AppShell", () => {
    const layout = readSrc("app/layouts/AuthenticatedAppLayout.tsx");
    expect(layout).toContain("AppShell");
    expect(layout).toContain("Outlet");
  });

  it("K. AuthenticatedAppLayout — un seul drawer via AppShell", () => {
    const shell = readSrc("components/navigation/AppShell.tsx");
    expect(shell).toContain("AppDrawer");
    expect(
      (readSrc("pages/HomePage.tsx").match(/AppShell/g) ?? []).length,
    ).toBe(0);
    expect(
      (readSrc("pages/DailyRoutinePage.tsx").match(/AppShell/g) ?? []).length,
    ).toBe(0);
  });

  it("L. un seul ConversationHeaderTrigger dans le layout", () => {
    const providers = readSrc("app/providers/AppProviders.tsx");
    const shell = readSrc("components/navigation/AppShell.tsx");
    expect(providers).not.toContain("ConversationHeaderTrigger");
    expect(shell).toContain("<ConversationHeaderTrigger />");
  });

  it("M. routes imbriquées sous AuthenticatedAppLayout", () => {
    const router = readSrc("app/router/AppRouter.tsx");
    expect(router).toContain("AuthenticatedAppLayout");
    expect(router).toContain(`path={AppRoutes.DAILY_ROUTINE}`);
    expect(router).toContain(`path={AppRoutes.HOME}`);
  });

  it("N. FloatingConversationBar ne retourne pas null silencieusement sur route app", () => {
    const bar = readSrc("components/conversation/FloatingConversationBar.tsx");
    expect(bar).toContain("Assistant indisponible");
    expect(bar).toContain('data-conversation-status');
    expect(bar).not.toMatch(/if \(!showBar\) \{\s*return null;\s*\}[\s\S]*return null;/);
  });

  it("O. route future sous layout hérite du shell", () => {
    expect(isApplicationRoute("/spiritual/extra")).toBe(true);
  });

  it("P. barre visible pendant progressLoading sur route app", () => {
    expect(
      shouldShowConversationBar({
        isAuthenticated: true,
        pathname: AppRoutes.HOME,
        progressLoading: true,
      }),
    ).toBe(true);
  });

  it("Q. utilisateur non connecté — pas de barre", () => {
    expect(
      shouldShowConversationBar({
        isAuthenticated: false,
        pathname: AppRoutes.HOME,
        progressLoading: false,
      }),
    ).toBe(false);
  });
});
