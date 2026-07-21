import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DayTimelineEntry } from "../planning/displayedDayTimeline";
import { buildHouseholdOverview } from "./buildHouseholdOverview";
import { computeMemberWorkload } from "./computeMemberWorkload";
import {
  consolidateHouseholdAvailability,
  deriveHouseholdAvailabilitySummary,
} from "./consolidateHouseholdAvailability";
import { buildMemberAvailabilityHints } from "./householdEnginePort";
import {
  clearGoalsForTests,
  createStepId,
} from "../goals/goalsStorage";
import { createUserGoal } from "../../services/goalsService";
import { isHouseholdOverviewEnabled } from "../../config/featureFlags";
import type { TaskRecord } from "../../types";
import type { MemberOverviewSnapshot } from "../../types/householdOverview";

function readSrc(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), "src", relativePath), "utf8");
}

const TEST_DATE = "2026-07-13";

function atTime(hours: number, minutes: number, durationMinutes: number): {
  startsAt: string;
  endsAt: string;
} {
  const startsAt = new Date(
    `${TEST_DATE}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`,
  );
  const endsAt = new Date(startsAt.getTime() + durationMinutes * 60_000);
  return { startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() };
}

function makeBlock(
  id: string,
  hours: number,
  durationMinutes: number,
  title = "Bloc",
): DayTimelineEntry {
  const range = atTime(hours, 0, durationMinutes);
  return {
    id,
    title,
    visualType: "study",
    blockKind: "override",
    origin: "persisted",
    calendarItemId: `ci-${id}`,
    startsAt: range.startsAt,
    endsAt: range.endsAt,
    locked: false,
    completed: false,
  };
}

function makeFreeSlot(
  id: string,
  hours: number,
  durationMinutes: number,
): DayTimelineEntry {
  const range = atTime(hours, 0, durationMinutes);
  return {
    id,
    title: "Temps libre",
    visualType: "free",
    blockKind: "free_slot",
    origin: "computed",
    startsAt: range.startsAt,
    endsAt: range.endsAt,
    locked: false,
    completed: false,
  };
}

function makeTask(
  id: string,
  memberId: string,
  status: TaskRecord["status"] = "todo",
): TaskRecord {
  return {
    id,
    household_id: "household-1",
    assigned_to: memberId,
    created_by: memberId,
    title: `Tâche ${id}`,
    description: null,
    category: "home",
    estimated_minutes: 30,
    due_at: null,
    priority: 3,
    splittable: true,
    status,
    skip_count: 0,
    created_at: "2026-07-01T10:00:00.000Z",
  };
}

function installLocalStorageMock(): void {
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
}

function makeSnapshot(
  memberId: string,
  displayName: string,
  timeline: DayTimelineEntry[],
  tasks: TaskRecord[] = [],
): MemberOverviewSnapshot {
  return {
    memberId,
    displayName,
    timeline,
    tasks,
    goals: [],
    dataAvailable: true,
  };
}

describe("EPIC3-A member workload", () => {
  it("computes scheduled time, free time and active tasks", () => {
    const workload = computeMemberWorkload({
      memberId: "user-1",
      displayName: "William",
      timeline: [
        makeBlock("b1", 9, 90),
        makeFreeSlot("free-1", 14, 120),
      ],
      tasks: [makeTask("t1", "user-1"), makeTask("t2", "user-1", "done")],
    });

    expect(workload.scheduledMinutesToday).toBe(90);
    expect(workload.freeMinutesRemaining).toBe(120);
    expect(workload.activeTaskCount).toBe(1);
  });
});

describe("EPIC3-A availability consolidation", () => {
  it("detects when everyone is busy in a window", () => {
    const windows = consolidateHouseholdAvailability([
      {
        displayName: "William",
        timeline: [makeBlock("w1", 9, 120)],
        dataAvailable: true,
      },
      {
        displayName: "Madeline",
        timeline: [makeBlock("m1", 10, 90)],
        dataAvailable: true,
      },
    ]);

    const morning = windows.find((window) => window.id === "morning");
    expect(morning?.allMembersBusy).toBe(true);
    expect(morning?.freeMemberNames).toEqual([]);
  });

  it("detects when at least one member is free", () => {
    const windows = consolidateHouseholdAvailability([
      {
        displayName: "William",
        timeline: [makeBlock("w1", 9, 120)],
        dataAvailable: true,
      },
      {
        displayName: "Madeline",
        timeline: [makeFreeSlot("free-1", 10, 90)],
        dataAvailable: true,
      },
    ]);

    const morning = windows.find((window) => window.id === "morning");
    expect(morning?.allMembersBusy).toBe(false);
    expect(morning?.freeMemberNames).toContain("Madeline");
  });
});

