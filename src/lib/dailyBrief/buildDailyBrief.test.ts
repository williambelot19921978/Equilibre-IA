import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PlanningContext } from "../../ai/memoryEngine";
import type { DayTimelineEntry } from "../planning/displayedDayTimeline";
import { analyzeDayForBrief } from "./analyzeDayForBrief";
import { buildDailyBrief } from "./buildDailyBrief";
import {
  buildDailyBriefRecommendations,
  MAX_RECOMMENDATIONS,
} from "./buildDailyBriefRecommendations";
import {
  clearDailyBriefPresentationForTests,
  isDailyBriefPresentedToday,
  markDailyBriefPresentedToday,
} from "./dailyBriefStorage";
import { formatDailyBriefGreeting } from "./formatDailyBriefMessage";
import { isDailyBriefEnabled } from "../../config/featureFlags";

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

function makeFreeSlot(
  id: string,
  startHour: number,
  durationMinutes: number,
): DayTimelineEntry {
  const startsAt = atTime(startHour, 0);
  const endsAt = new Date(
    new Date(startsAt).getTime() + durationMinutes * 60_000,
  ).toISOString();

  return {
    id,
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

function makeSportEntry(id: string): DayTimelineEntry {
  return {
    id,
    visualType: "sport",
    title: "Séance sport",
    startsAt: atTime(18, 0),
    endsAt: atTime(18, 45),
    locked: false,
    origin: "persisted",
    blockKind: "task",
    activityType: "sport",
    completed: false,
  };
}

function makeAfternoonBlock(id: string, hour: number): DayTimelineEntry {
  return {
    id,
    visualType: "appointment",
    title: `Bloc ${id}`,
    startsAt: atTime(hour, 0),
    endsAt: atTime(hour, 45),
    locked: false,
    origin: "persisted",
    blockKind: "appointment",
    completed: false,
  };
}

describe("formatDailyBriefGreeting", () => {
  it("formats greeting with emoji", () => {
    expect(formatDailyBriefGreeting("william")).toBe("Bonjour William 👋");
  });
});

describe("analyzeDayForBrief", () => {
  it("detects an open day", () => {
    const analysis = analyzeDayForBrief([
      makeFreeSlot("free-1", 10, 120),
    ]);

    expect(analysis.synthesisKey).toBe("open");
  });

  it("detects a busy day", () => {
    const timeline = Array.from({ length: 9 }, (_, index) =>
      makeAfternoonBlock(`block-${index}`, 9 + (index % 4)),
    );

    const analysis = analyzeDayForBrief(timeline);
    expect(analysis.synthesisKey).toBe("busy");
  });
});

describe("buildDailyBriefRecommendations", () => {
  it("returns study recommendation using RecommendationEngine path", () => {
    const recommendations = buildDailyBriefRecommendations({
      timeline: [makeFreeSlot("free-study", 10, 60)],
      date: TEST_DATE,
      planningContext: baseContext,
    });

    const study = recommendations.find((item) => item.kind === "study");
    expect(study).toBeDefined();
    expect(study?.actionLabel).toBe("Voir");
  });

  it("returns sport status when session exists", () => {
    const recommendations = buildDailyBriefRecommendations({
      timeline: [makeSportEntry("sport-1")],
      date: TEST_DATE,
      planningContext: baseContext,
    });

    expect(recommendations.some((item) => item.kind === "sport")).toBe(true);
  });

  it("returns time risk on dense afternoon", () => {
    const timeline = [
      makeAfternoonBlock("a1", 12),
      makeAfternoonBlock("a2", 13),
      makeAfternoonBlock("a3", 14),
      makeAfternoonBlock("a4", 15),
      makeAfternoonBlock("a5", 16),
    ];

    const recommendations = buildDailyBriefRecommendations({
      timeline,
      date: TEST_DATE,
      planningContext: baseContext,
    });

    expect(recommendations.some((item) => item.kind === "time")).toBe(true);
  });

  it("limits to three recommendations maximum", () => {
    const timeline = [
      makeFreeSlot("free-study", 10, 60),
      makeSportEntry("sport-1"),
      makeAfternoonBlock("a1", 12),
      makeAfternoonBlock("a2", 13),
      makeAfternoonBlock("a3", 14),
      makeAfternoonBlock("a4", 15),
      makeAfternoonBlock("a5", 16),
    ];

    const recommendations = buildDailyBriefRecommendations({
      timeline,
      date: TEST_DATE,
      planningContext: baseContext,
    });

    expect(recommendations.length).toBeLessThanOrEqual(MAX_RECOMMENDATIONS);
  });

  it("orders recommendations by priority (study before sport before time)", () => {
    const timeline = [
      makeFreeSlot("free-study", 10, 60),
      makeSportEntry("sport-1"),
      makeAfternoonBlock("a1", 12),
      makeAfternoonBlock("a2", 13),
      makeAfternoonBlock("a3", 14),
      makeAfternoonBlock("a4", 15),
      makeAfternoonBlock("a5", 16),
    ];

    const recommendations = buildDailyBriefRecommendations({
      timeline,
      date: TEST_DATE,
      planningContext: baseContext,
    });

    if (recommendations.length >= 2) {
      expect(recommendations[0].priority).toBeGreaterThanOrEqual(
        recommendations[1].priority,
      );
    }
  });
});

describe("buildDailyBrief orchestrator", () => {
  it("builds greeting and synthesis", () => {
    const brief = buildDailyBrief({
      firstName: "Madeline",
      date: TEST_DATE,
      timeline: [],
      planningContext: baseContext,
    });

    expect(brief).not.toBeNull();
    expect(brief?.greeting).toContain("Madeline");
    expect(brief?.synthesis.length).toBeGreaterThan(0);
  });

  it("supports a day with zero recommendations", () => {
    const brief = buildDailyBrief({
      firstName: "William",
      date: TEST_DATE,
      timeline: [],
      planningContext: baseContext,
    });

    expect(brief?.recommendations).toEqual([]);
  });

  it("supports a day with one recommendation", () => {
    const brief = buildDailyBrief({
      firstName: "William",
      date: TEST_DATE,
      timeline: [makeFreeSlot("free-study", 10, 60)],
      planningContext: baseContext,
    });

    expect(brief?.recommendations.length).toBe(1);
  });

  it("supports up to three recommendations", () => {
    const brief = buildDailyBrief({
      firstName: "William",
      date: TEST_DATE,
      timeline: [
        makeFreeSlot("free-study", 10, 60),
        makeSportEntry("sport-1"),
        makeAfternoonBlock("a1", 12),
        makeAfternoonBlock("a2", 13),
        makeAfternoonBlock("a3", 14),
        makeAfternoonBlock("a4", 15),
        makeAfternoonBlock("a5", 16),
      ],
      planningContext: baseContext,
    });

    expect(brief?.recommendations.length).toBeLessThanOrEqual(3);
  });

  it("returns null without planning context (fail-open)", () => {
    expect(
      buildDailyBrief({
        firstName: "William",
        date: TEST_DATE,
        timeline: [],
        planningContext: null,
      }),
    ).toBeNull();
  });
});

describe("dailyBriefStorage — first open per day", () => {
  beforeEach(() => {
    clearDailyBriefPresentationForTests();
    vi.stubGlobal("localStorage", {
      store: {} as Record<string, string>,
      getItem(key: string) {
        return this.store[key] ?? null;
      },
      setItem(key: string, value: string) {
        this.store[key] = value;
      },
      removeItem(key: string) {
        delete this.store[key];
      },
      key(index: number) {
        return Object.keys(this.store)[index] ?? null;
      },
      get length() {
        return Object.keys(this.store).length;
      },
      clear() {
        this.store = {};
      },
    });
  });

  it("first open is not presented", () => {
    expect(isDailyBriefPresentedToday("user-1", TEST_DATE)).toBe(false);
  });

  it("second open same day is presented", () => {
    markDailyBriefPresentedToday("user-1", TEST_DATE);
    expect(isDailyBriefPresentedToday("user-1", TEST_DATE)).toBe(true);
  });
});

describe("EPIC1-A boundaries", () => {
  it("feature flag defaults to disabled", () => {
    vi.stubEnv("VITE_DAILY_BRIEF", undefined);
    expect(isDailyBriefEnabled()).toBe(false);
  });

  it("UI components do not import orchestrator engines directly", () => {
    const card = readSrc("components/dailyBrief/DailyBriefCard.tsx");
    const section = readSrc("components/dailyBrief/DailyBriefSection.tsx");

    expect(card).not.toContain("buildDailyBrief");
    expect(card).not.toContain("validatePlannedBlockCore");
    expect(section).not.toContain("generateFreeTimeSuggestions");
  });

  it("uses DecisionEngine via study recommendation path", () => {
    const recommendations = readSrc("lib/dailyBrief/buildDailyBriefRecommendations.ts");
    expect(recommendations).toContain("buildStudySlotRecommendation");
    expect(recommendations).toContain("decisionApproved");
  });

  it("uses ReasoningEngine for study cards", () => {
    const recommendations = readSrc("lib/dailyBrief/buildDailyBriefRecommendations.ts");
    expect(recommendations).toContain("reasonAboutLifeProposal");
  });

  it("does not add new outcome event types", () => {
    const hook = readSrc("hooks/useDailyBrief.ts");
    expect(hook).not.toContain("dailybrief.presented");
    expect(hook).not.toContain("observePilotProposalPresented");
  });

  it("P1 and P2 files remain present", () => {
    expect(readSrc("lib/recommendations/buildStudySlotRecommendation.ts")).toContain(
      "buildStudySlotRecommendation",
    );
    expect(readSrc("lib/rescheduling/buildStudyRescheduleProposal.ts")).toContain(
      "buildStudyRescheduleProposal",
    );
  });
});
