import { describe, expect, it } from "vitest";

import {
  isComputedFreeSlot,
  resolveTimelineEditStrategy,
} from "./applyTimelineEdit";
import type { DayTimelineEntry } from "./displayedDayTimeline";
import {
  mapActivityTypeToCalendarItemType,
  mapActivityTypeToVisualType,
} from "../../config/activityTypes";
import { computeFreeSlotEntries } from "./freeSlotEntries";
import { combineDateAndTime } from "../time/daySchedule";

const date = "2026-07-13";

function makeEntry(
  overrides: Partial<DayTimelineEntry> & Pick<DayTimelineEntry, "id">,
): DayTimelineEntry {
  return {
    visualType: "free",
    title: "Temps libre",
    startsAt: combineDateAndTime(date, "09:00"),
    endsAt: combineDateAndTime(date, "12:00"),
    locked: false,
    origin: "computed",
    blockKind: "free_slot",
    ...overrides,
  };
}

describe("resolveTimelineEditStrategy", () => {
  it("A. free slot creates manual item instead of update", () => {
    const entry = makeEntry({ id: "free-1" });
    expect(resolveTimelineEditStrategy(entry)).toBe("create_manual_item");
    expect(isComputedFreeSlot(entry)).toBe(true);
  });

  it("C. persisted appointment updates existing item", () => {
    const entry = makeEntry({
      id: "appt-1",
      visualType: "appointment",
      title: "Médecin",
      blockKind: "appointment",
      origin: "persisted",
      calendarItemId: "appt-1",
    });

    expect(resolveTimelineEditStrategy(entry)).toBe("update_existing_item");
  });

  it("D. computed work constraint creates daily override", () => {
    const entry = makeEntry({
      id: "work-1",
      visualType: "work",
      title: "Travail",
      blockKind: "structural",
      origin: "computed",
      constraintType: "work",
    });

    expect(resolveTimelineEditStrategy(entry)).toBe("create_daily_override");
  });
});

describe("free slot activity mapping", () => {
  it("A. work activity maps to event item and work visual", () => {
    expect(mapActivityTypeToCalendarItemType("work")).toBe("event");
    expect(mapActivityTypeToVisualType("work")).toBe("work");
  });

  it("B. appointment maps to event", () => {
    expect(mapActivityTypeToCalendarItemType("appointment")).toBe("event");
    expect(mapActivityTypeToVisualType("appointment")).toBe("appointment");
  });
});

describe("computeFreeSlotEntries", () => {
  it("computes gap between work blocks", () => {
    const occupied: DayTimelineEntry[] = [
      makeEntry({
        id: "wake",
        visualType: "wake",
        title: "Réveil",
        startsAt: combineDateAndTime(date, "06:30"),
        endsAt: combineDateAndTime(date, "06:30"),
        blockKind: "structural",
      }),
      makeEntry({
        id: "work",
        visualType: "work",
        title: "Travail",
        startsAt: combineDateAndTime(date, "09:00"),
        endsAt: combineDateAndTime(date, "12:00"),
        blockKind: "structural",
      }),
      makeEntry({
        id: "sleep",
        visualType: "sleep",
        title: "Sommeil",
        startsAt: combineDateAndTime(date, "22:00"),
        endsAt: combineDateAndTime(date, "22:00"),
        blockKind: "structural",
      }),
    ];

    const freeSlots = computeFreeSlotEntries({
      occupiedEntries: occupied,
      dayStart: combineDateAndTime(date, "06:30"),
      dayEnd: combineDateAndTime(date, "22:00"),
    });

    expect(
      freeSlots.some(
        (slot) =>
          slot.blockKind === "free_slot" &&
          slot.startsAt === combineDateAndTime(date, "06:30") &&
          slot.title.startsWith("Temps libre —"),
      ),
    ).toBe(true);
  });
});
