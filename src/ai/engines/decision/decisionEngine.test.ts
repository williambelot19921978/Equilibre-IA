import { describe, expect, it } from "vitest";

import {
  validatePlannedBlockCore,
  validateDayPlanCore,
  getMaxFillRatio,
} from "./decisionEngineCore";
import { createContractDecisionEngine } from "./contractDecisionEngine";
import {
  validatePlannedBlock as legacyValidatePlannedBlock,
  validateDayPlan as legacyValidateDayPlan,
} from "../../decisionEngine";
import type { PlanningContext } from "../../memoryEngine";
import type { PlannedBlock } from "../../../types/planning";
import type { ResolvedFamilyContext } from "../../../types/familyContext";
import { asConfidence } from "../../contracts/common/primitives.ts";

function makeFamilyContext(
  overrides: Partial<ResolvedFamilyContext> = {},
): ResolvedFamilyContext {
  return {
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
    ...overrides,
  };
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
  },
  childRoutines: [],
  householdEvening: {
    eveningRoutineStart: null,
    eveningRoutineManager: null,
    averageEveningRoutineMinutes: 45,
  },
  familyContext: makeFamilyContext(),
  familyContextPeriods: [],
  targetDate: "2026-07-13",
  currentUserId: "user-1",
};

function makeTaskBlock(overrides: Partial<PlannedBlock> = {}): PlannedBlock {
  return {
    id: "block-task-1",
    blockType: "task",
    title: "Révision",
    startsAt: "2026-07-13T09:00:00.000Z",
    endsAt: "2026-07-13T10:00:00.000Z",
    category: "studies",
    locked: false,
    source: "engine",
    explanation: { summary: "", facts: [], confidence: "certain" },
    energyLevel: "medium",
    ...overrides,
  };
}

function makeConstraintBlock(overrides: Partial<PlannedBlock> = {}): PlannedBlock {
  return {
    id: "block-constraint-1",
    blockType: "constraint",
    title: "Travail",
    startsAt: "2026-07-13T08:00:00.000Z",
    endsAt: "2026-07-13T12:00:00.000Z",
    locked: true,
    source: "engine",
    explanation: { summary: "", facts: [], confidence: "certain" },
    ...overrides,
  };
}

describe("DecisionEngine core — legacy parity", () => {
  it("validatePlannedBlockCore matches legacy on valid task", () => {
    const input = {
      block: makeTaskBlock(),
      context: baseContext,
      existingBlocks: [] as PlannedBlock[],
      totalFreeMinutes: 480,
      plannedMinutes: 0,
    };

    expect(validatePlannedBlockCore(input)).toEqual(
      legacyValidatePlannedBlock(input),
    );
  });

  it("validatePlannedBlockCore matches legacy — before wake", () => {
    const input = {
      block: makeTaskBlock({
        startsAt: "2026-07-13T05:00:00.000Z",
        endsAt: "2026-07-13T05:30:00.000Z",
      }),
      context: baseContext,
      existingBlocks: [],
      totalFreeMinutes: 480,
      plannedMinutes: 0,
    };

    expect(validatePlannedBlockCore(input)).toEqual(
      legacyValidatePlannedBlock(input),
    );
  });

  it("validatePlannedBlockCore matches legacy — constraint overlap", () => {
    const input = {
      block: makeTaskBlock({
        startsAt: "2026-07-13T08:30:00.000Z",
        endsAt: "2026-07-13T09:30:00.000Z",
      }),
      context: baseContext,
      existingBlocks: [makeConstraintBlock()],
      totalFreeMinutes: 480,
      plannedMinutes: 0,
    };

    expect(validatePlannedBlockCore(input)).toEqual(
      legacyValidatePlannedBlock(input),
    );
  });

  it("validatePlannedBlockCore matches legacy — spirituality disabled", () => {
    const input = {
      block: makeTaskBlock({ category: "spirituality" }),
      context: baseContext,
      existingBlocks: [],
      totalFreeMinutes: 480,
      plannedMinutes: 0,
    };

    expect(validatePlannedBlockCore(input)).toEqual(
      legacyValidatePlannedBlock(input),
    );
  });

  it("validatePlannedBlockCore matches legacy — fill ratio limit", () => {
    const input = {
      block: makeTaskBlock({
        startsAt: "2026-07-13T14:00:00.000Z",
        endsAt: "2026-07-13T16:00:00.000Z",
      }),
      context: baseContext,
      existingBlocks: [],
      totalFreeMinutes: 100,
      plannedMinutes: 90,
    };

    expect(validatePlannedBlockCore(input)).toEqual(
      legacyValidatePlannedBlock(input),
    );
  });

  it("validateDayPlanCore matches legacy validateDayPlan", () => {
    const blocks = [
      makeTaskBlock({ id: "t1" }),
      makeTaskBlock({
        id: "t2",
        startsAt: "2026-07-13T14:00:00.000Z",
        endsAt: "2026-07-13T15:00:00.000Z",
      }),
    ];

    const input = {
      blocks,
      context: baseContext,
      totalFreeMinutes: 480,
    };

    expect(validateDayPlanCore(input)).toEqual(
      legacyValidateDayPlan({ ...input, plannedMinutes: 0 }),
    );
  });

  it("getMaxFillRatio uses family context override", () => {
    const context = {
      ...baseContext,
      familyContext: makeFamilyContext({ maxFillRatio: 0.6 }),
    };

    expect(getMaxFillRatio(context)).toBe(0.6);
  });
});

