import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  buildDayLoadKey,
  buildMonthLoadKey,
  mergeCalendarItemsById,
  shouldApplyRequest,
} from "./calendarViewStability";
import { resolveSelectedDate } from "../navigation/urlDate";
import type { CalendarItemRecord } from "../../types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "../..");

function readSrc(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

function makeItem(id: string, title: string): CalendarItemRecord {
  return {
    id,
    household_id: "h1",
    user_id: "u1",
    task_id: null,
    title,
    item_type: "event",
    starts_at: "2026-08-12T10:00:00.000Z",
    ends_at: "2026-08-12T11:00:00.000Z",
    locked: true,
    source: "user",
    details: { constraintType: "appointment" },
    created_at: "2026-08-01T00:00:00.000Z",
    updated_at: "2026-08-01T00:00:00.000Z",
  };
}

describe("Sprint 2.7 — calendar view stability", () => {
  it("A. CalendarPage n’utilise plus la chaîne reloadMonthOverview / reloadDateData", () => {
    const calendarPage = readSrc("pages/CalendarPage.tsx");
    const hookSource = readSrc("hooks/useCalendarViewData.ts");

    expect(calendarPage).not.toContain("reloadMonthOverview");
    expect(calendarPage).not.toContain("reloadDateData");
    expect(calendarPage).not.toContain("reloadPeriods");
    expect(hookSource).not.toMatch(/useEffect\([\s\S]*?\[.*periods[^R]/);
    expect(hookSource).toContain("periodsRef");
    expect(hookSource).toContain("periodsRevision");
  });

  it("B. changement de date produit une clé de chargement distincte", () => {
    const first = buildDayLoadKey("u1", "h1", "2026-07-12");
    const second = buildDayLoadKey("u1", "h1", "2026-07-13");
    expect(first).not.toBe(second);
  });

  it("C. changement de mois produit une clé de chargement distincte", () => {
    const july = buildMonthLoadKey("u1", "h1", 2026, 6, 0);
    const august = buildMonthLoadKey("u1", "h1", 2026, 7, 0);
    expect(july).not.toBe(august);
  });

  it("D. même date conserve la même clé de chargement", () => {
    const a = buildDayLoadKey("u1", "h1", "2026-07-12");
    const b = buildDayLoadKey("u1", "h1", "2026-07-12");
    expect(a).toBe(b);
  });

  it("E. upsert garde le rendez-vous visible sans doublon", () => {
    const existing = [makeItem("a1", "Ancien")];
    const incoming = [makeItem("a1", "Mis à jour"), makeItem("a2", "Nouveau")];
    const merged = mergeCalendarItemsById(existing, incoming);

    expect(merged).toHaveLength(2);
    expect(merged.find((item) => item.id === "a1")?.title).toBe("Mis à jour");
    expect(merged.find((item) => item.id === "a2")?.title).toBe("Nouveau");
  });

  it("F. réponse ancienne ignorée via requestId", () => {
    expect(shouldApplyRequest(1, 2)).toBe(false);
    expect(shouldApplyRequest(2, 2)).toBe(true);
  });

  it("G. merge conserve les éléments précédents pendant refresh", () => {
    const existing = [makeItem("keep", "Conserver")];
    const merged = mergeCalendarItemsById(existing, []);
    expect(merged).toHaveLength(1);
  });

  it("H. sections calendrier utilisent skeleton uniquement au bootstrap", () => {
    const sections = readSrc("pages/calendar/CalendarSections.tsx");
    expect(sections).toContain("calendar-stable-section");
    expect(sections).toContain("showSkeleton = isBootstrapping && isEmpty");
    expect(sections).toContain("calendar-refresh-badge");
  });

  it("I. erreurs indépendantes — merge ne vide pas l’état existant", () => {
    const merged = mergeCalendarItemsById(
      [makeItem("x1", "Un")],
      [makeItem("x1", "Un bis")],
    );
    expect(merged).toHaveLength(1);
    expect(merged[0].title).toBe("Un bis");
  });

  it("J. bouton menu positionné à gauche dans AppShell", () => {
    const shell = readSrc("components/navigation/AppShell.tsx");
    const css = readFileSync(join(root, "styles/sprint40.css"), "utf8");

    expect(shell).toContain("app-header-menu-btn");
    expect(shell.indexOf("app-header-menu-btn")).toBeLessThan(
      shell.indexOf("app-header-title"),
    );
    expect(css).toContain(".app-header-menu-btn");
  });

  it("K. drawer ouvert depuis la gauche", () => {
    const css = readFileSync(join(root, "index.css"), "utf8");

    expect(css).toMatch(/\.app-drawer-panel[\s\S]*left:\s*0/);
    expect(css).not.toMatch(/\.app-drawer-panel[\s\S]*right:\s*0/);
    expect(css).toMatch(/translateX\(-100%\)/);
    expect(css).toMatch(/border-radius:\s*0\s+16px\s+16px\s+0/);
  });

  it("L. F5 conserve la date depuis l’URL", () => {
    expect(resolveSelectedDate("2026-08-15")).toBe("2026-08-15");
    expect(resolveSelectedDate("2026-08-15", "2026-07-01")).toBe("2026-08-15");
    expect(resolveSelectedDate(null, "2026-07-01")).toBe("2026-07-01");
  });

  it("M. useUrlDate évite la réécriture URL si la date est identique", () => {
    const hook = readSrc("hooks/useUrlDate.ts");
    expect(hook).toContain("if (date === selectedDate) return");
  });
});
