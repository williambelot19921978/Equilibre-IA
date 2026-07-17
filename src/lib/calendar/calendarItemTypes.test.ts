import { describe, expect, it } from "vitest";

import {
  mapCalendarItemTypeToPlannedBlockType,
  mapEngineBlockKindToCalendarItemType,
  mapPlannedBlockTypeToCalendarItemType,
} from "../../config/calendarItemTypes";
import { buildValidatedCalendarInsert } from "./validateCalendarInsert";
import { PlanningGenerationError } from "../../types/planningGenerationError";

describe("calendar item type mapping", () => {
  it("A. maps automatic task to task", () => {
    expect(mapPlannedBlockTypeToCalendarItemType("task")).toBe("task");
    expect(mapEngineBlockKindToCalendarItemType("task")).toBe("task");
  });

  it("B. maps buffer to buffer", () => {
    expect(mapPlannedBlockTypeToCalendarItemType("buffer")).toBe("buffer");
    expect(mapEngineBlockKindToCalendarItemType("buffer")).toBe("buffer");
  });

  it("C. maps margin to buffer with round-trip via details", () => {
    expect(mapPlannedBlockTypeToCalendarItemType("margin")).toBe("buffer");
    expect(
      mapCalendarItemTypeToPlannedBlockType("buffer", { blockType: "margin" }),
    ).toBe("margin");
  });

  it("D. maps routine to routine", () => {
    expect(mapEngineBlockKindToCalendarItemType("routine")).toBe("routine");
  });

  it("E. maps manual constraint to event", () => {
    expect(mapPlannedBlockTypeToCalendarItemType("constraint")).toBe("event");
    expect(mapEngineBlockKindToCalendarItemType("manual_constraint")).toBe(
      "event",
    );
  });

  it("F. rejects unknown item_type before Supabase insert", () => {
    expect(() =>
      buildValidatedCalendarInsert({
        household_id: "household-1",
        user_id: "user-1",
        title: "Bloc invalide",
        item_type: "unknown_type",
        starts_at: "2026-07-13T10:00:00.000Z",
        ends_at: "2026-07-13T11:00:00.000Z",
        locked: false,
        source: "ai",
      }),
    ).toThrow(PlanningGenerationError);
  });

  it("G. accepts mapped margin payload as buffer", () => {
    const payload = buildValidatedCalendarInsert({
      household_id: "household-1",
      user_id: "user-1",
      title: "Temps libre",
      item_type: mapPlannedBlockTypeToCalendarItemType("margin"),
      starts_at: "2026-07-13T18:00:00.000Z",
      ends_at: "2026-07-13T20:00:00.000Z",
      locked: false,
      source: "ai",
      details: { blockType: "margin" },
    });

    expect(payload.item_type).toBe("buffer");
  });
});
