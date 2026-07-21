import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

import type { PlanningContext } from "../../ai/memoryEngine";
import type { DayTimelineEntry } from "../planning/displayedDayTimeline";
import { buildDailyBrief } from "./buildDailyBrief";
import { buildDailyBriefRecommendationSignature } from "./dailyBriefRecommendationSignature";
import { buildDailyBriefTimelineSignature } from "./dailyBriefTimelineSignature";
import { formatUnderControlSynthesis } from "./formatDailyBriefUpdateHint";
import { refreshAdaptiveDailyBrief } from "./refreshAdaptiveDailyBrief";
import { presentDailyBrief } from "../explainability/presentDailyBrief";
import { isDynamicDailyBriefEnabled } from "../../config/featureFlags";

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
  id = "free-study",
  startHour = 10,
  durationMinutes = 60,
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

function makeTaskEntry(
  id: string,
  startHour: number,
  endHour: number,
  completed = false,
): DayTimelineEntry {
  return {
    id,
    visualType: "task",
    title: "Révision",
    startsAt: atTime(startHour, 0),
    endsAt: atTime(endHour, 0),
    locked: false,
    origin: "persisted",
    blockKind: "task",
    activityType: "revision",
    completed,
  };
}

function makeSportEntry(id = "sport-1"): DayTimelineEntry {
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

function buildBrief(timeline: DayTimelineEntry[]) {
  return buildDailyBrief({
    firstName: "William",
    date: TEST_DATE,
    timeline,
    planningContext: baseContext,
  });
}

function refreshSequence(
  timelines: DayTimelineEntry[][],
  now = new Date("2026-07-13T12:00:00"),
) {
  let state = null as ReturnType<typeof refreshAdaptiveDailyBrief> | null;
  let previousSignature: string | null = null;

  for (const timeline of timelines) {
    const candidate = buildBrief(timeline);
    expect(candidate).not.toBeNull();
    if (!candidate) continue;

    const signature = buildDailyBriefTimelineSignature(timeline);
    const timelineChanged =
      previousSignature !== null && previousSignature !== signature;

    state = refreshAdaptiveDailyBrief({
      previous: state,
      candidate,
      timelineChanged,
      now,
    });

    previousSignature = signature;
  }

  return state;
}

describe("refreshAdaptiveDailyBrief", () => {
  it("does not show update hint on first render", () => {
    const brief = buildBrief([makeFreeSlot()]);
    expect(brief).not.toBeNull();
    if (!brief) return;

    const state = refreshAdaptiveDailyBrief({
      previous: null,
      candidate: brief,
      timelineChanged: false,
    });

    expect(state.showUpdatedHint).toBe(false);
  });

  it("keeps recommendations when timeline changes but they remain valid", () => {
    const timelineA = [makeFreeSlot("free-study")];
    const timelineB = [
      makeFreeSlot("free-study"),
      makeTaskEntry("noise-task", 19, 19, false),
    ];

    const first = buildBrief(timelineA);
    expect(first).not.toBeNull();
    if (!first) return;

    const initial = refreshAdaptiveDailyBrief({
      previous: null,
      candidate: first,
      timelineChanged: false,
    });

    const secondCandidate = buildBrief(timelineB);
    expect(secondCandidate).not.toBeNull();
    if (!secondCandidate) return;

    const refreshed = refreshAdaptiveDailyBrief({
      previous: initial,
      candidate: secondCandidate,
      timelineChanged: true,
    });

    expect(refreshed.showUpdatedHint).toBe(false);
    expect(refreshed.brief.recommendations[0]?.id).toBe(
      initial.brief.recommendations[0]?.id,
    );
  });

  it("updates when a task is added and study slot disappears", () => {
    const state = refreshSequence([
      [makeFreeSlot("free-morning", 10)],
      [makeTaskEntry("blocker", 9, 21), makeTaskEntry("extra", 9, 10)],
    ]);

    expect(state?.showUpdatedHint).toBe(true);
  });

  it("updates when a task is removed and a new study slot appears", () => {
    const state = refreshSequence([
      [makeTaskEntry("blocker", 10, 12)],
      [makeFreeSlot("new-free")],
    ]);

    expect(state?.showUpdatedHint).toBe(true);
    expect(state?.brief.recommendations.some((item) => item.kind === "study")).toBe(
      true,
    );
  });

  it("updates when a task is moved and recommendations change", () => {
    const state = refreshSequence([
      [makeFreeSlot("free-morning", 10)],
      [makeFreeSlot("free-afternoon", 15, 45)],
    ]);

    expect(state?.showUpdatedHint).toBe(true);
  });

  it("updates when a task is completed", () => {
    const state = refreshSequence([
      [makeSportEntry()],
      [{ ...makeSportEntry(), completed: true }],
    ]);

    expect(state?.showUpdatedHint).toBe(true);
  });

  it("updates when a task is cancelled via timeline removal", () => {
    const state = refreshSequence([
      [makeSportEntry(), makeFreeSlot()],
      [makeFreeSlot()],
    ]);

    expect(state?.showUpdatedHint).toBe(true);
  });

  it("shows under-control synthesis when no recommendations remain", () => {
    const state = refreshSequence([
      [makeFreeSlot()],
      [makeTaskEntry("filled", 9, 21)],
    ]);

    expect(state?.brief.recommendations).toEqual([]);
    expect(state?.brief.synthesis).toBe(formatUnderControlSynthesis());
  });

  it("refreshes explainability reasons with the current recommendation", () => {
    const before = buildBrief([makeFreeSlot()]);
    const after = buildBrief([makeSportEntry()]);

    expect(before).not.toBeNull();
    expect(after).not.toBeNull();
    if (!before || !after) return;

    const initial = refreshAdaptiveDailyBrief({
      previous: null,
      candidate: before,
      timelineChanged: false,
    });

    const updated = refreshAdaptiveDailyBrief({
      previous: initial,
      candidate: after,
      timelineChanged: true,
    });

    const presented = presentDailyBrief(updated.brief, true);
    const studyReasons =
      presentDailyBrief(before, true).recommendations[0]?.whyReasons ?? [];
    const currentReasons = presented.recommendations[0]?.whyReasons ?? [];

    expect(studyReasons.join(" ")).not.toEqual(currentReasons.join(" "));
    expect(currentReasons.length).toBeGreaterThan(0);
  });
});

describe("timeline signature — reused planning mutations", () => {
  it("changes signature on add, move, complete, delete", () => {
    const base = [makeFreeSlot()];
    const added = [...base, makeTaskEntry("added", 11, 12)];
    const moved = [...base, makeTaskEntry("added", 13, 14)];
    const completed = [
      ...base,
      { ...makeTaskEntry("added", 13, 14), completed: true },
    ];
    const removed = [...base];

    const signatures = new Set([
      buildDailyBriefTimelineSignature(base),
      buildDailyBriefTimelineSignature(added),
      buildDailyBriefTimelineSignature(moved),
      buildDailyBriefTimelineSignature(completed),
    ]);

    expect(signatures.size).toBeGreaterThan(2);
    expect(buildDailyBriefTimelineSignature(removed)).toBe(
      buildDailyBriefTimelineSignature(base),
    );
  });
});

describe("EPIC1-C boundaries", () => {
  it("feature flag defaults to disabled", () => {
    vi.stubEnv("VITE_DYNAMIC_DAILY_BRIEF", undefined);
    expect(isDynamicDailyBriefEnabled()).toBe(false);
  });

  it("React components do not implement refresh logic", () => {
    const section = readSrc("components/dailyBrief/DailyBriefSection.tsx");
    const card = readSrc("components/dailyBrief/DailyBriefCard.tsx");
    expect(section).not.toContain("refreshAdaptiveDailyBrief");
    expect(card).not.toContain("refreshAdaptiveDailyBrief");
  });

  it("hook delegates refresh to orchestrator", () => {
    const hook = readSrc("hooks/useDailyBrief.ts");
    expect(hook).toContain("refreshAdaptiveDailyBrief");
    expect(hook).toContain("buildDailyBriefTimelineSignature");
  });

  it("EPIC1-A buildDailyBrief remains unchanged entry point", () => {
    expect(readSrc("lib/dailyBrief/buildDailyBrief.ts")).toContain(
      "buildDailyBriefRecommendations",
    );
  });

  it("EPIC1-B signatures stay aligned with explainability codes", () => {
    const brief = buildBrief([makeFreeSlot()]);
    expect(brief?.recommendations[0]).toBeDefined();
    if (!brief?.recommendations[0]) return;

    expect(buildDailyBriefRecommendationSignature(brief.recommendations[0])).toContain(
      "study",
    );
    expect(brief.recommendations[0].explainabilityReasonCodes.length).toBeGreaterThan(
      0,
    );
  });
});
