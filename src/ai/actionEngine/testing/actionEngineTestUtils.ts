/** EPIC 5A — Shared Action Engine test dependencies. */

import { vi } from "vitest";

import { defaultPlanningCalendarEngine } from "../../../planningCalendarEngine";
import type { ActionEngineDependencies } from "../execution/actionEngineDependencies";

export function createTestActionEngineDeps(
  overrides: Partial<ActionEngineDependencies> = {},
): ActionEngineDependencies {
  return {
    getUserTasks: vi.fn(async () => []),
    createTask: vi.fn(async () => ({
      id: "task-new",
      title: "Epic4C",
      description: null,
      household_id: "hh",
      assigned_to: "u1",
      created_by: "u1",
      category: "personal",
      estimated_minutes: 30,
      due_at: null,
      priority: 3,
      splittable: false,
      status: "todo" as const,
      skip_count: 0,
      created_at: "",
      updated_at: "",
    })),
    updateTaskStatus: vi.fn(async () => undefined),
    getUserGoals: vi.fn(() => []),
    updateUserGoal: vi.fn(),
    rescheduleNonUrgentTasks: vi.fn(async () => ({
      moved: [],
      skipped: [],
      summary: "ok",
    })),
    isGoalsEnabled: vi.fn(() => true),
    isHouseholdCollaborationEnabled: vi.fn(() => true),
    isSecureActionEngineEnabled: vi.fn(() => true),
    isPlanningCalendarEngineEnabled: vi.fn(() => false),
    isCalendarSyncEngineEnabled: vi.fn(() => false),
    planningCalendarEngine: defaultPlanningCalendarEngine,
    executePlanningCommand: vi.fn(async () => ({
      success: false,
      message: "not implemented",
      scope: "internal" as const,
    })),
    reorganizePlanningDay: vi.fn(async () => ({
      movedCount: 0,
      summary: "ok",
    })),
    ...overrides,
  };
}
