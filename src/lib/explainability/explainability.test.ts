import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

import type { PlanningContext } from "../../ai/memoryEngine";
import type { DayTimelineEntry } from "../planning/displayedDayTimeline";
import { buildDailyBrief } from "../dailyBrief/buildDailyBrief";
import { buildDailyBriefRecommendations } from "../dailyBrief/buildDailyBriefRecommendations";
import {
  buildSportExplainabilityReasonCodes,
  buildStudyExplainabilityReasonCodes,
  buildTimeRiskExplainabilityReasonCodes,
} from "./buildExplainabilityReasonCodes";
import { MAX_EXPLAINABILITY_REASONS } from "./explainabilityReasonCodes";
import { presentDailyBrief } from "./presentDailyBrief";
import {
  containsTechnicalExplainabilityText,
  translateExplainabilityReason,
  translateExplainabilityReasons,
} from "./translateExplainabilityReasons";
import { isExplainableAiEnabled } from "../../config/featureFlags";

function readSrc(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), "src", relativePath), "utf8");
}

const TEST_DATE = "2026-07-13";

function atTime(hours: number, minutes: number): string {
  return new Date(
    `${TEST_DATE}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`,
  ).toISOString();
}

const baseContext: PlanningContext = {
  householdId: "household-1",
  children: [],
  childrenCount: 0,
  wakeTime: "06:30",
  bedTime: "22:00",
  workStart: "09:00",
  workEnd: "17:00",
  mainPriority: "studies",
  onboardingCompleted: true,
  profile: {
    eveningRoutine: [],
    workDays: ["monday"],
    procrastinationCauses: [],
    sleepProblems: [],
    sportInterests: [],
    sportMusic: [],
    restPreferences: [],
    faithImportance: "disabled",
    faithContent: [],
    studiesActive: true,
    preferredFocusMinutes: 30,
  },
  childRoutines: [],
  householdEvening: {
    eveningRoutineStart: null,
    eveningRoutineManager: null,
    averageEveningRoutineMinutes: 45,
  },
  familyContext: {
    activePeriods: [],
    disableWork: false,
    disableSchoolDeparture: false,
    maxFillRatio: 0.8,
    soloParentWithChildren: false,
    childSick: false,
    onlyMicroTasks: false,
    childrenVacation: false,
    userVacation: false,
    unavailableUserIds: [],
    adaptations: [],
    warnings: [],
  },
  familyContextPeriods: [],
  targetDate: TEST_DATE,
  currentUserId: "user-1",
};

function makeFreeSlot(durationMinutes = 60): DayTimelineEntry {
  const startsAt = atTime(10, 0);
  const endsAt = new Date(
    new Date(startsAt).getTime() + durationMinutes * 60_000,
  ).toISOString();

  return {
    id: "free-study",
    visualType: "free",
    title: "Temps libre",
    startsAt,
    endsAt,
    locked: false,
    origin: "computed",
    blockKind: "free_slot",
    freeSlotKind: "day",
    completed: false,
  };
}

