/** @vitest-environment happy-dom */
import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";

import { WorkoutPlayerProvider, useWorkoutPlayer } from "./WorkoutPlayerContext";
import { generateWorkoutSession } from "../ai/workoutGenerationEngine";
import type { DayTimelineEntry } from "../lib/planning/displayedDayTimeline";

vi.mock("../hooks/useUrlDate", () => ({
  useUrlDate: () => ({
    selectedDate: "2026-07-20",
    setSelectedDate: vi.fn(),
  }),
}));

vi.mock("../hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "user-1" } }),
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
});
