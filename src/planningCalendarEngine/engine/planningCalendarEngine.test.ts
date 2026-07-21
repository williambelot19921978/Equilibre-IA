import { describe, expect, it, vi } from "vitest";

import type { ICalendarProvider } from "../providers/calendarProvider";
import { PlanningCalendarEngine } from "../engine/planningCalendarEngine";
import { PlanningCalendarApi } from "../api/planningCalendarApi";
import { FIXTURE_SIMPLE, DAY_START, DAY_END } from "../testing/fixtures";
import type { CalendarItem } from "../types/calendarItem";

function mockProvider(
  id: string,
  label: string,
  items: readonly CalendarItem[],
): ICalendarProvider {
  return {
    id,
    label,
    fetchItems: vi.fn(async () => ({
      items,
      syncState: "local" as const,
      available: true,
    })),
  };
}

describe("EPIC5A providers & API", () => {
  it("InternalPlanningProvider alimente la timeline", async () => {
    const engine = new PlanningCalendarEngine({
      providers: [mockProvider("internal-planning", "Planning interne", FIXTURE_SIMPLE)],
      rescheduleNonUrgentTasks: vi.fn(),
      defaultTimezone: "America/Montreal",
    });

    const snapshot = await engine.getToday({
      userId: "user-1",
      householdId: "hh-1",
      date: "2026-07-20",
    });

    expect(snapshot.timeline.items).toHaveLength(2);
    expect(snapshot.sources[0]?.id).toBe("internal-planning");
  });

  it("plusieurs providers fusionnés", async () => {
    const engine = new PlanningCalendarEngine({
      providers: [
        mockProvider("internal-planning", "Planning", [FIXTURE_SIMPLE[0]!]),
        mockProvider("tasks", "Tâches", [FIXTURE_SIMPLE[1]!]),
      ],
      rescheduleNonUrgentTasks: vi.fn(),
      defaultTimezone: "America/Montreal",
    });

    const snapshot = await engine.buildSnapshot({
      userId: "user-1",
      start: DAY_START,
      end: DAY_END,
    });

    expect(snapshot.timeline.items).toHaveLength(2);
    expect(snapshot.sources).toHaveLength(2);
  });

  it("PlanningCalendarApi expose getTimeline, detectConflicts, findFreeSlots", async () => {
    const engine = new PlanningCalendarEngine({
      providers: [mockProvider("internal-planning", "Planning", FIXTURE_SIMPLE)],
      rescheduleNonUrgentTasks: vi.fn(),
      defaultTimezone: "America/Montreal",
    });
    const api = new PlanningCalendarApi(engine);

    const timeline = await api.getTimeline({
      userId: "user-1",
      start: DAY_START,
      end: DAY_END,
    });
    expect(timeline.items).toHaveLength(2);

    const conflicts = await api.detectConflicts({
      userId: "user-1",
      start: DAY_START,
      end: DAY_END,
    });
    expect(Array.isArray(conflicts)).toBe(true);

    const freeSlots = await api.findFreeSlots(
      { userId: "user-1", start: DAY_START, end: DAY_END },
      30,
    );
    expect(freeSlots.length).toBeGreaterThan(0);
  });

  it("provider indisponible — snapshot dégradé sans crash", async () => {
    const failingProvider: ICalendarProvider = {
      id: "broken",
      label: "Broken",
      fetchItems: vi.fn(async () => ({
        items: [],
        syncState: "error",
        available: false,
        error: "offline",
      })),
    };

    const engine = new PlanningCalendarEngine({
      providers: [failingProvider],
      rescheduleNonUrgentTasks: vi.fn(),
      defaultTimezone: "America/Montreal",
    });

    const snapshot = await engine.getToday({
      userId: "user-1",
      date: "2026-07-20",
    });
    expect(snapshot.timeline.items).toHaveLength(0);
    expect(snapshot.sources[0]?.available).toBe(false);
  });
});
