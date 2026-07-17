import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { resolveFamilyContextForDate } from "../../ai/familyContextEngine";
import { buildLeisureProposals } from "../../ai/leisureSuggestionEngine";
import { resolveChildcareImpact } from "../family/childcareImpact";
import { DEFAULT_HOME_PREFERENCES } from "../../types/homePreferences";
import type { FamilyContextPeriodRecord } from "../../types/familyContext";
import type { PlanningContext } from "../../ai/memoryEngine";

const root = join(process.cwd(), "src");
const date = "2026-07-20";

function readSrc(fragment: string): string {
  return readFileSync(join(root, fragment), "utf8");
}

function vacationPeriod(mode: string): FamilyContextPeriodRecord {
  return {
    id: "period-1",
    household_id: "household-1",
    user_id: null,
    context_type: "children_vacation",
    title: "Vacances enfants",
    starts_at: `${date}T00:00:00.000Z`,
    ends_at: `${date}T23:59:59.000Z`,
    affected_member_id: null,
    impact: { childcareMode: mode },
    description: null,
    status: "active",
    created_by: "user-1",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

const basePlanningContext: PlanningContext = {
  householdId: "household-1",
  currentUserId: "user-1",
  children: [],
  childrenCount: 1,
  wakeTime: "07:00",
  bedTime: "23:00",
  workStart: "09:00",
  workEnd: "17:00",
  mainPriority: "rest",
  onboardingCompleted: true,
  profile: {
    morningDurationMinutes: 45,
    childrenDepartureTime: "08:00",
    eveningRoutine: [],
    workDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    commuteMinutes: 20,
    afterWorkEnergy: "medium",
    studiesActive: false,
    preferredFocusMinutes: 25,
    procrastinationCauses: [],
    sleepProblems: [],
    sportInterests: [],
    sportMusic: [],
    restPreferences: [],
    faithImportance: "disabled",
    sportMinimumMinutes: 15,
  },
  familyContext: {
    activePeriods: [],
    disableWork: false,
    disableSchoolDeparture: false,
    maxFillRatio: 0.8,
    soloParentWithChildren: false,
    childSick: false,
    onlyMicroTasks: false,
    childrenVacation: false,
    userVacation: false,
    unavailableUserIds: [],
    adaptations: [],
    warnings: [],
  },
};

describe("Sprint 4.5 — calendrier drawer", () => {
  it("A. calendrier absent du header accueil", () => {
    const home = readSrc("pages/HomePage.tsx");
    expect(home).not.toContain("HeaderCalendarWidget");
    expect(home).not.toContain("header_right");
  });

  it("B. calendrier intégré au drawer", () => {
    expect(DEFAULT_HOME_PREFERENCES.calendarWidgetPosition).toBe("drawer");
    expect(DEFAULT_HOME_PREFERENCES.calendarWidgetPositionMobile).toBe("drawer");
    const drawer = readSrc("components/navigation/DrawerCalendarSection.tsx");
    expect(drawer).toContain('variant="drawer"');
    expect(readSrc("components/navigation/AppDrawer.tsx")).toContain("DrawerCalendarSection");
  });

  it("C. navigation mois dans le drawer", () => {
    const calendar = readSrc("components/calendar/MonthCalendar.tsx");
    expect(calendar).toContain("month-calendar-drawer");
    expect(calendar).toContain("goToPreviousMonth");
  });
});

describe("Sprint 4.5 — garde enfants vacances", () => {
  it("D. maison avec moi — faible disponibilité", () => {
    const impact = resolveChildcareImpact("home_with_me");
    expect(impact.maxFillRatio).toBeLessThanOrEqual(0.4);
    expect(impact.onlyMicroTasks).toBe(true);
  });

  it("E. centre aéré — journée plus libre", () => {
    const impact = resolveChildcareImpact("summer_camp");
    expect(impact.maxFillRatio).toBeGreaterThanOrEqual(0.8);
  });

  it("F. grands-parents — quasi normale", () => {
    const impact = resolveChildcareImpact("grandparents");
    expect(impact.maxFillRatio).toBeGreaterThanOrEqual(0.75);
  });

  it("G. Life Engine adapte le contexte", () => {
    const resolved = resolveFamilyContextForDate({
      periods: [vacationPeriod("home_with_me")],
      date,
      currentUserId: "user-1",
    });
    expect(resolved.childrenVacation).toBe(true);
    expect(resolved.childcareMode).toBe("home_with_me");
    expect(resolved.maxFillRatio).toBeLessThanOrEqual(0.4);
    expect(resolved.adaptations.some((line) => line.includes("contrainte"))).toBe(true);
  });
});

describe("Sprint 4.5 — boutons timeline", () => {
  it("H. composant BlockActionButton visible", () => {
    const button = readSrc("components/planning/BlockActionButton.tsx");
    expect(button).toContain("block-action-button");
    const menu = readSrc("components/planning/BlockActionsMenu.tsx");
    expect(menu).toContain("BlockActionButton");
    expect(menu).not.toMatch(/<button[^>]*>Décaler<\/button>/);
  });
});

describe("Sprint 4.5 — espace Loisirs", () => {
  it("I. route et navigation principale", () => {
    const routes = readSrc("lib/navigation/routes.ts");
    expect(routes).toContain('LEISURE: "/leisure"');
    const nav = readSrc("lib/navigation/appNavigationItems.ts");
    expect(nav).toContain("Loisirs");
    expect(readSrc("app/router/AppRouter.tsx")).toContain("LeisureSpacePage");
  });

  it("J. bibliothèque sport et loisirs", () => {
    const library = readSrc("data/leisureContentLibrary.ts");
    expect(library).toContain("Mobilité");
    expect(library).toContain("Lecture");
    expect(library).toContain("MUSIC_PLAYLISTS");
  });

  it("K. Spotify — ouverture manuelle uniquement", () => {
    const page = readSrc("pages/LeisureSpacePage.tsx");
    expect(page).toContain("Ouvrir Spotify");
    expect(page).toContain("noopener,noreferrer");
    expect(page).not.toContain("autoplay");
  });
});

describe("Sprint 4.5 — suggestions loisirs", () => {
  it("L. propositions loisirs dans créneau libre", () => {
    const proposals = buildLeisureProposals({
      durationMinutes: 60,
      slotHour: 14,
      planningContext: basePlanningContext,
      slotId: "slot-1",
    });
    expect(proposals.length).toBeGreaterThan(0);
    expect(proposals.some((item) => item.leisureActivityId)).toBe(true);
  });

  it("M. keep_free conservé via slot suggestion engine", () => {
    const engine = readSrc("lib/planning/slotActivitySuggestionEngine.ts");
    expect(engine).toContain('category: "keep_free"');
    expect(engine).toContain("buildLeisureProposals");
  });
});

describe("Sprint 4.5 — migration", () => {
  it("N. leisure_favorites et defaults drawer", () => {
    const migration = readFileSync(
      join(process.cwd(), "supabase/migrations/00014_sprint45_leisure_childcare.sql"),
      "utf8",
    );
    expect(migration).toContain("leisure_favorites");
    expect(migration).toContain("calendar_widget_position");
    expect(migration).toContain("'drawer'");
  });
});
