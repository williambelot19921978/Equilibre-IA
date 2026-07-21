/**
 * @vitest-environment happy-dom
 */

import { beforeEach, describe, expect, it } from "vitest";

import {
  appendTimelineEntry,
  clearLearningTimeline,
  getLearningTimeline,
  recordPreferenceValidated,
  syncTimelineFromAnalysis,
} from "./learningTimeline";
import { detectHabits } from "../habit/habitDetector";
import { buildPreferenceProposals } from "../preference/preferenceProposalEngine";
import { REGULAR_USER_OBSERVATIONS } from "../testing/fixtures";
import type { PreferenceProposal } from "../types/adaptiveTypes";

const USER = "timeline-test-user";

describe("LearningTimeline", () => {
  beforeEach(() => {
    clearLearningTimeline(USER);
  });

  it("enregistre habitudes et propositions de façon traçable", () => {
    const habits = detectHabits(REGULAR_USER_OBSERVATIONS);
    const proposals = buildPreferenceProposals({
      habits,
      observations: REGULAR_USER_OBSERVATIONS,
      existing: [],
    });

    const timeline = syncTimelineFromAnalysis({ userId: USER, habits, proposals });

    expect(timeline.some((entry) => entry.kind === "habit_detected")).toBe(true);
    expect(timeline.some((entry) => entry.kind === "preference_proposed")).toBe(true);
  });

  it("enregistre validation et refus", () => {
    const proposal: PreferenceProposal = {
      id: "pref-1",
      kind: "sport",
      label: "Sport préféré : 18:30",
      proposedValue: "18:30",
      status: "accepted",
      confidence: 0.89,
      explainability: {
        why: "12 occurrences.",
        dataUsed: [],
        observationCount: 12,
        periodDays: 14,
        confidenceLevel: 0.89,
        formula: "test",
      },
      habitId: "habit-sport-18:30",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    recordPreferenceValidated(USER, proposal, true);
    recordPreferenceValidated(USER, { ...proposal, id: "pref-2", status: "rejected" }, false);

    const timeline = getLearningTimeline(USER);
    expect(timeline.some((entry) => entry.kind === "preference_accepted")).toBe(true);
    expect(timeline.some((entry) => entry.kind === "preference_rejected")).toBe(true);
  });

  it("appendTimelineEntry ajoute des entrées avec timestamp", () => {
    appendTimelineEntry(USER, {
      kind: "habit_evolved",
      message: "Habitude en évolution.",
      relatedId: "habit-1",
      metadata: {},
    });

    const timeline = getLearningTimeline(USER);
    expect(timeline[0]?.timestamp).toBeTruthy();
    expect(timeline[0]?.message).toContain("évolution");
  });
});
