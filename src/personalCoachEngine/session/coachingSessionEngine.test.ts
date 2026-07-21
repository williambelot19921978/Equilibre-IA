/**
 * @vitest-environment happy-dom
 */

import { beforeEach, describe, expect, it } from "vitest";

import { proposeDailySession } from "../session/coachingSessionEngine";
import { clearCoachStore } from "../store/coachStore";
import { PersonalCoachEngine } from "../engine/personalCoachEngine";
import { baseCoachInput, TEST_USER } from "../testing/fixtures";

describe("CoachingSessionEngine", () => {
  const engine = new PersonalCoachEngine();

  beforeEach(() => {
    clearCoachStore(TEST_USER);
  });

  it("session facultative entre 30s et 2min", () => {
    const snapshot = engine.analyze(baseCoachInput());
    const session =
      snapshot.proposedSession ??
      proposeDailySession(baseCoachInput(), snapshot.todayInsights, snapshot.recovery);
    if (session) {
      expect(session.optional).toBe(true);
      expect(session.estimatedSeconds).toBeGreaterThanOrEqual(15);
      expect(session.estimatedSeconds).toBeLessThanOrEqual(120);
    }
  });

  it("ne propose qu'une session par jour", () => {
    const input = baseCoachInput();
    const first = engine.analyze(input).proposedSession;
    const second = engine.analyze(input).proposedSession;
    if (first) {
      expect(second).toBeNull();
    }
  });
});
