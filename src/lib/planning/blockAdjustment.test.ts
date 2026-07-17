import { describe, expect, it } from "vitest";

import {
  buildManualBlockAdjustment,
  validateScopeForEdit,
} from "./blockAdjustmentHelpers";
import type { DayTimelineEntry } from "./displayedDayTimeline";

const entry: DayTimelineEntry = {
  id: "task-1",
  visualType: "task",
  title: "Réviser",
  startsAt: "2026-07-13T10:00:00.000Z",
  endsAt: "2026-07-13T10:30:00.000Z",
  locked: false,
  origin: "persisted",
  blockKind: "task",
  calendarItemId: "task-1",
};

describe("block adjustment helpers", () => {
  it("A. builds manual block adjustment metadata", () => {
    const adjustment = buildManualBlockAdjustment({
      entry,
      startsAt: "2026-07-13T10:00:00.000Z",
      endsAt: "2026-07-13T11:00:00.000Z",
      userId: "user-1",
      scope: "today",
    });

    expect(adjustment.blockId).toBe("task-1");
    expect(adjustment.originalEndsAt).toBe(entry.endsAt);
    expect(adjustment.newEndsAt).toContain("11:00");
    expect(adjustment.scope).toBe("today");
  });

  it("blocks period and recurring scopes for now", () => {
    expect(validateScopeForEdit("period")).toContain("Contexte familial");
    expect(validateScopeForEdit("recurring")).toContain("Mon quotidien");
    expect(validateScopeForEdit("today")).toBeNull();
  });
});
