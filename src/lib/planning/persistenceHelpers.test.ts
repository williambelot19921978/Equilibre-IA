import { describe, expect, it } from "vitest";

import {
  getPersistableEngineBlocks,
  shouldDeleteAutoCalendarItem,
} from "./persistenceHelpers";
import { mapPlannedBlockTypeToCalendarItemType } from "../../config/calendarItemTypes";
import { buildValidatedCalendarInsert } from "../calendar/validateCalendarInsert";
import type { CalendarItemRecord, DayPlan, PlannedBlock } from "../../types";

function makeCalendarItem(
  overrides: Partial<CalendarItemRecord> = {},
): CalendarItemRecord {
  return {
    id: "item-1",
    household_id: "household-1",
    user_id: "user-1",
    task_id: null,
    title: "Bloc",
    item_type: "task",
    starts_at: "2026-07-13T10:00:00.000Z",
    ends_at: "2026-07-13T11:00:00.000Z",
    locked: false,
    source: "ai",
    details: { status: "proposed" },
    created_at: "2026-07-13T09:00:00.000Z",
    updated_at: "2026-07-13T09:00:00.000Z",
    ...overrides,
  };
}

function makeBlock(overrides: Partial<PlannedBlock>): PlannedBlock {
  return {
    id: overrides.id ?? "block-1",
    blockType: overrides.blockType ?? "task",
    title: overrides.title ?? "Tâche",
    startsAt: overrides.startsAt ?? "2026-07-13T10:00:00.000Z",
    endsAt: overrides.endsAt ?? "2026-07-13T11:00:00.000Z",
    locked: overrides.locked ?? false,
    source: overrides.source ?? "engine",
    explanation: overrides.explanation ?? {
      summary: "Test",
      facts: [],
      confidence: "certain",
    },
    ...overrides,
  };
}

function buildInsertFromBlock(block: PlannedBlock) {
  return buildValidatedCalendarInsert({
    household_id: "household-1",
    user_id: "user-1",
    task_id: block.taskId ?? null,
    title: block.title,
    item_type: mapPlannedBlockTypeToCalendarItemType(block.blockType),
    starts_at: block.startsAt,
    ends_at: block.endsAt,
    locked: block.locked,
    source: "ai",
    details: { blockType: block.blockType },
  });
}

describe("planning persistence helpers", () => {
  it("H. regeneration payloads never use raw margin item_type", () => {
    const plan: DayPlan = {
      date: "2026-07-13",
      constraints: [],
      blocks: [
        makeBlock({ blockType: "task" }),
        makeBlock({ id: "margin-1", blockType: "margin", title: "Temps libre" }),
      ],
      margins: [],
      unplannableTasks: [],
      freeMinutesRemaining: 120,
      totalFreeMinutes: 300,
      fillPercentage: 40,
      incompleteData: [],
      contextAdaptations: [],
      contextWarnings: [],
    };

    const persistable = getPersistableEngineBlocks(plan);
    const inserts = persistable.map((block) => buildInsertFromBlock(block));

    expect(inserts.every((insert) => insert.item_type !== "margin")).toBe(true);
    expect(inserts.some((insert) => insert.details?.blockType === "margin")).toBe(
      true,
    );
  });

  it("does not persist manual constraint blocks again", () => {
    const plan: DayPlan = {
      date: "2026-07-13",
      constraints: [],
      blocks: [
        makeBlock({
          id: "manual-1",
          blockType: "constraint",
          source: "manual",
          locked: true,
        }),
        makeBlock({ id: "task-1", blockType: "task", source: "engine" }),
      ],
      margins: [],
      unplannableTasks: [],
      freeMinutesRemaining: 120,
      totalFreeMinutes: 300,
      fillPercentage: 40,
      incompleteData: [],
      contextAdaptations: [],
      contextWarnings: [],
    };

    expect(getPersistableEngineBlocks(plan)).toHaveLength(1);
  });

  it("keeps locked user items during auto cleanup", () => {
    expect(
      shouldDeleteAutoCalendarItem(
        makeCalendarItem({
          source: "user",
          locked: true,
          item_type: "event",
        }),
      ),
    ).toBe(false);
  });

  it("deletes auto ai proposals during regeneration", () => {
    expect(
      shouldDeleteAutoCalendarItem(
        makeCalendarItem({ source: "ai", item_type: "task" }),
      ),
    ).toBe(true);
  });
});
