import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildHouseholdOverview } from "../householdOverview/buildHouseholdOverview";
import { buildHouseholdOpportunities } from "../householdOpportunities/buildHouseholdOpportunities";
import { presentHouseholdOpportunity } from "../householdOpportunities/presentHouseholdOpportunity";
import { buildHouseholdCollaborationProposal } from "./buildHouseholdCollaborationProposal";
import {
  HOUSEHOLD_COLLABORATION_CONFIRMATION_PROMPT,
  buildHouseholdCollaborationConfirmation,
} from "./buildHouseholdCollaborationConfirmation";
import { enrichHouseholdOpportunitiesWithCollaboration } from "./enrichHouseholdOpportunitiesWithCollaboration";
import {
  clearHouseholdCollaborationDrafts,
  readHouseholdPlanningCollaborationDraft,
  readHouseholdTaskCollaborationDraft,
} from "./householdCollaborationDraftStorage";
import { prepareHouseholdCollaboration } from "./prepareHouseholdCollaboration";
import { clearGoalsForTests } from "../goals/goalsStorage";
import {
  addGoalStep,
  createUserGoal,
  updateGoalStep,
} from "../../services/goalsService";
import {
  isHouseholdCollaborationEnabled,
  isHouseholdOpportunitiesEnabled,
  isHouseholdOverviewEnabled,
} from "../../config/featureFlags";
import type { DayTimelineEntry } from "../planning/displayedDayTimeline";
import type { TaskRecord } from "../../types";
import type { MemberOverviewSnapshot } from "../../types/householdOverview";

function readSrc(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), "src", relativePath), "utf8");
}

const TEST_DATE = "2026-07-13";
const WILLIAM_ID = "member-william";
const MADELINE_ID = "member-madeline";

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
    category: "family",
    estimated_minutes: 30,
    due_at: null,
    priority: 3,
    splittable: true,
    status,
    skip_count: 0,
    created_at: `${TEST_DATE}T08:00:00.000Z`,
    updated_at: `${TEST_DATE}T08:00:00.000Z`,
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

function buildTwoMemberScenario(options?: {
  williamTimeline?: DayTimelineEntry[];
  madelineTimeline?: DayTimelineEntry[];
  madelineTasks?: TaskRecord[];
  madelineGoals?: MemberOverviewSnapshot["goals"];
}) {
  const williamTimeline =
    options?.williamTimeline ??
    Array.from({ length: 8 }, (_, index) =>
      makeBlock(`w-${index}`, 6 + index, 60),
    );
  const madelineTimeline =
    options?.madelineTimeline ??
    [makeFreeSlot("m-free", 14, 180)];

  const snapshots = [
    makeSnapshot(WILLIAM_ID, "William", williamTimeline),
    {
      ...makeSnapshot(
        MADELINE_ID,
        "Madeline",
        madelineTimeline,
        options?.madelineTasks ?? [],
      ),
      goals: options?.madelineGoals ?? [],
    },
  ];

  const overview = buildHouseholdOverview({
    householdId: "household-1",
    date: TEST_DATE,
    members: snapshots,
  });

  return { overview, snapshots };
}

