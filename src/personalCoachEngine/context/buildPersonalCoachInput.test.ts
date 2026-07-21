/** @vitest-environment happy-dom */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { saveDailyState } from "../../dailyStateEngine";
import { createUserGoal } from "../../services/goalsService";
import { buildPersonalCoachInputFromUser } from "./buildPersonalCoachInput";

vi.mock("../../services/tasksService", () => ({
  getUserTasks: vi.fn().mockResolvedValue([
    { id: "t1", status: "todo", title: "Courses" },
    { id: "t2", status: "done", title: "Done task" },
  ]),
}));

describe("buildPersonalCoachInputFromUser", () => {
  const userId = "user-coach-input";
  const date = "2026-07-21";
  const now = "2026-07-21T08:00:00.000Z";

  beforeEach(() => {
    saveDailyState(userId, {
      date,
      mood: "good",
      energy: 8,
      stress: 3,
      sleepQuality: 7,
      specialDay: "normal",
      confidence: 0.9,
      source: "checkin",
      createdAt: now,
      updatedAt: now,
    });
    createUserGoal(userId, {
      name: "Courir 3x/semaine",
      category: "sport",
      importance: 3,
    });
  });

  it("builds coach input from real daily state, goals and tasks — no fixtures", async () => {
    const input = await buildPersonalCoachInputFromUser(userId, date, {
      firstName: "Léa",
      childrenCount: 2,
    });

    expect(input.dailyEnergy).toBe(8);
    expect(input.dailyStress).toBe(3);
    expect(input.mentalLoad).toBe(30);
    expect(input.activeGoals[0]?.name).toBe("Courir 3x/semaine");
    expect(input.taskTodoCount).toBe(1);
    expect(input.firstName).toBe("Léa");
    expect(input.childrenCount).toBe(2);
    expect(input.activeGoals.some((goal) => goal.name === "Objectif perso")).toBe(false);
  });
});
