import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { resolveDayCellVisual } from "../../design-system/dayCellVisual";
import {
  PRIMARY_NAV_ITEMS,
  resolveSpaceFromPath,
} from "../../design-system/spaceThemes";
import { AppRoutes } from "./routes";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "../..");

function readSrc(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("Sprint 4.0 — Design System & Shell Premium", () => {
  it("A. tokens CSS définissent les identités d'espace", () => {
    const tokens = readSrc("styles/tokens.css");
    expect(tokens).toContain("--space-home");
    expect(tokens).toContain("--space-planning");
    expect(tokens).toContain("--space-calendar");
    expect(tokens).toContain("--space-spiritual");
    expect(tokens).toContain("--space-profile");
    expect(tokens).toContain("--space-family");
  });

  it("B. index.css importe le design system Sprint 4.0", () => {
    const css = readSrc("index.css");
    expect(css).toContain("tokens.css");
    expect(css).toContain("sprint40.css");
  });

  it("C. AppShell — header fixe + sidebar + bottom nav", () => {
    const shell = readSrc("components/navigation/AppShell.tsx");
    expect(shell).toContain("app-header-fixed");
    expect(shell).toContain("AppSidebar");
    expect(shell).toContain("BottomNav");
    expect(shell).toContain("UserMenu");
    expect(readSrc("components/navigation/UserMenu.tsx")).toContain("app-header-avatar");
    expect(shell).toContain("NotificationBell");
    expect(shell).toContain("SyncStatusIndicator");
  });

  it("D. AppDrawer — menu avancé via appNavigationItems", () => {
    const drawer = readSrc("components/navigation/AppDrawer.tsx");
    expect(drawer).toContain("getDrawerSections");
    expect(drawer).not.toContain('label: "Aujourd');
    const nav = readSrc("lib/navigation/appNavigationItems.ts");
    expect(nav).toContain("Mon quotidien");
    expect(drawer).toContain("Se déconnecter");
  });

  it("E. navigation principale permanente — 8 entrées dont Statistiques et Mon IA", () => {
    expect(PRIMARY_NAV_ITEMS.length).toBe(8);
    expect(PRIMARY_NAV_ITEMS.map((item) => item.route)).toContain(AppRoutes.HOME);
    expect(PRIMARY_NAV_ITEMS.map((item) => item.route)).toContain(AppRoutes.PLANNING);
    expect(PRIMARY_NAV_ITEMS.map((item) => item.route)).toContain(AppRoutes.CALENDAR);
    expect(PRIMARY_NAV_ITEMS.map((item) => item.route)).toContain(AppRoutes.STATISTICS);
    expect(PRIMARY_NAV_ITEMS.map((item) => item.route)).toContain(AppRoutes.MY_AI);
    expect(PRIMARY_NAV_ITEMS.map((item) => item.route)).toContain(AppRoutes.LEISURE);
    expect(PRIMARY_NAV_ITEMS.map((item) => item.route)).toContain(AppRoutes.SPIRITUAL);
    expect(PRIMARY_NAV_ITEMS.map((item) => item.route)).toContain(AppRoutes.USER_PROFILE);
  });

  it("F. AuthenticatedAppLayout — identité visuelle par route", () => {
    const layout = readSrc("app/layouts/AuthenticatedAppLayout.tsx");
    expect(layout).toContain("data-space");
    expect(layout).toContain("resolveSpaceFromPath");
  });

  it("G. resolveSpaceFromPath — mapping espaces", () => {
    expect(resolveSpaceFromPath("/home")).toBe("home");
    expect(resolveSpaceFromPath("/planning")).toBe("planning");
    expect(resolveSpaceFromPath("/calendar")).toBe("calendar");
    expect(resolveSpaceFromPath("/spiritual")).toBe("spiritual");
    expect(resolveSpaceFromPath("/profile")).toBe("profile");
    expect(resolveSpaceFromPath("/family-context")).toBe("family");
  });

  it("H. MonthCalendar — cellules colorées visuellement", () => {
    const calendar = readSrc("components/calendar/MonthCalendar.tsx");
    expect(calendar).toContain("resolveDayCellVisual");
    expect(calendar).toContain("month-calendar-day-");
  });

  it("I. DayTimeline — blocs premium avec icône wrap", () => {
    const timeline = readSrc("components/planning/DayTimeline.tsx");
    expect(timeline).toContain("day-timeline-icon-wrap");
    expect(timeline).toContain("day-timeline-body");
  });

  it("J. composants UI design system", () => {
    expect(readSrc("components/ui/Card.tsx")).toContain("ds-card");
    expect(readSrc("components/ui/SectionHeader.tsx")).toContain("ds-section-header");
    expect(readSrc("components/ui/PageContainer.tsx")).toContain("ds-page-container");
    expect(readSrc("components/ui/Chip.tsx")).toContain("ds-chip");
  });

  it("K. HomePage — accueil épuré (Sprint 4.1)", () => {
    const home = readSrc("pages/HomePage.tsx");
    expect(home).toContain("home-page-clean");
    expect(home).toContain("home-widgets-stack");
    expect(home).toContain("HomeWidgetRenderer");
    expect(home).toContain("HomeCustomizationModal");
    expect(home).not.toContain("dashboard-hero");
  });

  it("L. ProfilePage — cartes premium", () => {
    const profile = readSrc("pages/ProfilePage.tsx");
    expect(profile).toContain("profile-hero");
    expect(profile).toContain("profile-premium-card");
    expect(profile).toContain("profile-cards-grid");
  });

  it("M. SpiritualSpacePage — ambiance calme", () => {
    const spiritual = readSrc("pages/SpiritualSpacePage.tsx");
    expect(spiritual).toContain("spiritual-space-illustration");
  });

  it("N. resolveDayCellVisual — vacances prioritaires", () => {
    const visual = resolveDayCellVisual("2026-07-15", {
      workDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      contextPeriods: [
        {
          id: "1",
          household_id: "h1",
          user_id: "u1",
          context_type: "user_vacation",
          title: "Vacances",
          starts_at: "2026-07-10T00:00:00.000Z",
          ends_at: "2026-07-20T23:59:59.999Z",
          affected_member_id: null,
          impact: {},
          description: null,
          status: "active",
          created_by: "u1",
          created_at: "2026-07-01T00:00:00.000Z",
          updated_at: "2026-07-01T00:00:00.000Z",
        },
      ],
    });
    expect(visual.type).toBe("vacation");
  });

  it("O. resolveDayCellVisual — week-end", () => {
    const visual = resolveDayCellVisual("2026-07-11", {
      workDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    });
    expect(visual.type).toBe("weekend");
  });

  it("O2. resolveDayCellVisual — lundi travaillé depuis profil", () => {
    const visual = resolveDayCellVisual("2026-07-13", {
      workDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    });
    expect(visual.type).toBe("work");
  });

  it("P. touch targets minimum 44px dans tokens", () => {
    const tokens = readSrc("styles/tokens.css");
    expect(tokens).toContain("--touch-target: 44px");
  });
});
