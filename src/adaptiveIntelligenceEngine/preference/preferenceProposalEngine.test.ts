/**
 * @vitest-environment happy-dom
 */

import { beforeEach, describe, expect, it } from "vitest";

import { buildPreferenceProposals } from "./preferenceProposalEngine";
import { clearPreferences, getAllPreferences } from "./preferenceStore";
import { detectHabits } from "../habit/habitDetector";
import { REGULAR_USER_OBSERVATIONS } from "../testing/fixtures";

const USER = "pref-test-user";

describe("PreferenceProposalEngine", () => {
  beforeEach(() => {
    clearPreferences(USER);
  });

  it("transforme une habitude en proposition pending", () => {
    const habits = detectHabits(REGULAR_USER_OBSERVATIONS);
    const proposals = buildPreferenceProposals({
      habits,
      observations: REGULAR_USER_OBSERVATIONS,
      existing: [],
    });

    const sport = proposals.find((prop) => prop.kind === "sport");
    expect(sport).toBeDefined();
    expect(sport?.status).toBe("pending");
    expect(sport?.proposedValue).toBe("18:30");
    expect(sport?.confidence).toBeGreaterThan(0);
    expect(sport?.explainability.observationCount).toBeGreaterThan(0);
  });

  it("ne crée pas de proposition pour habitude abandonnée (score faible)", () => {
    const habits = detectHabits([REGULAR_USER_OBSERVATIONS[0]!]);
    const proposals = buildPreferenceProposals({
      habits,
      observations: [REGULAR_USER_OBSERVATIONS[0]!],
      existing: [],
    });

    expect(proposals.filter((prop) => prop.status === "pending")).toHaveLength(0);
  });

  it("conserve les propositions existantes pending", () => {
    const habits = detectHabits(REGULAR_USER_OBSERVATIONS);
    const first = buildPreferenceProposals({
      habits,
      observations: REGULAR_USER_OBSERVATIONS,
      existing: [],
    });

    const second = buildPreferenceProposals({
      habits,
      observations: REGULAR_USER_OBSERVATIONS,
      existing: first,
    });

    const pendingSport = second.filter(
      (prop) => prop.kind === "sport" && prop.status === "pending",
    );
    expect(pendingSport.length).toBeLessThanOrEqual(1);
  });

  it("persiste les nouvelles propositions via PreferenceProposalEngine", async () => {
    const { defaultPreferenceProposalEngine } = await import("./preferenceProposalEngine");
    const habits = detectHabits(REGULAR_USER_OBSERVATIONS);

    defaultPreferenceProposalEngine.propose({
      userId: USER,
      habits,
      observations: REGULAR_USER_OBSERVATIONS,
    });

    const stored = getAllPreferences(USER);
    expect(stored.some((prop) => prop.status === "pending")).toBe(true);
  });
});