describe("ContractDecisionEngine — IDecisionEngine", () => {
  const engine = createContractDecisionEngine();

  it("exposes frozen meta", () => {
    expect(engine.meta.id).toBe("decision-engine");
    expect(engine.meta.pipelineNumber).toBe(12);
  });

  it("validateProposal approves when no hard reject constraints", () => {
    const result = engine.validateProposal({
      proposedDecision: {
        id: "dec-1",
        summary: "Planifier révision",
        confidence: asConfidence(0.9),
        schedulingRequested: true,
      },
      constraints: [{ id: "c1", kind: "soft", ruleKey: "prefer-morning" }],
      planningContext: {
        date: "2026-07-13",
        taskCount: 2,
        blockCount: 4,
        immutable: true,
      },
      autonomyLevel: 3,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.approved).toBe(true);
      expect(result.value.violations).toEqual([]);
    }
  });

  it("validateProposal rejects hard reject constraints", () => {
    const result = engine.validateProposal({
      proposedDecision: {
        id: "dec-2",
        summary: "Action interdite",
        confidence: asConfidence(0.5),
        schedulingRequested: false,
      },
      constraints: [{ id: "c2", kind: "hard", ruleKey: "reject:sleep" }],
      planningContext: {
        date: "2026-07-13",
        taskCount: 0,
        blockCount: 0,
        immutable: true,
      },
      autonomyLevel: 4,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.approved).toBe(false);
      expect(result.value.violations.length).toBeGreaterThan(0);
    }
  });

  it("requiresConfirmation respects autonomy levels", () => {
    expect(engine.requiresConfirmation("DeleteTask", 1)).toBe(true);
    expect(engine.requiresConfirmation("DeleteTask", 2)).toBe(true);
    expect(engine.requiresConfirmation("DeleteTask", 3)).toBe(true);
    expect(engine.requiresConfirmation("DeleteTask", 4)).toBe(false);
    expect(engine.requiresConfirmation("AddTask", 4)).toBe(false);
  });

  it("validateDayPlan detects overlapping contract blocks", () => {
    const result = engine.validateDayPlan(
      {
        date: "2026-07-13",
        blocks: [
          { blockId: "b1" as never, start: "09:00", end: "10:00" },
          { blockId: "b2" as never, start: "09:30", end: "10:30" },
        ],
      },
      [],
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.approved).toBe(false);
      expect(result.value.violations.some((v) => v.includes("Chevauchement"))).toBe(
        true,
      );
    }
  });
});

describe("Contract import boundaries — engines layer", () => {
  it("engines/decision does not import planningEngine or lifeEngine", async () => {
    const { readFileSync, readdirSync, statSync } = await import("node:fs");
    const { join } = await import("node:path");

    const root = join(process.cwd(), "src/ai/engines/decision");
    const forbidden = /from\s+['"].*\/(planningEngine|lifeEngine|actionResolver)/;

    function walk(dir: string): string[] {
      return readdirSync(dir).flatMap((entry) => {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) return walk(full);
        if (entry.endsWith(".ts")) return [full];
        return [];
      });
    }

    const violations = walk(root).filter((file) =>
      forbidden.test(readFileSync(file, "utf8")),
    );

    expect(violations).toEqual([]);
  });
});