describe("EPIC3-A buildHouseholdOverview", () => {
  beforeEach(() => {
    installLocalStorageMock();
    clearGoalsForTests();
    vi.unstubAllEnvs();
  });

  it("handles empty household", () => {
    const overview = buildHouseholdOverview({
      householdId: "household-1",
      date: TEST_DATE,
      members: [],
    });

    expect(overview.summary.memberCount).toBe(0);
    expect(overview.members).toEqual([]);
  });

  it("handles one member", () => {
    const overview = buildHouseholdOverview({
      householdId: "household-1",
      date: TEST_DATE,
      members: [
        makeSnapshot("user-1", "William", [
          makeBlock("b1", 9, 60),
          makeFreeSlot("free-1", 14, 90),
        ]),
      ],
    });

    expect(overview.summary.memberCount).toBe(1);
    expect(overview.members[0].displayName).toBe("William");
    expect(overview.members[0].scheduledMinutesToday).toBe(60);
  });

  it("handles two members with consolidated availability", () => {
    const overview = buildHouseholdOverview({
      householdId: "household-1",
      date: TEST_DATE,
      members: [
        makeSnapshot(
          "user-1",
          "William",
          [makeBlock("w1", 9, 120)],
          [makeTask("t1", "user-1")],
        ),
        makeSnapshot(
          "user-2",
          "Madeline",
          [makeFreeSlot("m-free", 10, 120)],
          [makeTask("t2", "user-2"), makeTask("t3", "user-2")],
        ),
      ],
    });

    expect(overview.summary.memberCount).toBe(2);
    expect(overview.summary.someoneFree).toBe(true);
    expect(overview.members[1].activeTaskCount).toBe(2);

    const morning = overview.availabilityWindows.find(
      (window) => window.id === "morning",
    );
    expect(morning?.freeMemberNames).toContain("Madeline");
  });

  it("lists active goals per member without merging", () => {
    vi.stubEnv("VITE_GOALS", "true");

    const williamGoal = createUserGoal("user-1", {
      name: "Formation William",
      category: "studies",
      importance: "high",
    });
    const madelineGoal = createUserGoal("user-2", {
      name: "Formation Madeline",
      category: "studies",
      importance: "medium",
    });

    const overview = buildHouseholdOverview({
      householdId: "household-1",
      date: TEST_DATE,
      members: [
        {
          ...makeSnapshot("user-1", "William", []),
          goals: [williamGoal],
        },
        {
          ...makeSnapshot("user-2", "Madeline", []),
          goals: [madelineGoal],
        },
      ],
    });

    expect(overview.memberGoals[0].activeGoals[0].name).toBe(
      "Formation William",
    );
    expect(overview.memberGoals[1].activeGoals[0].name).toBe(
      "Formation Madeline",
    );
    expect(overview.memberGoals[0].activeGoals[0].id).not.toBe(
      overview.memberGoals[1].activeGoals[0].id,
    );
  });

  it("excludes completed goals from active list", () => {
    vi.stubEnv("VITE_GOALS", "true");

    const goal = createUserGoal("user-1", {
      name: "Objectif terminé",
      category: "studies",
      importance: "medium",
    });

    const overview = buildHouseholdOverview({
      householdId: "household-1",
      date: TEST_DATE,
      members: [
        {
          memberId: "user-1",
          displayName: "William",
          timeline: [],
          goals: [goal],
          tasks: [],
          dataAvailable: true,
        },
      ],
    });

    expect(overview.memberGoals[0].activeGoals).toHaveLength(1);

    const completedOverview = buildHouseholdOverview({
      householdId: "household-1",
      date: TEST_DATE,
      members: [
        {
          memberId: "user-1",
          displayName: "William",
          timeline: [],
          goals: [
            {
              ...goal,
              steps: [
                {
                  id: createStepId(),
                  title: "Étape",
                  order: 0,
                  taskIds: ["task-done"],
                },
              ],
            },
          ],
          tasks: [makeTask("task-done", "user-1", "done")],
          dataAvailable: true,
        },
      ],
    });

    expect(completedOverview.memberGoals[0].activeGoals).toHaveLength(0);
  });
});

describe("EPIC3-A household engine port", () => {
  it("maps member workload to availability hints", () => {
    const hints = buildMemberAvailabilityHints([
      {
        memberId: "user-1",
        displayName: "William",
        scheduledMinutesToday: 120,
        freeMinutesRemaining: 60,
        activeTaskCount: 2,
        loadLabel: "Charge modérée",
        dataAvailable: true,
      },
    ]);

    expect(hints[0].memberId).toBe("user-1");
    expect(hints[0].hint).toContain("William");
  });
});

describe("EPIC3-A boundaries", () => {
  it("feature flag defaults to disabled", () => {
    vi.stubEnv("VITE_HOUSEHOLD_OVERVIEW", undefined);
    expect(isHouseholdOverviewEnabled()).toBe(false);
  });

  it("UI components do not import orchestrator directly", () => {
    const page = readSrc("pages/HouseholdOverviewPage.tsx");
    const card = readSrc(
      "components/householdOverview/HouseholdOverviewSummaryCard.tsx",
    );

    expect(page).not.toContain("buildHouseholdOverview");
    expect(card).not.toContain("consolidateHouseholdAvailability");
  });

  it("does not create a new motor or modify contracts", () => {
    const orchestrator = readSrc("lib/householdOverview/buildHouseholdOverview.ts");
    const contract = readSrc(
      "ai/contracts/engines/household-engine.contract.ts",
    );

    expect(orchestrator).not.toContain("createEngine");
    expect(contract).not.toContain("HouseholdOverviewPage");
  });

  it("reuses analyzeDayForBrief for workload", () => {
    expect(readSrc("lib/householdOverview/computeMemberWorkload.ts")).toContain(
      "analyzeDayForBrief",
    );
  });

  it("non-regression EPIC2 goals remain present", () => {
    expect(readSrc("services/goalsService.ts")).toContain("getUserGoals");
    expect(readSrc("lib/goals/buildGoalBriefInsight.ts")).toContain(
      "buildGoalBriefInsight",
    );
  });

  it("non-regression EPIC1 daily brief remains present", () => {
    expect(readSrc("lib/dailyBrief/buildDailyBrief.ts")).toContain(
      "buildDailyBrief",
    );
  });

  it("deriveHouseholdAvailabilitySummary is deterministic", () => {
    const summary = deriveHouseholdAvailabilitySummary(
      [
        {
          id: "morning",
          label: "Matin",
          allMembersBusy: true,
          freeMemberNames: [],
        },
      ],
      [
        {
          freeMinutesRemaining: 10,
          dataAvailable: true,
        },
      ],
    );

    expect(summary.allMembersBusy).toBe(true);
    expect(summary.someoneFree).toBe(false);
  });
});
