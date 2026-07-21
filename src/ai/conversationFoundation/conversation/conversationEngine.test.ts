import { beforeEach, describe, expect, it, vi } from "vitest";

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
      plan: { date: "2026-07-20", blocks: [{ id: "b1" }] },
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

describe("EPIC4-A Conversation Engine", () => {
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

  it("traite un message et persiste l'historique", async () => {
    const engine = new AssistantConversationEngine({ contextDeps: createDeps() });

    const result = await engine.processMessage({
      userId: "user-1",
      firstName: "William",
      message: "Je suis fatigué ce soir",
      date: "2026-07-20",
    });

    expect(result.response.readOnly).toBe(true);
    expect(result.response.intent).toBe("fatigue");
    expect(result.humanModel.energy).toBeDefined();
    expect(result.conversation.messages).toHaveLength(2);
    expect(result.promptPreview.readOnly).toBe(true);

    const loaded = engine.getConversation("user-1");
    expect(loaded?.messages).toHaveLength(2);
  });

  it("refuse un message vide", async () => {
    const engine = new AssistantConversationEngine({ contextDeps: createDeps() });
    await expect(
      engine.processMessage({ userId: "user-1", message: "   " }),
    ).rejects.toThrow(/vide/i);
  });
});
