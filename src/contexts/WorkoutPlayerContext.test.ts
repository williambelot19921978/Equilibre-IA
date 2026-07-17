/** @vitest-environment happy-dom */
import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";

import { WorkoutPlayerProvider, useWorkoutPlayer } from "./WorkoutPlayerContext";
import { generateWorkoutSession } from "../ai/workoutGenerationEngine";
import type { DayTimelineEntry } from "../lib/planning/displayedDayTimeline";
import {
  clearPersistedWorkoutPlayer,
  savePersistedWorkoutPlayer,
} from "../lib/workout/workoutPlayerPersistence";

const authState: { user: { id: string } | null } = { user: { id: "user-1" } };

vi.mock("../hooks/useUrlDate", () => ({
  useUrlDate: () => ({
    selectedDate: "2026-07-20",
    setSelectedDate: vi.fn(),
  }),
}));

vi.mock("../hooks/useAuth", () => ({
  useAuth: () => authState,
}));

vi.mock("../services/dailyCheckinService", () => ({
  loadDailyCheckin: vi.fn().mockResolvedValue(null),
}));

vi.mock("../services/workoutSessionService", () => ({
  finishWorkoutSession: vi.fn(),
}));

function ClickStartButton({ entry, session }: { entry: DayTimelineEntry; session: ReturnType<typeof generateWorkoutSession> }) {
  const { handleStartWorkout } = useWorkoutPlayer();
  return createElement(
    "button",
    {
      type: "button",
      onClick: () => handleStartWorkout(entry, session),
    },
    "Faire la séance",
  );
}

describe("WorkoutPlayerProvider", () => {
  const session = generateWorkoutSession({
    durationMinutes: 10,
    level: "beginner",
    slotHour: 14,
  });

  const entry: DayTimelineEntry = {
    id: "sport-1",
    visualType: "sport",
    title: "Sport",
    startsAt: "2026-07-20T16:00:00.000Z",
    endsAt: "2026-07-20T16:30:00.000Z",
    locked: false,
    origin: "persisted",
    blockKind: "task",
    calendarItemId: "cal-1",
    activityType: "sport",
    workoutSession: session,
  };

  it("ouvre le player au clic avec Démarrer visible", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        createElement(
          WorkoutPlayerProvider,
          null,
          createElement(ClickStartButton, { entry, session }),
        ),
      );
    });

    const button = container.querySelector("button");
    expect(button).toBeTruthy();

    await act(async () => {
      button?.click();
    });

    expect(document.body.querySelector(".workout-player-overlay")).toBeTruthy();
    expect(document.body.textContent).toContain("Démarrer");

    root.unmount();
    container.remove();
  });

  it("restaure la séance persistée quand un autre utilisateur se connecte sans rechargement", async () => {
    clearPersistedWorkoutPlayer();
    authState.user = { id: "user-1" };

    const userTwoSession = generateWorkoutSession({
      durationMinutes: 12,
      level: "beginner",
      slotHour: 9,
      generationSeed: "user-2-session",
    });

    const userTwoEntry: DayTimelineEntry = {
      ...entry,
      id: "sport-user-2",
      title: "Séance utilisateur 2",
      workoutSession: userTwoSession,
    };

    savePersistedWorkoutPlayer({
      userId: "user-2",
      selectedDate: "2026-07-20",
      entry: userTwoEntry,
      session: userTwoSession,
      startedAt: "2026-07-20T08:00:00.000Z",
      isOpen: true,
    });

    function PlayerProbe() {
      const { isWorkoutPlayerOpen, activeWorkoutSession } = useWorkoutPlayer();
      return createElement("div", {
        "data-testid": "player-probe",
        "data-open": String(isWorkoutPlayerOpen),
        "data-session-id": activeWorkoutSession?.id ?? "",
      });
    }

    function TestApp({ userId }: { userId: string }) {
      authState.user = { id: userId };
      return createElement(
        WorkoutPlayerProvider,
        null,
        createElement(PlayerProbe),
      );
    }

    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(createElement(TestApp, { userId: "user-1" }));
    });

    let probe = container.querySelector('[data-testid="player-probe"]');
    expect(probe?.getAttribute("data-open")).toBe("false");

    await act(async () => {
      root.render(createElement(TestApp, { userId: "user-2" }));
    });

    probe = container.querySelector('[data-testid="player-probe"]');
    expect(probe?.getAttribute("data-open")).toBe("true");
    expect(probe?.getAttribute("data-session-id")).toBe(userTwoSession.id);
    expect(document.body.querySelector(".workout-player-overlay")).toBeTruthy();

    clearPersistedWorkoutPlayer();
    root.unmount();
    container.remove();
    authState.user = { id: "user-1" };
  });

  it("efface les modales et bannières du précédent utilisateur lors d'un changement de compte", async () => {
    clearPersistedWorkoutPlayer();
    authState.user = { id: "user-1" };

    const entryWithoutSession: DayTimelineEntry = {
      id: "sport-no-session",
      visualType: "sport",
      title: "Sport utilisateur 1",
      startsAt: "2026-07-20T16:00:00.000Z",
      endsAt: "2026-07-20T16:30:00.000Z",
      locked: false,
      origin: "persisted",
      blockKind: "task",
      calendarItemId: "cal-no-session",
      activityType: "sport",
    };

    function TriggerMissingUi({ targetEntry }: { targetEntry: DayTimelineEntry }) {
      const { handleStartWorkout } = useWorkoutPlayer();
      return createElement(
        "button",
        {
          type: "button",
          onClick: () => handleStartWorkout(targetEntry),
        },
        "Ouvrir séance manquante",
      );
    }

    function TestApp({ userId }: { userId: string }) {
      authState.user = { id: userId };
      return createElement(
        WorkoutPlayerProvider,
        null,
        createElement(TriggerMissingUi, { targetEntry: entryWithoutSession }),
      );
    }

    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(createElement(TestApp, { userId: "user-1" }));
    });

    await act(async () => {
      container.querySelector("button")?.click();
    });

    expect(document.body.querySelector(".sport-session-missing-sheet")).toBeTruthy();
    expect(document.body.querySelector(".workout-feedback-banner")).toBeTruthy();

    await act(async () => {
      root.render(createElement(TestApp, { userId: "user-2" }));
    });

    expect(document.body.querySelector(".sport-session-missing-sheet")).toBeFalsy();
    expect(document.body.querySelector(".workout-feedback-banner")).toBeFalsy();

    root.unmount();
    container.remove();
    authState.user = { id: "user-1" };
  });
});
