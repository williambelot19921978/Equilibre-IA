/**
 * EPIC 4B certification — matrice de tests des 11 règles Human Model.
 */

import { describe, expect, it } from "vitest";

import {
  assertDeterministicRule,
  assertValidRuleOutput,
  baseRuleInput,
  makeCheckin,
} from "../testing/ruleTestUtils";
import { availabilityRule } from "./availabilityRule";
import { concernRule } from "./concernRule";
import { currentStateRule } from "./currentStateRule";
import { familyPressureRule } from "./familyPressureRule";
import { fatigueRule } from "./fatigueRule";
import { focusRule } from "./focusRule";
import { goalRule } from "./goalRule";
import { mentalLoadRule } from "./mentalLoadRule";
import { motivationRule } from "./motivationRule";
import { sleepRule } from "./sleepRule";
import { stressRule } from "./stressRule";

describe("EPIC4-B Rule Matrix — FatigueRule", () => {
  it("données absentes → null + missingData", () => {
    const result = assertDeterministicRule(fatigueRule, baseRuleInput());
    assertValidRuleOutput(result);
    expect(result.value).toBeNull();
    expect(result.missingData.length).toBeGreaterThan(0);
  });

  it("valeur basse — humeur great", () => {
    const result = fatigueRule.evaluate(
      baseRuleInput({
        dailyCheckin: makeCheckin("great", { energy_level: "high", fatigue_level: "low" }),
      }),
    );
    assertValidRuleOutput(result);
    expect(result.value).toMatch(/Très reposé|Reposé/);
    expect(result.confidence).toBeGreaterThan(0.4);
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it("valeur intermédiaire — humeur okay + planning léger", () => {
    const result = fatigueRule.evaluate(
      baseRuleInput({
        dailyCheckin: makeCheckin("okay"),
        blockCount: 3,
        hasLoadedPlan: true,
      }),
    );
    assertValidRuleOutput(result);
    expect(result.value).toBe("Normal");
  });

  it("valeur élevée — exhausted + journée chargée", () => {
    const result = fatigueRule.evaluate(
      baseRuleInput({
        dailyCheckin: makeCheckin("exhausted", {
          energy_level: "low",
          fatigue_level: "high",
        }),
        blockCount: 9,
        taskTodoCount: 12,
        hasLoadedPlan: true,
      }),
    );
    assertValidRuleOutput(result);
    expect(result.value).toBe("Très fatigué");
    expect(result.confidence).toBeGreaterThan(0.5);
  });
});

describe("EPIC4-B Rule Matrix — StressRule", () => {
  it("données absentes → null", () => {
    const result = assertDeterministicRule(stressRule, baseRuleInput());
    assertValidRuleOutput(result);
    expect(result.value).toBeNull();
    expect(result.missingData.length).toBeGreaterThan(0);
  });

  it("stress faible", () => {
    const result = stressRule.evaluate(
      baseRuleInput({
        dailyCheckin: makeCheckin("good", { stress_level: "low" }),
      }),
    );
    assertValidRuleOutput(result);
    expect(result.value).toBe("Stress faible");
  });

  it("stress moyen", () => {
    const result = stressRule.evaluate(
      baseRuleInput({
        dailyCheckin: makeCheckin("okay", { stress_level: "medium" }),
      }),
    );
    assertValidRuleOutput(result);
    expect(result.value).toBe("Stress moyen");
  });

  it("stress élevé", () => {
    const result = stressRule.evaluate(
      baseRuleInput({
        dailyCheckin: makeCheckin("stressed", { stress_level: "high" }),
        taskTodoCount: 10,
        blockCount: 7,
        hasLoadedPlan: true,
      }),
    );
    assertValidRuleOutput(result);
    expect(result.value).toBe("Stress élevé");
    expect(result.reasons.some((reason) => reason.toLowerCase().includes("stress"))).toBe(true);
  });
});

describe("EPIC4-B Rule Matrix — MentalLoadRule", () => {
  it("peu de données → charge légère par défaut", () => {
    const result = assertDeterministicRule(mentalLoadRule, baseRuleInput());
    assertValidRuleOutput(result);
    expect(result.value).toBe("Charge légère");
  });

  it("charge normale", () => {
    const result = mentalLoadRule.evaluate(
      baseRuleInput({
        taskTodoCount: 4,
        blockCount: 4,
        hasLoadedPlan: true,
      }),
    );
    assertValidRuleOutput(result);
    expect(result.value).toBe("Charge normale");
  });

  it("charge forte", () => {
    const result = mentalLoadRule.evaluate(
      baseRuleInput({
        taskTodoCount: 12,
        blockCount: 9,
        childrenCount: 2,
        hasLoadedPlan: true,
      }),
    );
    assertValidRuleOutput(result);
    expect(result.value).toBe("Charge forte");
    expect(result.explanation).toMatch(/Charge forte/i);
  });
});

describe("EPIC4-B Rule Matrix — AvailabilityRule", () => {
  it("fatigue + charge → disponibilité faible", () => {
    const result = availabilityRule.evaluate(
      baseRuleInput({
        dailyCheckin: makeCheckin("exhausted", { fatigue_level: "high" }),
        taskTodoCount: 12,
        blockCount: 9,
        hasLoadedPlan: true,
      }),
    );
    assertValidRuleOutput(result);
    expect(result.value).toBe("Faible");
    expect(result.confidence).toBeGreaterThan(0);
  });

  it("énergie haute + charge légère → bonne disponibilité", () => {
    const result = availabilityRule.evaluate(
      baseRuleInput({
        dailyCheckin: makeCheckin("great", { energy_level: "high", fatigue_level: "low" }),
        taskTodoCount: 1,
        blockCount: 2,
        hasLoadedPlan: true,
      }),
    );
    assertValidRuleOutput(result);
    expect(result.value).toBe("Bonne");
  });

  it("données limitées → disponibilité moyenne ou faible sans NaN", () => {
    const result = assertDeterministicRule(availabilityRule, baseRuleInput());
    assertValidRuleOutput(result);
    expect(["Faible", "Moyenne", "Bonne"]).toContain(result.value);
  });
});

describe("EPIC4-B Rule Matrix — FocusRule", () => {
  it("données absentes → null", () => {
    const result = assertDeterministicRule(focusRule, baseRuleInput());
    assertValidRuleOutput(result);
    expect(result.value).toBeNull();
  });

  it("concentration bonne", () => {
    const result = focusRule.evaluate(
      baseRuleInput({
        dailyCheckin: makeCheckin("great"),
        blockCount: 2,
        hasLoadedPlan: true,
        profile: { preferredFocusMinutes: 50 } as never,
      }),
    );
    assertValidRuleOutput(result);
    expect(result.value).toBe("Concentration bonne");
  });

  it("concentration faible", () => {
    const result = focusRule.evaluate(
      baseRuleInput({
        dailyCheckin: makeCheckin("exhausted"),
        blockCount: 8,
        hasLoadedPlan: true,
      }),
    );
    assertValidRuleOutput(result);
    expect(result.value).toBe("Concentration faible");
  });
});

describe("EPIC4-B Rule Matrix — SleepRule", () => {
  it("données absentes → null", () => {
    const result = assertDeterministicRule(sleepRule, baseRuleInput());
    assertValidRuleOutput(result);
    expect(result.value).toBeNull();
    expect(result.missingData.length).toBeGreaterThan(0);
  });

  it("sommeil probablement bon", () => {
    const result = sleepRule.evaluate(
      baseRuleInput({
        dailyCheckin: makeCheckin("great"),
        profile: { sleepNeededHours: 8 } as never,
      }),
    );
    assertValidRuleOutput(result);
    expect(result.value).toBe("Sommeil probablement bon");
  });

  it("sommeil probablement insuffisant", () => {
    const result = sleepRule.evaluate(
      baseRuleInput({
        dailyCheckin: makeCheckin("exhausted", { fatigue_level: "high" }),
        profile: { sleepProblems: ["insomnie"] } as never,
      }),
    );
    assertValidRuleOutput(result);
    expect(result.value).toBe("Sommeil probablement insuffisant");
  });
});

describe("EPIC4-B Rule Matrix — MotivationRule", () => {
  it("données absentes → null", () => {
    const result = assertDeterministicRule(
      motivationRule,
      baseRuleInput({ goalsEnabled: false }),
    );
    assertValidRuleOutput(result);
    expect(result.value).toBeNull();
  });

  it("motivation faible", () => {
    const result = motivationRule.evaluate(
      baseRuleInput({
        dailyCheckin: makeCheckin("exhausted"),
      }),
    );
    assertValidRuleOutput(result);
    expect(result.value).toBe("Motivation faible");
  });

  it("motivation bonne", () => {
    const result = motivationRule.evaluate(
      baseRuleInput({
        dailyCheckin: makeCheckin("great"),
        activeGoalCount: 2,
        goals: [{ id: "g1", name: "Sport", progressPercent: 60 }],
      }),
    );
    assertValidRuleOutput(result);
    expect(result.value).toBe("Motivation bonne");
    expect(result.confidence).toBeGreaterThan(0.4);
  });
});

describe("EPIC4-B Rule Matrix — FamilyPressureRule", () => {
  it("sans enfant → pression faible", () => {
    const result = assertDeterministicRule(
      familyPressureRule,
      baseRuleInput({ memberCount: 1, childrenCount: 0 }),
    );
    assertValidRuleOutput(result);
    expect(result.value).toBe("Pression faible");
  });

  it("pression modérée", () => {
    const result = familyPressureRule.evaluate(
      baseRuleInput({ childrenCount: 2, memberCount: 3 }),
    );
    assertValidRuleOutput(result);
    expect(result.value).toBe("Pression modérée");
  });

  it("pression élevée", () => {
    const result = familyPressureRule.evaluate(
      baseRuleInput({ childrenCount: 4, memberCount: 5 }),
    );
    assertValidRuleOutput(result);
    expect(result.value).toBe("Pression élevée");
    expect(result.reasons.length).toBeGreaterThan(0);
  });
});

describe("EPIC4-B Rule Matrix — GoalRule", () => {
  it("objectifs désactivés → null", () => {
    const result = goalRule.evaluate(baseRuleInput({ goalsEnabled: false }));
    assertValidRuleOutput(result);
    expect(result.value).toBeNull();
  });

  it("aucun objectif actif → null", () => {
    const result = goalRule.evaluate(baseRuleInput({ activeGoalCount: 0, goals: [] }));
    assertValidRuleOutput(result);
    expect(result.value).toBeNull();
  });

  it("objectif dominant — progression la plus élevée", () => {
    const result = goalRule.evaluate(
      baseRuleInput({
        activeGoalCount: 2,
        goals: [
          { id: "g1", name: "Lecture", progressPercent: 20 },
          { id: "g2", name: "Sport", progressPercent: 70 },
        ],
      }),
    );
    assertValidRuleOutput(result);
    expect(result.value?.name).toBe("Sport");
    expect(result.explanation).toMatch(/Sport/);
  });
});

describe("EPIC4-B Rule Matrix — ConcernRule", () => {
  it("daily brief → préoccupation non inventée", () => {
    const result = concernRule.evaluate(
      baseRuleInput({
        dailyBrief: {
          greeting: "Bonjour William",
          synthesis: "Priorité du jour : préparer la réunion familiale.",
          recommendations: [],
          insights: [],
        } as never,
      }),
    );
    assertValidRuleOutput(result);
    expect(result.value).toMatch(/réunion familiale/i);
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it("nombreuses tâches → préoccupation charge", () => {
    const result = concernRule.evaluate(
      baseRuleInput({
        taskTodoCount: 10,
        topTaskTitles: ["Courses urgentes"],
      }),
    );
    assertValidRuleOutput(result);
    expect(result.value).toMatch(/Courses urgentes|Tâches en attente/);
  });

  it("aucun signal → null", () => {
    const result = concernRule.evaluate(baseRuleInput());
    assertValidRuleOutput(result);
    expect(result.value).toBeNull();
  });
});

describe("EPIC4-B Rule Matrix — CurrentStateRule", () => {
  it("agrège énergie, stress, charge et disponibilité", () => {
    const result = currentStateRule.evaluate(
      baseRuleInput({
        dailyCheckin: makeCheckin("tired", { stress_level: "medium" }),
        taskTodoCount: 8,
        blockCount: 6,
        hasLoadedPlan: true,
      }),
    );
    assertValidRuleOutput(result);
    expect(result.value?.label.length).toBeGreaterThan(0);
    expect(result.value?.energy).toBeTruthy();
    expect(result.value?.mentalLoad).toBeTruthy();
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it("comportement déterministe", () => {
    const input = baseRuleInput({
      dailyCheckin: makeCheckin("good"),
      blockCount: 3,
      hasLoadedPlan: true,
    });
    assertDeterministicRule(currentStateRule, input);
  });
});
