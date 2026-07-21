import { describe, expect, it } from "vitest";

import { SemanticPlanningEngine } from "../engine/semanticPlanningEngine";
import { computeDailyLoad } from "../load/dailyLoadEngine";
import { ITEM_DENTIST, ITEM_GYM, ITEM_SPRINT } from "../testing/fixtures";
import type { ICalendarProvider } from "../../planningCalendarEngine/providers/calendarProvider";
import { PlanningCalendarEngine } from "../../planningCalendarEngine/engine/planningCalendarEngine";
import { vi } from "vitest";

function buildEngine(items: ReturnType<typeof ITEM_SPRINT>[]) {
  const provider: ICalendarProvider = {
    id: "test",
    label: "Test",
    fetchItems: vi.fn(async () => ({
      items,
      syncState: "local" as const,
      available: true,
    })),
  };
  return new SemanticPlanningEngine({
    planningEngine: new PlanningCalendarEngine({
      providers: [provider],
      rescheduleNonUrgentTasks: vi.fn(),
      defaultTimezone: "America/Montreal",
    }),
  });
}

describe("EPIC5C dailyLoadEngine", () => {
  it("calcule charge mentale et buckets", () => {
    const engine = buildEngine([ITEM_SPRINT, ITEM_GYM, ITEM_DENTIST]);
    const enriched = engine.enrichItems([ITEM_SPRINT, ITEM_GYM, ITEM_DENTIST]);
    const load = computeDailyLoad(enriched);

    expect(load.workMinutes).toBeGreaterThan(0);
    expect(load.physicalLoad).toBeGreaterThan(0);
    expect(load.healthMinutes).toBeGreaterThan(0);
    expect(load.mentalLoad).toBeGreaterThan(0);
  });
});
