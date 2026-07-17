import { describe, expect, it } from "vitest";

import { buildReplanExplanation } from "./replanExplanation";
import type { ManualBlockAdjustment } from "../../types/manualBlockAdjustment";
import type { CalendarItemRecord } from "../../types/database";

const adjustment: ManualBlockAdjustment = {
  blockId: "task-1",
  originalStartsAt: "2026-07-13T10:00:00.000Z",
  originalEndsAt: "2026-07-13T10:30:00.000Z",
  newStartsAt: "2026-07-13T10:00:00.000Z",
  newEndsAt: "2026-07-13T11:00:00.000Z",
  scope: "today",
  createdBy: "user-1",
  createdAt: "2026-07-13T08:00:00.000Z",
};

function makeTaskItem(overrides: Partial<CalendarItemRecord> = {}): CalendarItemRecord {
  return {
    id: "task-1",
    household_id: "household-1",
    user_id: "user-1",
    task_id: "task-db-1",
    title: "Réviser",
    item_type: "task",
    starts_at: "2026-07-13T10:00:00.000Z",
    ends_at: "2026-07-13T10:30:00.000Z",
    locked: true,
    source: "ai",
    details: { status: "accepted" },
    created_at: "",
    updated_at: "",
    ...overrides,
  };
}

describe("buildReplanExplanation", () => {
  it("D. explains duration increase and moved tasks", () => {
    const explanation = buildReplanExplanation({
      adjustment,
      previousItems: [
        makeTaskItem(),
        makeTaskItem({
          id: "task-2",
          title: "Courses",
          starts_at: "2026-07-13T10:30:00.000Z",
          ends_at: "2026-07-13T11:00:00.000Z",
        }),
      ],
      nextItems: [
        makeTaskItem({
          ends_at: "2026-07-13T11:00:00.000Z",
        }),
        makeTaskItem({
          id: "task-2",
          title: "Courses",
          starts_at: "2026-07-13T11:15:00.000Z",
          ends_at: "2026-07-13T11:45:00.000Z",
        }),
      ],
      activityType: "work",
      strategy: "create_manual_item",
      entry: {
        id: "free-1",
        visualType: "free",
        title: "Temps libre",
        startsAt: "2026-07-13T09:00:00.000Z",
        endsAt: "2026-07-13T12:00:00.000Z",
        locked: false,
        origin: "computed",
        blockKind: "free_slot",
      },
    });

    expect(explanation).toContain("réservé au travail");
    expect(explanation).toContain("réorganisé");
  });

  it("E. explains shortening", () => {
    const explanation = buildReplanExplanation({
      adjustment: {
        ...adjustment,
        newEndsAt: "2026-07-13T10:15:00.000Z",
      },
      previousItems: [makeTaskItem()],
      nextItems: [makeTaskItem({ ends_at: "2026-07-13T10:15:00.000Z" })],
    });

    expect(explanation).toContain("raccourci");
  });
});
