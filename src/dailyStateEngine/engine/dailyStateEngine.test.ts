/**
 * @vitest-environment happy-dom
 */

import { beforeEach, describe, expect, it } from "vitest";

import { DailyStateEngine } from "../engine/dailyStateEngine";
import { defaultTrendEngine } from "../trends/trendEngine";
import {
  clearDailyStates,
  clearSkipRecords,
  getDailyState,
  getSkipRecords,
} from "../store/dailyStateStore";
import { sampleStateInput, TEST_DATE, TEST_USER, tiredStateInput } from "../testing/fixtures";

describe("DailyStateEngine", () => {
  const engine = new DailyStateEngine({ trendEngine: defaultTrendEngine });

  beforeEach(() => {
    clearDailyStates(TEST_USER);
    clearSkipRecords(TEST_USER);
  });

  it("enregistre et expose l'état du jour", () => {
    const saved = engine.submitCheckin(sampleStateInput());
    expect(saved.mood).toBe("good");
    expect(getDailyState(TEST_USER, TEST_DATE)?.energy).toBe(7);
  });

  it("historise les check-ins", () => {
    engine.submitCheckin(sampleStateInput({ date: "2026-07-18" }));
    engine.submitCheckin(sampleStateInput({ date: "2026-07-19" }));
    engine.submitCheckin(sampleStateInput({ date: TEST_DATE }));

    const snapshot = engine.analyze(TEST_USER, TEST_DATE);
    expect(snapshot.hasCheckinToday).toBe(true);
    expect(snapshot.trends7d.sampleCount).toBeGreaterThanOrEqual(3);
  });

  it("trace les skips sans bloquer", () => {
    engine.skipCheckin(TEST_USER, TEST_DATE);
    expect(getSkipRecords(TEST_USER).some((skip) => skip.date === TEST_DATE)).toBe(true);

    const snapshot = engine.analyze(TEST_USER, TEST_DATE);
    expect(snapshot.hasCheckinToday).toBe(false);
    expect(snapshot.skipCount).toBeGreaterThan(0);
  });

  it("rappel doux après plusieurs jours sans check-in", () => {
    engine.skipCheckin(TEST_USER, TEST_DATE);
    engine.skipCheckin(TEST_USER, "2026-07-19");
    engine.skipCheckin(TEST_USER, "2026-07-18");

    const snapshot = engine.analyze(TEST_USER, TEST_DATE);
    expect(snapshot.shouldRemind).toBe(true);
    expect(snapshot.reminderMessage).toContain("30 secondes");
  });

  it("accepte une réponse adaptative au sommeil", () => {
    const saved = engine.submitCheckin({
      ...tiredStateInput(),
      adaptiveAnswer: true,
    });
    expect(saved.adaptiveAnswer).toBe(true);
  });
});
