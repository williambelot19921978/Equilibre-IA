import { describe, expect, it } from "vitest";

import type { HumanModelRuleInput } from "../types/ruleTypes";
import { fatigueRule } from "./fatigueRule";
import { mentalLoadRule } from "./mentalLoadRule";
import { motivationRule } from "./motivationRule";
import { goalRule } from "./goalRule";

function baseInput(overrides: Partial<HumanModelRuleInput> = {}): HumanModelRuleInput {
  return {
    userId: "user-1",
    firstName: "William",
    date: "2026-07-20",
    dailyCheckin: null,
    blockCount: 0,
    hasLoadedPlan: false,
    taskTodoCount: 0,
    taskTotalCount: 0,
    topTaskTitles: [],
    childrenCount: 0,
    memberCount: 1,
    goals: [],
    goalsEnabled: true,
    activeGoalCount: 0,
    dailyBrief: null,
    profile: null,
    knownFactsCount: 0,
    gaps: [],
    sources: [],
    ...overrides,
  };
}

describe("EPIC4-B FatigueRule", () => {
  it("estime une fatigue élevée avec check-in exhausted", () => {
    const result = fatigueRule.evaluate(
      baseInput({
        dailyCheckin: {
          id: "c1",
          user_id: "user-1",
          household_id: null,
          checkin_date: "2026-07-20",
          energy_level: "low",
          fatigue_level: "high",
          stress_level: "medium",
          mood: "exhausted",
          intensity: 4,
          note: null,
          created_at: "",
          updated_at: "",
        },
      }),
    );

    expect(result.value).toBe("Très fatigué");
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it("retourne null si aucune donnée", () => {
    const result = fatigueRule.evaluate(baseInput());
    expect(result.value).toBeNull();
    expect(result.missingData.length).toBeGreaterThan(0);
  });
});

describe("EPIC4-B MentalLoadRule", () => {
  it("signale une charge forte avec nombreuses tâches et blocs", () => {
    const result = mentalLoadRule.evaluate(
      baseInput({
        taskTodoCount: 12,
        blockCount: 9,
        childrenCount: 2,
        hasLoadedPlan: true,
      }),
    );

    expect(result.value).toBe("Charge forte");
    expect(result.reasons.some((reason) => reason.includes("tâche"))).toBe(true);
  });
});

describe("EPIC4-B MotivationRule", () => {
  it("augmente la motivation avec humeur positive et objectifs", () => {
    const result = motivationRule.evaluate(
      baseInput({
        dailyCheckin: {
          id: "c1",
          user_id: "user-1",
          household_id: null,
          checkin_date: "2026-07-20",
          energy_level: "high",
          fatigue_level: "low",
          stress_level: "low",
          mood: "great",
          intensity: 5,
          note: null,
          created_at: "",
          updated_at: "",
        },
        activeGoalCount: 2,
        goals: [{ id: "g1", name: "Sport", progressPercent: 60 }],
      }),
    );

    expect(result.value).toBe("Motivation bonne");
  });
});

describe("EPIC4-B GoalRule", () => {
  it("identifie l'objectif dominant", () => {
    const result = goalRule.evaluate(
      baseInput({
        goals: [
          { id: "g1", name: "Lecture", progressPercent: 20 },
          { id: "g2", name: "Sport", progressPercent: 70 },
        ],
        activeGoalCount: 2,
      }),
    );

    expect(result.value?.name).toBe("Sport");
  });
});
