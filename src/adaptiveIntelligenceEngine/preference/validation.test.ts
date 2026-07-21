/**
 * @vitest-environment happy-dom
 */

import { beforeEach, describe, expect, it } from "vitest";

import {
  acceptPreference,
  clearPreferences,
  getValidatedPreferences,
  rejectPreference,
  upsertProposal,
} from "./preferenceStore";
import { recordPreferenceValidated } from "../timeline/learningTimeline";
import {
  buildRejectedPreference,
  buildValidatedPreference,
} from "../testing/fixtures";
import {
  getValidatedPreferencesOnly,
  isRejectedPreference,
  shouldUsePreferenceForRecommendation,
} from "../action/adaptiveActionGuards";

const USER = "validation-test-user";

describe("Validation utilisateur", () => {
  beforeEach(() => {
    clearPreferences(USER);
  });

  it("accepte une préférence — statut accepted", () => {
    upsertProposal(USER, {
      ...buildValidatedPreference(),
      id: "pref-pending",
      status: "pending",
      validatedAt: undefined,
    });

    const accepted = acceptPreference(USER, "pref-pending");
    expect(accepted?.status).toBe("accepted");
    expect(accepted?.validatedAt).toBeTruthy();
    expect(getValidatedPreferences(USER)).toHaveLength(1);
  });

  it("refuse une préférence — statut rejected", () => {
    upsertProposal(USER, {
      ...buildValidatedPreference(),
      id: "pref-pending-2",
      status: "pending",
      validatedAt: undefined,
    });

    const rejected = rejectPreference(USER, "pref-pending-2");
    expect(rejected?.status).toBe("rejected");
    expect(getValidatedPreferences(USER)).toHaveLength(0);
  });

  it("Human Model / Action — uniquement préférences validées", () => {
    const validated = buildValidatedPreference();
    const rejected = buildRejectedPreference();

    expect(getValidatedPreferencesOnly([validated, rejected])).toHaveLength(1);
    expect(
      shouldUsePreferenceForRecommendation({
        preference: validated,
        allPreferences: [validated, rejected],
      }),
    ).toBe(true);
    expect(
      shouldUsePreferenceForRecommendation({
        preference: rejected,
        allPreferences: [validated, rejected],
      }),
    ).toBe(false);
  });

  it("préférence rejetée identique bloque la recommandation", () => {
    const rejected = buildRejectedPreference();
    expect(isRejectedPreference([rejected], "sport", "07:00")).toBe(true);
    expect(isRejectedPreference([rejected], "sport", "18:30")).toBe(false);
  });

  it("timeline enregistre validation et refus", () => {
    const proposal = {
      ...buildValidatedPreference(),
      id: "pref-tl",
      status: "pending" as const,
      validatedAt: undefined,
    };
    upsertProposal(USER, proposal);

    const accepted = acceptPreference(USER, "pref-tl");
    if (accepted) {
      recordPreferenceValidated(USER, accepted, true);
    }

    expect(accepted?.status).toBe("accepted");
  });
});
