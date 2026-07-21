/**
 * @vitest-environment happy-dom
 */

import { beforeEach, describe, expect, it } from "vitest";

import { detectSuccesses, markSuccessShown } from "../success/successEngine";
import { clearCoachStore, getShownSuccessKeys } from "../store/coachStore";
import { baseCoachInput, TEST_USER } from "../testing/fixtures";

describe("SuccessEngine", () => {
  beforeEach(() => {
    clearCoachStore(TEST_USER);
  });

  it("génère des félicitations pour objectifs et habitudes", () => {
    const successes = detectSuccesses(baseCoachInput());
    expect(successes.length).toBeGreaterThan(0);
    expect(successes.every((item) => item.kind === "success")).toBe(true);
  });

  it("évite les messages répétitifs", () => {
    const first = detectSuccesses(baseCoachInput());
    for (const item of first) {
      markSuccessShown(TEST_USER, item);
    }
    const second = detectSuccesses(baseCoachInput());
    expect(second.length).toBeLessThan(first.length);
    expect(getShownSuccessKeys(TEST_USER).length).toBeGreaterThan(0);
  });
});
