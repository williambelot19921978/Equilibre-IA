import { describe, expect, it, beforeEach, vi } from "vitest";

import {
  validatePlannedBlockViaPort,
} from "./decisionEnginePort";
import {
  clearShadowComparisonLog,
  getShadowComparisonLog,
} from "./shadowCompare";
import type { PlanningContext } from "../../memoryEngine";
import type { PlannedBlock } from "../../../types/planning";
import type { ResolvedFamilyContext } from "../../../types/familyContext";

function makeFamilyContext(): ResolvedFamilyContext {
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
  mainPriority: null,
  onboardingCompleted: true,
  profile: {
    eveningRoutine: [],
    workDays: [],
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

function makeTaskBlock(): PlannedBlock {
  return {
    id: "block-1",
    blockType: "task",
    title: "Tâche test",
    startsAt: "2026-07-13T10:00:00.000Z",
    endsAt: "2026-07-13T11:00:00.000Z",
    category: "studies",
    locked: false,
    source: "engine",
    explanation: { summary: "", facts: [], confidence: "certain" },
    energyLevel: "medium",
  };
}

describe("decisionEnginePort", () => {
  beforeEach(() => {
    clearShadowComparisonLog();
    vi.stubEnv("VITE_USE_NEW_DECISION_ENGINE", "false");
  });

  it("returns legacy result by default (flag off)", () => {
    const input = {
      block: makeTaskBlock(),
      context: baseContext,
      existingBlocks: [],
      totalFreeMinutes: 480,
      plannedMinutes: 0,
    };

    const result = validatePlannedBlockViaPort(input);
    expect(result.valid).toBe(true);
    expect(getShadowComparisonLog()).toEqual([]);
  });

  it("uses candidate when feature flag is on", () => {
    vi.stubEnv("VITE_USE_NEW_DECISION_ENGINE", "true");

    const input = {
      block: makeTaskBlock(),
      context: baseContext,
      existingBlocks: [],
      totalFreeMinutes: 480,
      plannedMinutes: 0,
    };

    const result = validatePlannedBlockViaPort(input);
    expect(result.valid).toBe(true);
  });

  it("shadow log stays empty when legacy and candidate match", () => {
    validatePlannedBlockViaPort({
      block: makeTaskBlock(),
      context: baseContext,
      existingBlocks: [],
      totalFreeMinutes: 480,
      plannedMinutes: 0,
    });

    expect(getShadowComparisonLog()).toEqual([]);
  });
});
