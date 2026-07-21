import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildHouseholdOverview } from "../householdOverview/buildHouseholdOverview";
import { buildHouseholdOpportunities } from "./buildHouseholdOpportunities";
import { presentHouseholdOpportunity } from "./presentHouseholdOpportunity";
import { clearGoalsForTests } from "../goals/goalsStorage";
import {
  addGoalStep,
  createUserGoal,
  updateGoalStep,
} from "../../services/goalsService";
import {
  isHouseholdOpportunitiesEnabled,
  isHouseholdOverviewEnabled,
} from "../../config/featureFlags";
import type { DayTimelineEntry } from "../planning/displayedDayTimeline";
import type { TaskRecord } from "../../types";
import type { MemberOverviewSnapshot } from "../../types/householdOverview";
import { MAX_HOUSEHOLD_OPPORTUNITIES } from "../../types/householdOpportunity";

function readSrc(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), "src", relativePath), "utf8");
}

const TEST_DATE = "2026-07-13";

function atTime(hours: number, durationMinutes: number) {
  const startsAt = new Date(
    `${TEST_DATE}T${String(hours).padStart(2, "0")}:00:00`,
  );
  const endsAt = new Date(startsAt.getTime() + durationMinutes * 60_000);
  return { startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() };
}

function makeBlock(id: string, hours: number, durationMinutes: number): DayTimelineEntry {
  const range = atTime(hours, durationMinutes);
  return {
    id,
    title: "Bloc",
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

function makeFreeSlot(id: string, hours: number, durationMinutes: number): DayTimelineEntry {
  const range = atTime(hours, durationMinutes);
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
  lastCompletedAt?: string | null,
): TaskRecord {
  return {
    id,
    household_id: "household-1",
    assigned_to: memberId,
    created_by: memberId,
    title: `Tâche ${id}`,
    description: null,
    category: "studies",
    estimated_minutes: 30,
    due_at: null,
    priority: 3,
    splittable: true,
    status,
    skip_count: 0,
    created_at: "2026-06-01T10:00:00.000Z",
    updated_at: "2026-07-01T10:00:00.000Z",
    last_completed_at: lastCompletedAt ?? null,
  };
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

function buildFromSnapshots(snapshots: MemberOverviewSnapshot[]) {
  const overview = buildHouseholdOverview({
    householdId: "household-1",
    date: TEST_DATE,
    members: snapshots,
  });

  return {
    overview,
    opportunities: buildHouseholdOpportunities({
      overview,
      memberSnapshots: snapshots,
    }),
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

describe("EPIC3-B buildHouseholdOpportunities", () => {
  beforeEach(() => {
    installLocalStorageMock();
    clearGoalsForTests();
    vi.unstubAllEnvs();
    vi.stubEnv("VITE_GOALS", "true");
  });

  it("returns no opportunities for empty household", () => {
    const { opportunities } = buildFromSnapshots([]);
    expect(opportunities).toEqual([]);
  });

  it("returns no opportunities for one member", () => {
    const { opportunities } = buildFromSnapshots([
      makeSnapshot("user-1", "William", [makeFreeSlot("f1", 10, 120)]),
    ]);
    expect(opportunities).toEqual([]);
  });

  it("detects load imbalance when one member is free and another is heavy", () => {
    const { opportunities } = buildFromSnapshots([
      makeSnapshot("user-1", "William", [makeFreeSlot("w-free", 10, 150)]),
      makeSnapshot("user-2", "Madeline", [
        makeBlock("m1", 8, 120),
        makeBlock("m2", 10, 120),
        makeBlock("m3", 13, 120),
      ]),
    ]);

    const opp = opportunities.find((item) => item.kind === "load_imbalance");
    expect(opp).toBeDefined();
    expect(opp?.explanation).toContain("William");
    expect(opp?.explanation).toContain("Madeline");
    expect(opp?.explanation).not.toMatch(/doit/i);
  });

  it("detects shared free time window", () => {
    const { opportunities } = buildFromSnapshots([
      makeSnapshot("user-1", "William", [makeFreeSlot("w-free", 14, 120)]),
      makeSnapshot("user-2", "Madeline", [makeFreeSlot("m-free", 14, 120)]),
    ]);

    const opp = opportunities.find((item) => item.kind === "shared_free_time");
    expect(opp).toBeDefined();
    expect(opp?.explanation).toMatch(/Vous pourriez/i);
  });

  it("detects when both members are very busy", () => {
    const heavyDay = [
      makeBlock("b1", 8, 120),
      makeBlock("b2", 10, 120),
      makeBlock("b3", 13, 120),
      makeBlock("b4", 15, 120),
    ];

    const { opportunities } = buildFromSnapshots([
      makeSnapshot("user-1", "William", heavyDay),
      makeSnapshot("user-2", "Madeline", heavyDay),
    ]);

    const opp = opportunities.find((item) => item.kind === "both_busy");
    expect(opp).toBeDefined();
    expect(opp?.explanation).toMatch(/Il pourrait être utile/i);
  });

  it("detects stale goal with available support member", () => {
    const goal = createUserGoal("user-2", {
      name: "Formation naturopathie",
      category: "studies",
      importance: "high",
    });
    const withStep = addGoalStep("user-2", goal.id, "Module 3");
    const stepId = withStep!.steps[0].id;
    const linked = updateGoalStep("user-2", goal.id, stepId, {
      taskIds: ["task-stale", "task-todo"],
    });

    const { opportunities } = buildFromSnapshots([
      makeSnapshot("user-1", "William", [makeFreeSlot("w-free", 10, 150)]),
      {
        ...makeSnapshot("user-2", "Madeline", [makeBlock("m1", 9, 60)], [
          makeTask("task-stale", "user-2", "done", "2026-07-01T09:00:00.000Z"),
          makeTask("task-todo", "user-2", "todo"),
        ]),
        goals: [linked!],
      },
    ]);

    const opp = opportunities.find((item) => item.kind === "stale_goal_support");
    expect(opp).toBeDefined();
    expect(opp?.explanation).toContain("Formation naturopathie");
    expect(opp?.explanation).not.toMatch(/doit/i);
  });

  it("returns at most three opportunities", () => {
    const heavyDay = [
      makeBlock("b1", 8, 120),
      makeBlock("b2", 10, 120),
      makeBlock("b3", 13, 120),
      makeBlock("b4", 15, 120),
    ];

    const goal = createUserGoal("user-2", {
      name: "Objectif bloqué",
      category: "studies",
      importance: "high",
    });
    const withStep = addGoalStep("user-2", goal.id, "Étape");
    const linked = updateGoalStep("user-2", goal.id, withStep!.steps[0].id, {
      taskIds: ["task-old"],
    });

    const { opportunities } = buildFromSnapshots([
      makeSnapshot("user-1", "William", [makeFreeSlot("w-free", 14, 120)]),
      {
        ...makeSnapshot("user-2", "Madeline", heavyDay, [
          makeTask("task-old", "user-2", "done", "2026-07-01T09:00:00.000Z"),
        ]),
        goals: [linked!],
      },
    ]);

    expect(opportunities.length).toBeLessThanOrEqual(MAX_HOUSEHOLD_OPPORTUNITIES);
  });

  it("returns no opportunities on a balanced calm day", () => {
    const { opportunities } = buildFromSnapshots([
      makeSnapshot("user-1", "William", [makeFreeSlot("w1", 10, 90)]),
      makeSnapshot("user-2", "Madeline", [makeFreeSlot("m1", 11, 90)]),
    ]);

    const kinds = opportunities.map((item) => item.kind);
    expect(kinds).not.toContain("both_busy");
    expect(kinds).not.toContain("load_imbalance");
  });
});

describe("EPIC3-B presentation", () => {
  it("builds why reasons with context labels and explainability", () => {
    vi.stubEnv("VITE_EXPLAINABLE_AI", "true");

    const presented = presentHouseholdOpportunity(
      {
        id: "opp-1",
        kind: "load_imbalance",
        title: "Test",
        explanation: "Il pourrait être utile de...",
        explainabilityReasonCodes: [
          "HOUSEHOLD_MEMBER_AVAILABLE",
          "NO_CONFLICT",
        ],
        contextLabels: ["William est disponible", "Madeline a peu de temps libre"],
        priority: 80,
      },
      true,
    );

    expect(presented.whyReasons.length).toBeGreaterThan(0);
    expect(presented.whyReasons.some((line) => line.includes("William"))).toBe(
      true,
    );
  });
});

describe("EPIC3-B boundaries", () => {
  it("opportunities feature flag defaults to disabled", () => {
    vi.stubEnv("VITE_HOUSEHOLD_OPPORTUNITIES", undefined);
    expect(isHouseholdOpportunitiesEnabled()).toBe(false);
  });

  it("overview feature flag still defaults to disabled", () => {
    vi.stubEnv("VITE_HOUSEHOLD_OVERVIEW", undefined);
    expect(isHouseholdOverviewEnabled()).toBe(false);
  });

  it("UI does not import orchestrator directly", () => {
    const card = readSrc("components/householdOverview/HouseholdOpportunityCard.tsx");
    expect(card).not.toContain("buildHouseholdOpportunities");
  });

  it("does not create a new motor", () => {
    const orchestrator = readSrc(
      "lib/householdOpportunities/buildHouseholdOpportunities.ts",
    );
    expect(orchestrator).toContain("computeGoalWeightsFromUserGoals");
    expect(orchestrator).toContain("HouseholdOverview");
  });

  it("reuses goal engine port for stale goal priority", () => {
    expect(
      readSrc("lib/householdOpportunities/buildHouseholdOpportunities.ts"),
    ).toContain("computeGoalWeightsFromUserGoals");
  });

  it("non-regression EPIC3-A overview remains present", () => {
    expect(readSrc("lib/householdOverview/buildHouseholdOverview.ts")).toContain(
      "buildHouseholdOverview",
    );
  });

  it("non-regression explainability layer remains present", () => {
    expect(readSrc("lib/explainability/presentExplainabilityReasons.ts")).toContain(
      "presentExplainabilityReasons",
    );
  });
});
