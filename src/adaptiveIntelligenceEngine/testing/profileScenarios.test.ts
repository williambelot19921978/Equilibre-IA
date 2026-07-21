/**
 * @vitest-environment happy-dom
 */

import { beforeEach, describe, expect, it } from "vitest";

import { AdaptiveIntelligenceEngine } from "../engine/adaptiveIntelligenceEngine";
import { defaultObservationEngine } from "../observation/observationEngine";
import { defaultHabitDetector } from "../habit/habitDetector";
import { defaultPreferenceProposalEngine } from "../preference/preferenceProposalEngine";
import { AdaptiveNotificationBus } from "../events/adaptiveNotificationBus";
import { clearObservations, appendObservation } from "../observation/observationStore";
import { clearPreferences, upsertProposal } from "../preference/preferenceStore";
import { clearLearningTimeline } from "../timeline/learningTimeline";
import {
  ALL_PROFILES,
  buildRejectedPreference,
  buildValidatedPreference,
} from "./fixtures";

const USER = "profile-scenario-user";

function createEngine(): AdaptiveIntelligenceEngine {
  return new AdaptiveIntelligenceEngine({
    observationEngine: defaultObservationEngine,
    habitDetector: defaultHabitDetector,
    preferenceEngine: defaultPreferenceProposalEngine,
    notificationBus: new AdaptiveNotificationBus(),
  });
}

describe("EPIC6A profile scenarios", () => {
  beforeEach(() => {
    clearObservations(USER);
    clearPreferences(USER);
    clearLearningTimeline(USER);
  });

  for (const profile of ALL_PROFILES) {
    it(`${profile.label} — analyse complète`, () => {
      const engine = createEngine();

      for (const observation of profile.observations) {
        appendObservation(USER, observation);
      }

      const snapshot = engine.analyze({
        userId: USER,
        date: "2026-07-20",
      });

      expect(snapshot.enabled).toBe(true);
      expect(snapshot.observations.length).toBeGreaterThan(0);
      expect(Array.isArray(snapshot.habits)).toBe(true);
      expect(Array.isArray(snapshot.proposals)).toBe(true);
      expect(Array.isArray(snapshot.timeline)).toBe(true);
    });
  }

  it("préférence validée — disponible pour recommandations", () => {
    upsertProposal(USER, buildValidatedPreference());
    const engine = createEngine();
    const snapshot = engine.analyze({ userId: USER, date: "2026-07-20" });

    expect(snapshot.validatedPreferences.length).toBe(1);
    expect(snapshot.validatedPreferences[0]?.status).toBe("accepted");
  });

  it("préférence refusée — jamais dans validatedPreferences", () => {
    upsertProposal(USER, buildRejectedPreference());
    const engine = createEngine();
    const snapshot = engine.analyze({ userId: USER, date: "2026-07-20" });

    expect(snapshot.validatedPreferences).toHaveLength(0);
    expect(snapshot.proposals.some((prop) => prop.status === "rejected")).toBe(true);
  });

  it("notifications architecture only — jamais envoyées automatiquement", () => {
    const bus = new AdaptiveNotificationBus();
    const engine = new AdaptiveIntelligenceEngine({
      observationEngine: defaultObservationEngine,
      habitDetector: defaultHabitDetector,
      preferenceEngine: defaultPreferenceProposalEngine,
      notificationBus: bus,
    });

    for (const observation of ALL_PROFILES[0]!.observations) {
      appendObservation(USER, observation);
    }

    engine.analyze({ userId: USER, date: "2026-07-20" });
    const queued = bus.getHistory();

    expect(queued.length).toBeGreaterThan(0);
    expect(queued.every((note) => note.architectureOnly)).toBe(true);
  });
});
