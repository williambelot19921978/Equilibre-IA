/**
 * @vitest-environment happy-dom
 */

import { beforeEach, describe, expect, it } from "vitest";

import { buildDomainInsights } from "../domains/coachingDomainEngine";
import { PersonalCoachEngine } from "../engine/personalCoachEngine";
import { clearCoachStore, getLifePriority, setLifePriority } from "../store/coachStore";
import { baseCoachInput, TEST_USER } from "../testing/fixtures";

describe("Life priority", () => {
  beforeEach(() => {
    clearCoachStore(TEST_USER);
  });

  it("persiste et lit la priorité actuelle", () => {
    setLifePriority(TEST_USER, "sport");
    expect(getLifePriority(TEST_USER)).toBe("sport");
  });

  it("adapte les conseils selon la priorité famille", () => {
    const domains = buildDomainInsights(
      baseCoachInput({ childrenCount: 2, lifePriority: "family" }),
      "family",
    );
    const family = domains.find((domain) => domain.domain === "family_life");
    expect(family?.opportunities.length).toBeGreaterThan(0);
  });

  it("adapte les conseils selon la priorité sport via engine", () => {
    setLifePriority(TEST_USER, "sport");
    const snapshot = new PersonalCoachEngine().analyze(
      baseCoachInput({ dailyEnergy: 8, freeMinutes: 45 }),
    );
    expect(snapshot.lifePriority).toBe("sport");
    expect(snapshot.opportunities.length).toBeGreaterThan(0);
  });
});
