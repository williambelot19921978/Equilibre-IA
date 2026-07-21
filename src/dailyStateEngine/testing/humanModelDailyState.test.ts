import { describe, expect, it } from "vitest";

import { fatigueRule } from "../../ai/humanModelFoundation/rules/fatigueRule";
import { stressRule } from "../../ai/humanModelFoundation/rules/stressRule";
import {
  assertValidRuleOutput,
  baseRuleInput,
  makeCheckin,
} from "../../ai/humanModelFoundation/testing/ruleTestUtils";

describe("Human Model — DailyState priority", () => {
  it("fatigueRule privilégie le check-in du jour sur le planning chargé", () => {
    const result = fatigueRule.evaluate(
      baseRuleInput({
        dailyStateEnabled: true,
        dailyStateToday: {
          date: "2026-07-20",
          mood: "good",
          energy: 8,
          stress: 3,
          sleepQuality: 4,
          specialDay: "normal",
          confidence: 0.9,
        },
        dailyCheckin: makeCheckin("exhausted"),
        blockCount: 12,
        taskTodoCount: 15,
      }),
    );

    assertValidRuleOutput(result);
    expect(result.value).toBe("Reposé");
    expect(result.confidence).toBeGreaterThan(0.9);
    expect(result.reasons.some((reason) => reason.includes("Check-in"))).toBe(true);
  });

  it("stressRule privilégie le stress déclaré", () => {
    const result = stressRule.evaluate(
      baseRuleInput({
        dailyStateEnabled: true,
        dailyStateToday: {
          date: "2026-07-20",
          mood: "average",
          energy: 5,
          stress: 9,
          sleepQuality: 3,
          specialDay: "busy",
          confidence: 0.88,
        },
        dailyCheckin: makeCheckin("good"),
        blockCount: 2,
      }),
    );

    assertValidRuleOutput(result);
    expect(result.value).toBe("Stress élevé");
  });
});