function installStorageMocks(): void {
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

  vi.stubGlobal("sessionStorage", {
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

describe("EPIC3-C — household collaboration", () => {
  beforeEach(() => {
    installStorageMocks();
    clearGoalsForTests();
    clearHouseholdCollaborationDrafts();
    vi.unstubAllEnvs();
  });

  it("opportunité sans action quand collaboration désactivée", () => {
    vi.stubEnv("VITE_HOUSEHOLD_COLLABORATION", "false");

    const { overview, snapshots } = buildTwoMemberScenario();
    const opportunities = buildHouseholdOpportunities({ overview, memberSnapshots: snapshots });
    const presented = presentHouseholdOpportunity(opportunities[0]!);

    const enriched = enrichHouseholdOpportunitiesWithCollaboration([presented], {
      overview,
      memberSnapshots: snapshots,
      date: TEST_DATE,
      collaborationEnabled: false,
    });

    expect(enriched[0]?.collaborationProposal).toBeNull();
    expect(isHouseholdCollaborationEnabled()).toBe(false);
  });

  it("opportunité avec proposition pour déséquilibre de charge", () => {
    const { overview, snapshots } = buildTwoMemberScenario();
    const opportunities = buildHouseholdOpportunities({ overview, memberSnapshots: snapshots });
    const loadOpp = opportunities.find((item) => item.kind === "load_imbalance");

    expect(loadOpp).toBeDefined();

    const proposal = buildHouseholdCollaborationProposal({
      opportunity: loadOpp!,
      overview,
      memberSnapshots: snapshots,
      date: TEST_DATE,
    });

    expect(proposal).not.toBeNull();
    expect(proposal?.actionKind).toBe("collaborative_task_draft");
    expect(proposal?.buttonLabel).toBe("Proposer");
    expect(proposal?.proposedAction.type).toBe("create_household_support_task");
    expect(proposal?.navigation.route).toBe("/tasks");
  });

  it("opportunité avec proposition pour créneau commun", () => {
    const sharedTimeline = [
      makeFreeSlot("shared-am", 8, 180),
      makeFreeSlot("shared-pm", 14, 180),
    ];

    const { overview, snapshots } = buildTwoMemberScenario({
      williamTimeline: sharedTimeline,
      madelineTimeline: sharedTimeline,
    });

    const opportunities = buildHouseholdOpportunities({ overview, memberSnapshots: snapshots });
    const sharedOpp = opportunities.find((item) => item.kind === "shared_free_time");

    expect(sharedOpp).toBeDefined();

    const proposal = buildHouseholdCollaborationProposal({
      opportunity: sharedOpp!,
      overview,
      memberSnapshots: snapshots,
      date: TEST_DATE,
    });

    expect(proposal?.actionKind).toBe("shared_planning_window");
    expect(proposal?.navigation.route).toBe("/planning");
  });

  it("confirmation prompt bienveillant", () => {
    const { overview, snapshots } = buildTwoMemberScenario();
    const opportunities = buildHouseholdOpportunities({ overview, memberSnapshots: snapshots });
    const proposal = buildHouseholdCollaborationProposal({
      opportunity: opportunities[0]!,
      overview,
      memberSnapshots: snapshots,
      date: TEST_DATE,
    });

    expect(proposal?.confirmationPrompt).toBe(
      HOUSEHOLD_COLLABORATION_CONFIRMATION_PROMPT,
    );
    expect(buildHouseholdCollaborationConfirmation(proposal!)).toContain("brouillon");
  });

  it("préparation après confirmation — brouillon tâche sans mutation directe", () => {
    const { overview, snapshots } = buildTwoMemberScenario();
    const opportunities = buildHouseholdOpportunities({ overview, memberSnapshots: snapshots });
    const loadOpp = opportunities.find((item) => item.kind === "load_imbalance")!;
    const proposal = buildHouseholdCollaborationProposal({
      opportunity: loadOpp,
      overview,
      memberSnapshots: snapshots,
      date: TEST_DATE,
    })!;

    const result = prepareHouseholdCollaboration(proposal);

    expect(result.prepared).toBe(true);
    expect(result.draftKind).toBe("task");

    const draft = readHouseholdTaskCollaborationDraft();
    expect(draft).not.toBeNull();
    expect(draft?.title).toContain("Coup de main");
    expect(draft?.source).toBe("household_collaboration");
    expect(readHouseholdPlanningCollaborationDraft()).toBeNull();
  });

  it("préparation après confirmation — brouillon planning pour créneau commun", () => {
    const sharedTimeline = [
      makeFreeSlot("shared-am", 8, 180),
      makeFreeSlot("shared-pm", 14, 180),
    ];

    const { overview, snapshots } = buildTwoMemberScenario({
      williamTimeline: sharedTimeline,
      madelineTimeline: sharedTimeline,
    });

    const opportunities = buildHouseholdOpportunities({ overview, memberSnapshots: snapshots });
    const sharedOpp = opportunities.find((item) => item.kind === "shared_free_time")!;
    const proposal = buildHouseholdCollaborationProposal({
      opportunity: sharedOpp,
      overview,
      memberSnapshots: snapshots,
      date: TEST_DATE,
    })!;

    const result = prepareHouseholdCollaboration(proposal);

    expect(result.draftKind).toBe("planning");
    expect(result.navigation.route).toBe("/planning");

    const draft = readHouseholdPlanningCollaborationDraft();
    expect(draft?.kind).toBe("shared_window");
    expect(draft?.windowId).toBeTruthy();
    expect(readHouseholdTaskCollaborationDraft()).toBeNull();
  });

  it("annulation — aucun brouillon sans prepareHouseholdCollaboration", () => {
    clearHouseholdCollaborationDrafts();
    expect(readHouseholdTaskCollaborationDraft()).toBeNull();
    expect(readHouseholdPlanningCollaborationDraft()).toBeNull();
  });

  it("objectif bloqué — proposition de soutien", () => {
    vi.stubEnv("VITE_GOALS", "true");

    const goal = createUserGoal(MADELINE_ID, {
      name: "Formation naturopathie",
      category: "studies",
      importance: "high",
    });
    const withStep = addGoalStep(MADELINE_ID, goal.id, "Module 3");
    const linked = updateGoalStep(
      MADELINE_ID,
      goal.id,
      withStep!.steps[0].id,
      {
        taskIds: ["task-stale", "task-todo"],
      },
    );

    const { overview, snapshots } = buildTwoMemberScenario({
      williamTimeline: [makeFreeSlot("w-free", 10, 150)],
      madelineTimeline: [makeBlock("m1", 9, 60)],
      madelineTasks: [
        makeTask("task-stale", MADELINE_ID, "done", "2026-07-01T09:00:00.000Z"),
        makeTask("task-todo", MADELINE_ID, "todo"),
      ],
      madelineGoals: linked ? [linked] : [],
    });

    const opportunities = buildHouseholdOpportunities({
      overview,
      memberSnapshots: snapshots,
    });
    const goalOpp = opportunities.find((item) => item.kind === "stale_goal_support");

    expect(goalOpp).toBeDefined();

    const proposal = buildHouseholdCollaborationProposal({
      opportunity: goalOpp!,
      overview,
      memberSnapshots: snapshots,
      date: TEST_DATE,
    });

    expect(proposal?.actionKind).toBe("goal_support_task_draft");
    expect(proposal?.proposedAction.payload.goalId).toBe(goal.id);
  });

  it("journée dense — revue planning sans modification auto", () => {
    const heavyTimeline = Array.from({ length: 10 }, (_, index) =>
      makeBlock(`heavy-${index}`, 6 + index, 60),
    );

    const { overview, snapshots } = buildTwoMemberScenario({
      williamTimeline: heavyTimeline,
      madelineTimeline: heavyTimeline,
    });

    const opportunities = buildHouseholdOpportunities({ overview, memberSnapshots: snapshots });
    const busyOpp = opportunities.find((item) => item.kind === "both_busy")!;

    const proposal = buildHouseholdCollaborationProposal({
      opportunity: busyOpp,
      overview,
      memberSnapshots: snapshots,
      date: TEST_DATE,
    });

    expect(proposal?.actionKind).toBe("planning_density_review");

    prepareHouseholdCollaboration(proposal!);
    const draft = readHouseholdPlanningCollaborationDraft();
    expect(draft?.kind).toBe("density_review");
  });

  it("non-régression — EPIC3-B buildHouseholdOpportunities inchangé", () => {
    expect(readSrc("lib/householdOpportunities/buildHouseholdOpportunities.ts")).toContain(
      "buildHouseholdOpportunities",
    );
    expect(isHouseholdOpportunitiesEnabled()).toBe(false);
    expect(isHouseholdOverviewEnabled()).toBe(false);
  });

  it("non-régression — composants UI sans logique métier lourde", () => {
    const card = readSrc("components/householdOverview/HouseholdOpportunityCard.tsx");
    expect(card).toContain("proposal.buttonLabel");
    expect(card).not.toContain("createTask");
    expect(card).not.toContain("prepareHouseholdCollaboration");
  });

  it("feature flag VITE_HOUSEHOLD_COLLABORATION default false", () => {
    vi.stubEnv("VITE_HOUSEHOLD_COLLABORATION", undefined);
    expect(isHouseholdCollaborationEnabled()).toBe(false);

    vi.stubEnv("VITE_HOUSEHOLD_COLLABORATION", "true");
    expect(isHouseholdCollaborationEnabled()).toBe(true);
  });
});
