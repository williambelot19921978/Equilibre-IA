/** @vitest-environment happy-dom */
import { beforeEach, describe, expect, it } from "vitest";

import { clearDailyStates, saveDailyState } from "../dailyStateEngine/store/dailyStateStore";
import { resetAllKnowledge } from "../lifeKnowledgeEngine";
import { listGoals } from "../lib/goals/goalsStorage";
import {
  buildUserDataExport,
  exportAsCsv,
  exportAsJson,
  exportAsPdfSummary,
} from "./dataExportService";
import {
  DELETION_SCOPE_LABELS,
  executeDeletion,
  requiresDeletionConfirmation,
} from "./dataDeletionService";
import {
  getPrivacyPreferences,
  setPrivacyPreference,
} from "./privacyPreferencesStore";
import { submitFeedback, listFeedback } from "./feedbackStore";
import { FAQ_ITEMS } from "./types";

const USER = "trust-test-user";
const DATE = "2026-07-21";

describe("privacy preferences", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("defaults to enabled and persists toggles", () => {
    expect(getPrivacyPreferences(USER).useCheckins).toBe(true);
    const next = setPrivacyPreference(USER, "useCheckins", false);
    expect(next.useCheckins).toBe(false);
    expect(getPrivacyPreferences(USER).useCheckins).toBe(false);
  });
});

describe("data export", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("builds export bundle with checkins and preferences", async () => {
    saveDailyState(USER, {
      date: DATE,
      mood: "good",
      energy: 7,
      stress: 3,
      sleepQuality: 7,
      specialDay: "normal",
      confidence: 0.8,
      source: "checkin",
      createdAt: `${DATE}T08:00:00.000Z`,
      updatedAt: `${DATE}T08:00:00.000Z`,
    });

    const bundle = await buildUserDataExport(USER, DATE);
    expect(bundle.userId).toBe(USER);
    expect(bundle.checkins.length).toBe(1);
    expect(exportAsJson(bundle)).toContain('"userId"');
    expect(exportAsCsv(bundle)).toContain("checkins");
    expect(exportAsPdfSummary(bundle)).toContain("Aura");
  });
});

describe("data deletion", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("requires confirmation token per scope", () => {
    expect(requiresDeletionConfirmation("goals")).toBe("CONFIRMER-GOALS");
    expect(DELETION_SCOPE_LABELS.all).toMatch(/données/i);
  });

  it("deletes checkins and goals locally", () => {
    saveDailyState(USER, {
      date: DATE,
      mood: "average",
      energy: 5,
      stress: 4,
      sleepQuality: 6,
      specialDay: "normal",
      confidence: 0.7,
      source: "checkin",
      createdAt: `${DATE}T08:00:00.000Z`,
      updatedAt: `${DATE}T08:00:00.000Z`,
    });

    executeDeletion(USER, "checkins");
    executeDeletion(USER, "auraMemory");
    resetAllKnowledge(USER);
    expect(listGoals(USER)).toHaveLength(0);
  });
});

describe("feedback store", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("stores beta feedback entries", () => {
    submitFeedback(USER, { kind: "idea", message: "Plus de clarté sur le coach" });
    expect(listFeedback(USER)).toHaveLength(1);
  });
});

describe("FAQ", () => {
  it("covers core trust questions", () => {
    expect(FAQ_ITEMS.some((item) => item.id === "delete-data")).toBe(true);
    expect(FAQ_ITEMS.some((item) => item.id === "disable-ai")).toBe(true);
  });
});
