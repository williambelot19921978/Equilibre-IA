import { beforeEach, describe, expect, it, vi } from "vitest";

import { SecureActionEngine } from "../../actionEngine/engine/actionEngine";
import { AssistantConversationEngine } from "./conversationEngine";
import type { ContextEngineDependencies } from "../context/contextEngineDependencies";
import type { HouseholdMemoryContext, PlanningContext } from "../../memoryEngine";

function createDeps(): ContextEngineDependencies {
  const planningContext = {
    householdId: "hh-1",
    targetDate: "2026-07-20",
    tasks: [],
  } as unknown as PlanningContext;

  return {
    getUserProfile: vi.fn(async () => ({
      id: "user-1",
      onboarding_completed: true,
      created_at: "",
      updated_at: "",
    })),
    getHouseholdMembership: vi.fn(async () => ({
      household_id: "hh-1",
      user_id: "user-1",
      role: "admin",
      display_name: "William",
    })),
    getHouseholdMembers: vi.fn(async () => []),
    getChildrenByHousehold: vi.fn(async () => []),
    loadHouseholdMemoryContext: vi.fn(async () => ({ householdId: "hh-1" } as HouseholdMemoryContext)),
    loadPlanningContextForDate: vi.fn(async () => planningContext),
    loadDisplayedDayPlan: vi.fn(async () => ({
      plan: { date: "2026-07-20", blocks: [] },
      timeline: [],
      items: [],
      displayMode: "timeline",
    })),
    getUserTasks: vi.fn(async () => []),
    getUserGoals: vi.fn(() => []),
    loadLivingMemory: vi.fn(async () => ({ insights: [], trends: [] })),
    loadHabitProfile: vi.fn(async () => ({ insights: [], userId: "user-1" })),
    loadProfileFactsSafe: vi.fn(async () => []),
  };
}

function createActionEngine(): SecureActionEngine {
  return new SecureActionEngine({
    getUserTasks: vi.fn(async () => []),
    createTask: vi.fn(async () => ({
      id: "t-new",
      title: "Epic4C",
      household_id: "hh",
      assigned_to: "u1",
      created_by: "u1",
      category: "personal",
      estimated_minutes: 30,
      priority: 3,
      splittable: false,
      status: "todo",
      skip_count: 0,
      created_at: "",
      updated_at: "",
    })),
    updateTaskStatus: vi.fn(),
    getUserGoals: vi.fn(() => []),
    updateUserGoal: vi.fn(),
    rescheduleNonUrgentTasks: vi.fn(async () => ({ moved: [], summary: "ok" })),
    isGoalsEnabled: vi.fn(() => true),
    isHouseholdCollaborationEnabled: vi.fn(() => true),
    isSecureActionEngineEnabled: vi.fn(() => true),
  });
}

describe("EPIC4C Conversation + ActionEngine", () => {
  beforeEach(() => {
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
      clear() {
        this.store = {};
      },
      key: () => null,
      length: 0,
    });
  });

  it("propose des actions sécurisées quand le flag est actif", async () => {
    const engine = new AssistantConversationEngine({
      contextDeps: createDeps(),
      actionEngine: createActionEngine(),
    });

    const result = await engine.processMessage({
      userId: "user-1",
      firstName: "William",
      message: "créer une tâche epic4c integration",
      date: "2026-07-20",
    });

    const secureActions = result.response.proposedActions.filter(
      (action) => action.status === "pending_confirmation",
    );
    expect(secureActions.length).toBeGreaterThan(0);
    expect(secureActions[0]?.executable).toBe(true);
  });

  it("confirmAction ajoute un message de compte-rendu", async () => {
    const engine = new AssistantConversationEngine({
      contextDeps: createDeps(),
      actionEngine: createActionEngine(),
    });

    const processed = await engine.processMessage({
      userId: "user-1",
      firstName: "William",
      message: "créer une tâche epic4c confirm flow",
      date: "2026-07-20",
    });

    const actionId = processed.response.proposedActions.find(
      (action) => action.actionId,
    )?.actionId;
    expect(actionId).toBeTruthy();

    const confirmed = await engine.confirmAction("user-1", actionId!);
    expect(confirmed.result.report.success).toBe(true);
    expect(
      confirmed.conversation.messages.some((message) =>
        message.content.match(/action réalisée/i),
      ),
    ).toBe(true);
  });

  it("cancelAction ajoute un message d'abandon", async () => {
    const engine = new AssistantConversationEngine({
      contextDeps: createDeps(),
      actionEngine: createActionEngine(),
    });

    const processed = await engine.processMessage({
      userId: "user-1",
      firstName: "William",
      message: "créer une tâche epic4c cancel flow",
      date: "2026-07-20",
    });

    const actionId = processed.response.proposedActions.find(
      (action) => action.actionId,
    )?.actionId;
    expect(actionId).toBeTruthy();

    const cancelled = engine.cancelAction("user-1", actionId!);
    expect(
      cancelled.conversation.messages.some((message) =>
        message.content.match(/abandonnée/i),
      ),
    ).toBe(true);
  });
});
