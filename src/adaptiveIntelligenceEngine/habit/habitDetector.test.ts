import { describe, expect, it } from "vitest";

import { detectHabits } from "./habitDetector";
import {
  ABANDONED_HABIT_OBSERVATIONS,
  IRREGULAR_USER_OBSERVATIONS,
  NEW_HABIT_OBSERVATIONS,
  OLD_HABIT_OBSERVATIONS,
  REGULAR_USER_OBSERVATIONS,
} from "../testing/fixtures";

describe("HabitDetector", () => {
  it("détecte l'heure habituelle de sport pour un utilisateur régulier", () => {
    const habits = detectHabits(REGULAR_USER_OBSERVATIONS);
    const sport = habits.find((habit) => habit.kind === "sport");

    expect(sport).toBeDefined();
    expect(sport?.preferredTime).toBe("18:30");
    expect(sport?.frequency).toBeGreaterThanOrEqual(2);
    expect(sport?.score).toBeGreaterThan(0);
  });

  it("détecte l'heure de travail", () => {
    const habits = detectHabits(REGULAR_USER_OBSERVATIONS);
    const work = habits.find((habit) => habit.kind === "work");

    expect(work).toBeDefined();
    expect(work?.preferredTime).toBe("09:00");
  });

  it("utilisateur irrégulier — horaires dispersés, score inférieur au régulier", () => {
    const irregular = detectHabits(IRREGULAR_USER_OBSERVATIONS);
    const regular = detectHabits(REGULAR_USER_OBSERVATIONS);
    const irregularSport = irregular.find((habit) => habit.kind === "sport");
    const regularSport = regular.find((habit) => habit.kind === "sport");

    expect(irregularSport).toBeDefined();
    expect(regularSport).toBeDefined();
    expect(irregularSport!.score).toBeLessThan(regularSport!.score);
  });

  it("nouvelle habitude — evolution emerging", () => {
    const habits = detectHabits(NEW_HABIT_OBSERVATIONS);
    const sport = habits.find((habit) => habit.kind === "sport");

    expect(sport?.evolution).toBe("emerging");
  });

  it("ancienne habitude — score élevé et evolution stable", () => {
    const habits = detectHabits(OLD_HABIT_OBSERVATIONS);
    const sport = habits.find((habit) => habit.kind === "sport");

    expect(sport?.score).toBeGreaterThan(50);
    expect(["stable", "emerging"]).toContain(sport?.evolution);
  });

  it("habitude abandonnée — pas assez d'observations", () => {
    const habits = detectHabits(ABANDONED_HABIT_OBSERVATIONS);
    expect(habits.filter((habit) => habit.kind === "sport")).toHaveLength(0);
  });

  it("chaque habitude possède score, fréquence, stabilité, ancienneté, évolution", () => {
    const habits = detectHabits(REGULAR_USER_OBSERVATIONS);

    for (const habit of habits) {
      expect(habit.score).toBeGreaterThanOrEqual(0);
      expect(habit.frequency).toBeGreaterThanOrEqual(2);
      expect(habit.stability).toBeGreaterThanOrEqual(0);
      expect(habit.antiquityDays).toBeGreaterThanOrEqual(1);
      expect(habit.evolution).toBeTruthy();
    }
  });
});
