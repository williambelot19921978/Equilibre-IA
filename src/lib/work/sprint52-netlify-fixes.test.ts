/** @vitest-environment happy-dom */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { resolveBlockCompletionAvailability } from "../planning/resolveBlockCompletionAvailability";
import {
  resolveUserProgressLoading,
  shouldShowProtectedRouteLoading,
} from "../navigation/protectedRouteLoading";
import {
  clearPersistedWorkoutPlayer,
  loadPersistedWorkoutPlayer,
  savePersistedWorkoutPlayer,
} from "../workout/workoutPlayerPersistence";
import type { DayTimelineEntry } from "../planning/displayedDayTimeline";
import { generateWorkoutSession } from "../../ai/workoutGenerationEngine";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "../..");

function readSrc(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

const today = "2026-07-20";

function sportEntry(
  startsAt: string,
  endsAt: string,
  id = "sport-evening",
): DayTimelineEntry {
  return {
    id,
    visualType: "sport",
    title: "Sport du soir",
    startsAt,
    endsAt,
    locked: true,
    origin: "persisted",
    blockKind: "task",
    calendarItemId: id,
    activityType: "sport",
    completed: false,
  };
}

describe("Sprint 5.2 — correctifs Netlify", () => {
  describe("BUG 1 — complétion séance avant horaire prévu", () => {
    it("1. séance prévue à 20h, lancée et terminée le matin => succès", () => {
      const entry = sportEntry(
        `${today}T18:00:00.000Z`,
        `${today}T18:30:00.000Z`,
      );
      const guard = resolveBlockCompletionAvailability({
        entry,
        currentLocalDate: today,
        actualCompletedAt: `${today}T06:30:00.000Z`,
        allowEarlyCompletion: true,
        workoutInProgress: true,
      });
      expect(guard.allowed).toBe(true);
    });

    it("2. séance non commencée dans le futur horaire => bloquée sans confirmation", () => {
      const entry = sportEntry(
        `${today}T18:00:00.000Z`,
        `${today}T18:30:00.000Z`,
      );
      const guard = resolveBlockCompletionAvailability({
        entry,
        currentLocalDate: today,
        actualCompletedAt: `${today}T08:00:00.000Z`,
        allowEarlyCompletion: false,
        workoutInProgress: false,
      });
      expect(guard.allowed).toBe(false);
      expect(guard.message).toMatch(/pas encore commencé/i);
    });

    it("3. séance en cours => workoutInProgress contourne la validation horaire", () => {
      const entry = sportEntry(
        `${today}T18:00:00.000Z`,
        `${today}T18:30:00.000Z`,
      );
      const guard = resolveBlockCompletionAvailability({
        entry,
        currentLocalDate: today,
        actualCompletedAt: `${today}T07:00:00.000Z`,
        allowEarlyCompletion: false,
        workoutInProgress: true,
      });
      expect(guard.allowed).toBe(true);
    });

    it("4. finishWorkoutSession force allowEarlyCompletion et workoutInProgress", () => {
      const service = readSrc("services/workoutSessionService.ts");
      expect(service).toContain("allowEarlyCompletion: true");
      expect(service).toContain("workoutInProgress: true");
      expect(service).toContain("actualStartedAt");
    });
  });

  describe("BUG 2 — retour d'onglet et persistance séance", () => {
    it("1. resolveUserProgressLoading ne bloque pas après chargement initial", () => {
      expect(
        resolveUserProgressLoading({
          authLoading: false,
          userId: "user-1",
          loadedUserId: "user-1",
        }),
      ).toBe(false);
    });

    it("2. auth loading => pas de redirect prématuré (loading actif)", () => {
      expect(
        shouldShowProtectedRouteLoading({
          authLoading: true,
          userId: "user-1",
          progressLoadedForUserId: null,
        }),
      ).toBe(true);
    });

    it("3. session valide => pas de loading route après progress chargé", () => {
      expect(
        shouldShowProtectedRouteLoading({
          authLoading: false,
          userId: "user-1",
          progressLoadedForUserId: "user-1",
        }),
      ).toBe(false);
    });

    it("4. session expirée => loading false sans user (redirect login)", () => {
      expect(
        shouldShowProtectedRouteLoading({
          authLoading: false,
          userId: undefined,
          progressLoadedForUserId: null,
        }),
      ).toBe(false);
    });

    it("5. persistance workout player — save, restore, clear", () => {
      const session = generateWorkoutSession({
        durationMinutes: 20,
        level: "beginner",
        slotHour: 8,
      });
      const entry = sportEntry(
        `${today}T18:00:00.000Z`,
        `${today}T18:30:00.000Z`,
      );

      savePersistedWorkoutPlayer({
        userId: "user-1",
        selectedDate: today,
        entry,
        session,
        startedAt: `${today}T08:00:00.000Z`,
        isOpen: true,
      });

      const restored = loadPersistedWorkoutPlayer("user-1");
      expect(restored?.entry.id).toBe(entry.id);
      expect(restored?.session.id).toBe(session.id);
      expect(restored?.startedAt).toBe(`${today}T08:00:00.000Z`);

      clearPersistedWorkoutPlayer();
      expect(loadPersistedWorkoutPlayer("user-1")).toBeNull();
    });

    it("6. WorkoutPlayerProvider monté au niveau AppProviders", () => {
      const providers = readSrc("app/providers/AppProviders.tsx");
      expect(providers).toContain("WorkoutPlayerProvider");
      const layout = readSrc("app/layouts/AuthenticatedAppLayout.tsx");
      expect(layout).not.toContain("WorkoutPlayerProvider");
    });

    it("7. UserProgressProvider ne recharge pas si même user.id", () => {
      const provider = readSrc("contexts/UserProgressProvider.tsx");
      expect(provider).toContain("loadedUserId === user.id");
      expect(provider).not.toContain("fetchingProgress");
    });
  });

  describe("BUG 3 — sidebar fiable", () => {
    it("1. source de vérité unique via SidebarPreferencesProvider", () => {
      const providers = readSrc("app/providers/AppProviders.tsx");
      expect(providers).toContain("SidebarPreferencesProvider");
      expect(readSrc("hooks/useSidebarPreferences.ts")).toContain(
        "SidebarPreferencesProvider",
      );
    });

    it("2. toggle optimiste sans disabled sur le bouton Replier", () => {
      const sidebar = readSrc("components/navigation/AppSidebar.tsx");
      expect(sidebar).toContain('type="button"');
      expect(sidebar).not.toContain("disabled={toggling}");
      const provider = readSrc("contexts/SidebarPreferencesProvider.tsx");
      expect(provider).toContain("sidebarCollapsed: nextCollapsed");
    });

    it("3. drawer overlay inactif quand fermé", () => {
      const css = readSrc("styles/sprint40.css");
      expect(css).toContain(".app-drawer-overlay");
      expect(css).toContain("pointer-events: none");
      const drawer = readSrc("components/navigation/AppDrawer.tsx");
      expect(drawer).toContain("hidden={!open}");
    });
  });

  describe("BUG 4 — déconnexion accessible", () => {
    it("1. entrée Se déconnecter dans le menu utilisateur", () => {
      const menu = readSrc("components/navigation/UserMenu.tsx");
      expect(menu).toContain("Se déconnecter");
      expect(menu).toContain("signOut");
    });

    it("2. AppShell utilise UserMenu au lieu de navigation directe profil", () => {
      const shell = readSrc("components/navigation/AppShell.tsx");
      expect(shell).toContain("UserMenu");
      expect(shell).not.toContain("goToRoute(AppRoutes.USER_PROFILE)");
    });

    it("3. page Profil conserve le bouton Se déconnecter", () => {
      const profile = readSrc("pages/ProfilePage.tsx");
      expect(profile).toContain("Se déconnecter");
      expect(profile).toContain("signOut");
    });

    it("4. drawer mobile conserve aussi Se déconnecter", () => {
      const drawer = readSrc("components/navigation/AppDrawer.tsx");
      expect(drawer).toContain("Se déconnecter");
    });

    it("5. déconnexion nettoie l'état workout local", () => {
      const menu = readSrc("components/navigation/UserMenu.tsx");
      expect(menu).toContain("clearPersistedWorkoutPlayer");
    });
  });
});

describe("Sprint 5.2 — workoutPlayerPersistence isolation utilisateur", () => {
  it("ignore la persistance d'un autre utilisateur", () => {
    const session = generateWorkoutSession({
      durationMinutes: 15,
      level: "beginner",
      slotHour: 10,
    });
    savePersistedWorkoutPlayer({
      userId: "user-a",
      selectedDate: today,
      entry: sportEntry(`${today}T18:00:00.000Z`, `${today}T18:30:00.000Z`),
      session,
      startedAt: `${today}T08:00:00.000Z`,
      isOpen: true,
    });

    expect(loadPersistedWorkoutPlayer("user-b")).toBeNull();
    clearPersistedWorkoutPlayer();
  });
});
