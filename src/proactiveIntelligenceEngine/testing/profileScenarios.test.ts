/**
 * @vitest-environment happy-dom
 */

import { beforeEach, describe, expect, it } from "vitest";

import { ProactiveIntelligenceEngine } from "../engine/proactiveIntelligenceEngine";
import { AttentionEngine } from "../attention/attentionEngine";
import { SuggestionEngine } from "../suggestion/suggestionEngine";
import { DigestBuilder } from "../digest/digestBuilder";
import { LifeTransitionEngine } from "../transition/lifeTransitionEngine";
import { NotificationDispatcher } from "../notification/notificationDispatcher";
import { clearSuggestions } from "../suggestion/suggestionStore";
import { clearProactiveTimeline } from "../timeline/proactiveTimeline";
import {
  recordSuggestionDismissed,
  frequencyMultiplier,
  clearDismissRecords,
} from "../learning/proactiveLearningEngine";
import { clearBehaviorMetrics } from "../learning/proactiveBehaviorStore";
import { ALL_SCENARIOS, BUSY_DAY_INPUT } from "./fixtures";

const USER = "profile-proactive";

function createEngine(): ProactiveIntelligenceEngine {
  return new ProactiveIntelligenceEngine({
    attentionEngine: new AttentionEngine(),
    suggestionEngine: new SuggestionEngine(),
    digestBuilder: new DigestBuilder(),
    lifeTransitionEngine: new LifeTransitionEngine(),
    notificationDispatcher: new NotificationDispatcher(),
  });
}

describe("EPIC6B profile scenarios", () => {
  beforeEach(() => {
    clearSuggestions(USER);
    clearProactiveTimeline(USER);
    clearDismissRecords(USER);
    clearBehaviorMetrics(USER);
  });

  for (const scenario of ALL_SCENARIOS) {
    it(`${scenario.label} — analyse proactive`, () => {
      const engine = createEngine();
      const snapshot = engine.analyze({ ...scenario.input, userId: USER });

      expect(snapshot.enabled).toBe(true);
      expect(Array.isArray(snapshot.suggestions)).toBe(true);
      expect(Array.isArray(snapshot.timeline)).toBe(true);
      expect(snapshot.behaviorMetrics.interruptionTolerance).toBeGreaterThan(0);
    });
  }

  it("utilisateur qui refuse tout — fréquence réduite", () => {
    for (let index = 0; index < 10; index += 1) {
      recordSuggestionDismissed(USER, "organization");
    }
    expect(frequencyMultiplier(USER, "organization")).toBeLessThan(0.5);
  });

  it("life transition — détecte changement sans modifier habitudes", () => {
    const engine = createEngine();
    const snapshot = engine.analyze({
      ...BUSY_DAY_INPUT,
      userId: USER,
      onVacation: true,
    });

    expect(snapshot.lifeTransitions.length).toBeGreaterThan(0);
    expect(snapshot.lifeTransitions[0]?.message).toContain("Souhaitez-vous");
  });

  it("notifications architecture only — passent par AttentionEngine", () => {
    const dispatcher = new NotificationDispatcher();
    const engine = new ProactiveIntelligenceEngine({
      attentionEngine: new AttentionEngine(),
      suggestionEngine: new SuggestionEngine(),
      digestBuilder: new DigestBuilder(),
      lifeTransitionEngine: new LifeTransitionEngine(),
      notificationDispatcher: dispatcher,
    });

    engine.analyze({ ...BUSY_DAY_INPUT, userId: USER });
    const history = dispatcher.getHistory();

    for (const notification of history) {
      expect(notification.architectureOnly).toBe(true);
    }
  });
});
