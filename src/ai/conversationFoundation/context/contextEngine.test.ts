import { describe, expect, it, vi } from "vitest";

import { buildAssistantContext } from "./contextEngine";
import type { ContextEngineDependencies } from "./contextEngineDependencies";
import type { HouseholdMemoryContext, PlanningContext } from "../../memoryEngine";

function createDeps(
  overrides: Partial<ContextEngineDependencies> = {},
): ContextEngineDependencies {
  const planningContext = {
    householdId: "hh-1",
    targetDate: "2026-07-20",
    tasks: [],
  } as unknown as PlanningContext;

  const memoryContext = {
    householdId: "hh-1",
    children: [{ id: "child-1", first_name: "Léo" }],
    familyContextPeriods: [],
  } as unknown as HouseholdMemoryContext;

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
    getChildrenByHousehold: vi.fn(async () => [{ id: "child-1", first_name: "Léo" }]),
    loadHouseholdMemoryContext: vi.fn(async () => memoryContext),
    loadPlanningContextForDate: vi.fn(async () => planningContext),
    loadDisplayedDayPlan: vi.fn(async () => ({
      plan: { date: "2026-07-20", blocks: [{ id: "b1" }, { id: "b2" }] },
      timeline: [],
      items: [],
      displayMode: "timeline",
    })),
    getUserTasks: vi.fn(async () => [
      {
        id: "t1",
        title: "Tâche test",
        status: "todo",
        household_id: "hh-1",
        assigned_to: "user-1",
        created_by: "user-1",
        category: "other",
        estimated_minutes: 30,
        priority: 2,
        splittable: false,
        due_at: null,
        created_at: "",
        updated_at: "",
      },
    ]),
    getUserGoals: vi.fn(() => []),
    loadLivingMemory: vi.fn(async () => ({ insights: [], trends: [] })),
    loadHabitProfile: vi.fn(async () => ({ insights: [], userId: "user-1" })),
    loadProfileFactsSafe: vi.fn(async () => []),
    ...overrides,
  };
}

describe("EPIC4-A Context Engine", () => {
  it("agrège le contexte via les services injectés", async () => {
    const deps = createDeps();
    const context = await buildAssistantContext(
      { userId: "user-1", firstName: "William", date: "2026-07-20" },
      deps,
    );

    expect(context.user.firstName).toBe("William");
    expect(context.household.householdId).toBe("hh-1");
    expect(context.household.childrenCount).toBe(1);
    expect(context.planning.blockCount).toBe(2);
    expect(context.tasks.todo).toBe(1);
    expect(context.planningCalendar.enabled).toBe(false);
    expect(context.sources.some((source) => source.id === "tasks" && source.available)).toBe(
      true,
    );
  });

  it("documente les lacunes sans inventer de données", async () => {
    const deps = createDeps({
      loadPlanningContextForDate: vi.fn(async () => null),
      loadDisplayedDayPlan: vi.fn(async () => null),
      getUserTasks: vi.fn(async () => []),
    });

    const context = await buildAssistantContext(
      { userId: "user-1", firstName: "William", date: "2026-07-20" },
      deps,
    );

    expect(context.gaps.some((gap) => gap.includes("planning"))).toBe(true);
    expect(context.gaps.some((gap) => gap.includes("tâche"))).toBe(true);
    expect(context.tasks.total).toBe(0);
  });
});