describe("translateExplainabilityReasons", () => {
  it("translates FREE_SLOT and NO_CONFLICT", () => {
    const lines = translateExplainabilityReasons(["FREE_SLOT", "NO_CONFLICT"]);

    expect(lines).toContain("Tu disposes d'un créneau libre.");
    expect(lines).toContain("Aucun autre engagement n'entre en conflit.");
  });

  it("translates HIGH_PRIORITY", () => {
    expect(translateExplainabilityReason("HIGH_PRIORITY")).toBe(
      "Cette tâche est actuellement prioritaire.",
    );
  });

  it("limits output to four reasons", () => {
    const lines = translateExplainabilityReasons([
      "FREE_SLOT",
      "DURATION_COMPATIBLE",
      "NO_CONFLICT",
      "HIGH_PRIORITY",
      "SPORT_ALREADY_PLANNED",
      "AFTERNOON_DENSE",
    ]);

    expect(lines.length).toBeLessThanOrEqual(MAX_EXPLAINABILITY_REASONS);
  });

  it("never exposes technical wording", () => {
    const lines = translateExplainabilityReasons([
      "FREE_SLOT",
      "DURATION_COMPATIBLE",
      "NO_CONFLICT",
      "HIGH_PRIORITY",
    ]);

    for (const line of lines) {
      expect(containsTechnicalExplainabilityText(line)).toBe(false);
      expect(line).not.toMatch(/\{/);
      expect(line).not.toMatch(/score/i);
      expect(line).not.toMatch(/confidence/i);
    }
  });
});

describe("buildExplainabilityReasonCodes", () => {
  it("builds study reasons from decision outputs", () => {
    const codes = buildStudyExplainabilityReasonCodes({
      decisionApproved: true,
      slotMinutes: 60,
      requiredMinutes: 30,
      priority: "high",
      reasoningFactors: [
        { id: "slot-fit", label: "créneau adapté", positive: true },
      ],
    });

    expect(codes).toContain("FREE_SLOT");
    expect(codes).toContain("DURATION_COMPATIBLE");
    expect(codes).toContain("NO_CONFLICT");
    expect(codes).toContain("HIGH_PRIORITY");
  });

  it("returns sport reasons", () => {
    expect(
      buildSportExplainabilityReasonCodes({ variant: "scheduled" }),
    ).toContain("SPORT_ALREADY_PLANNED");
  });

  it("returns time risk reasons", () => {
    expect(buildTimeRiskExplainabilityReasonCodes()).toContain("AFTERNOON_DENSE");
  });
});

describe("presentDailyBrief", () => {
  it("hides why button when explainable flag is off", () => {
    const brief = buildDailyBrief({
      firstName: "William",
      date: TEST_DATE,
      timeline: [makeFreeSlot()],
      planningContext: baseContext,
    });

    expect(brief).not.toBeNull();
    if (!brief) return;

    const presented = presentDailyBrief(brief, false);
    expect(presented.recommendations[0]?.showWhyButton).toBe(false);
    expect(presented.recommendations[0]?.whyReasons).toEqual([]);
  });

  it("shows translated reasons when explainable flag is on", () => {
    const brief = buildDailyBrief({
      firstName: "William",
      date: TEST_DATE,
      timeline: [makeFreeSlot()],
      planningContext: baseContext,
    });

    expect(brief).not.toBeNull();
    if (!brief) return;

    const presented = presentDailyBrief(brief, true);
    const first = presented.recommendations[0];

    expect(first?.showWhyButton).toBe(true);
    expect(first?.whyReasons.length).toBeGreaterThan(0);
  });

  it("handles absence of reasons gracefully", () => {
    const presented = presentDailyBrief(
      {
        briefId: "daily-brief-test",
        date: TEST_DATE,
        greeting: "Bonjour William 👋",
        synthesis: "Ta journée est encore à composer.",
        recommendations: [],
      },
      true,
    );

    expect(presented.recommendations).toEqual([]);
  });
});

describe("Daily Brief integration — explainability reason codes", () => {
  it("attaches reason codes to study recommendations", () => {
    const recommendations = buildDailyBriefRecommendations({
      timeline: [makeFreeSlot()],
      date: TEST_DATE,
      planningContext: baseContext,
    });

    const study = recommendations.find((item) => item.kind === "study");
    expect(study?.explainabilityReasonCodes.length).toBeGreaterThan(0);
  });
});

describe("EPIC1-B boundaries", () => {
  it("feature flag defaults to disabled", () => {
    vi.stubEnv("VITE_EXPLAINABLE_AI", undefined);
    expect(isExplainableAiEnabled()).toBe(false);
  });

  it("React components do not translate or build reason codes", () => {
    const card = readSrc("components/dailyBrief/DailyBriefCard.tsx");
    const panel = readSrc("components/explainability/RecommendationWhyPanel.tsx");

    expect(card).not.toContain("translateExplainabilityReasons");
    expect(card).not.toContain("buildStudyExplainabilityReasonCodes");
    expect(panel).not.toContain("reasonAboutLifeProposal");
  });

  it("Daily Brief orchestrator still builds recommendations", () => {
    expect(readSrc("lib/dailyBrief/buildDailyBrief.ts")).toContain(
      "buildDailyBriefRecommendations",
    );
  });
});
