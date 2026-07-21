/**
 * @vitest-environment happy-dom
 */

import { beforeEach, describe, expect, it } from "vitest";

import {
  buildCheckinFlow,
  needsAdaptiveSleepQuestion,
  shouldSkipSleepQuestion,
} from "../adaptive/adaptiveQuestionEngine";
import { clearDailyStates, saveDailyState, setCheckinMode } from "../store/dailyStateStore";
import { excellentSleepHistory, TEST_USER } from "../testing/fixtures";

describe("AdaptiveQuestionEngine", () => {
  beforeEach(() => {
    clearDailyStates(TEST_USER);
    setCheckinMode(TEST_USER, "standard");
  });

  it("mode standard inclut humeur, énergie, stress et sommeil", () => {
    const flow = buildCheckinFlow({ userId: TEST_USER, mode: "standard", energy: 6 });
    expect(flow.steps).toEqual(["mood", "energy", "stress", "sleep"]);
  });

  it("mode rapide — humeur et énergie seulement", () => {
    const flow = buildCheckinFlow({ userId: TEST_USER, mode: "quick", energy: 6 });
    expect(flow.steps).toEqual(["mood", "energy"]);
  });

  it("mode complet ajoute journée particulière et note", () => {
    const flow = buildCheckinFlow({ userId: TEST_USER, mode: "complete", energy: 6 });
    expect(flow.steps).toContain("specialDay");
    expect(flow.steps).toContain("notes");
  });

  it("supprime la question sommeil si toujours 5 étoiles", () => {
    expect(shouldSkipSleepQuestion(excellentSleepHistory())).toBe(true);

    for (const state of excellentSleepHistory()) {
      saveDailyState(TEST_USER, state);
    }

    const flow = buildCheckinFlow({ userId: TEST_USER, mode: "standard", energy: 6 });
    expect(flow.steps).not.toContain("sleep");
  });

  it("pose une question adaptative si énergie faible et sommeil ignoré", () => {
    for (const state of excellentSleepHistory()) {
      saveDailyState(TEST_USER, state);
    }

    const flow = buildCheckinFlow({ userId: TEST_USER, mode: "standard", energy: 2 });
    expect(needsAdaptiveSleepQuestion(2)).toBe(true);
    expect(flow.adaptiveStep).toBe("adaptive_sleep");
  });

  it("maximum une question adaptative", () => {
    for (const state of excellentSleepHistory()) {
      saveDailyState(TEST_USER, state);
    }

    const flow = buildCheckinFlow({ userId: TEST_USER, mode: "standard", energy: 2 });
    expect(flow.adaptiveStep).toBe("adaptive_sleep");
    expect(flow.estimatedSeconds).toBeLessThanOrEqual(45);
  });
});
