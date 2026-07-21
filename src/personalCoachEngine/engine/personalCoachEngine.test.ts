/**
 * @vitest-environment happy-dom
 */

import { beforeEach, describe, expect, it } from "vitest";

import { PersonalCoachEngine } from "../engine/personalCoachEngine";
import { clearCoachStore } from "../store/coachStore";
import { ALL_COACHING_DOMAINS } from "../types/personalCoachTypes";
import { baseCoachInput, energeticCoachInput, TEST_USER, tiredCoachInput } from "../testing/fixtures";

describe("PersonalCoachEngine", () => {
  const engine = new PersonalCoachEngine();

  beforeEach(() => {
    clearCoachStore(TEST_USER);
  });

  it("produit un snapshot avec les 7 domaines", () => {
    const snapshot = engine.analyze(baseCoachInput());
    expect(snapshot.enabled).toBe(true);
    expect(snapshot.domainInsights).toHaveLength(ALL_COACHING_DOMAINS.length);
  });

  it("expose aujourd'hui, opportunités, récupération et réussites", () => {
    const snapshot = engine.analyze(energeticCoachInput());
    expect(snapshot.opportunities.length).toBeGreaterThan(0);
    expect(snapshot.todayInsights.length + snapshot.successes.length).toBeGreaterThan(0);
  });

  it("adapte la récupération quand fatigue", () => {
    const snapshot = engine.analyze(tiredCoachInput());
    expect(snapshot.recovery.length).toBeGreaterThan(0);
    expect(snapshot.recovery[0]?.kind).toBe("recovery");
  });

  it("inclut explainability sur chaque conseil", () => {
    const snapshot = engine.analyze(baseCoachInput());
    const sample = snapshot.opportunities[0] ?? snapshot.todayInsights[0];
    expect(sample?.explainability.why).toBeTruthy();
    expect(sample?.explainability.whyToday).toBeTruthy();
    expect(sample?.explainability.confidence).toBeGreaterThan(0);
  });
});
