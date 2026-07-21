import { describe, expect, it } from "vitest";

import { findFreeSlots, sumFreeMinutes } from "../freeSlot/freeSlotEngine";
import { mergeCalendarItems } from "../merge/mergeEngine";
import {
  DAY_END,
  DAY_START,
  FIXTURE_BUSY,
  FIXTURE_EMPTY,
  FIXTURE_SIMPLE,
} from "../testing/fixtures";

describe("EPIC5A Free Slot Engine", () => {
  it("agenda vide — journée entière libre (min 15 min)", () => {
    const slots = findFreeSlots({
      items: FIXTURE_EMPTY,
      rangeStart: DAY_START,
      rangeEnd: DAY_END,
      minDurationMinutes: 15,
    });
    expect(slots.length).toBeGreaterThan(0);
    expect(sumFreeMinutes(slots)).toBeGreaterThan(1000);
  });

  it("agenda simple — créneaux autour des événements", () => {
    const slots = findFreeSlots({
      items: FIXTURE_SIMPLE,
      rangeStart: DAY_START,
      rangeEnd: DAY_END,
      minDurationMinutes: 30,
    });
    expect(slots.length).toBeGreaterThan(0);
    for (const slot of slots) {
      expect(slot.durationMinutes).toBeGreaterThanOrEqual(30);
    }
  });

  it("agenda chargé — moins de temps libre", () => {
    const simpleSlots = findFreeSlots({
      items: FIXTURE_SIMPLE,
      rangeStart: DAY_START,
      rangeEnd: DAY_END,
    });
    const busySlots = findFreeSlots({
      items: FIXTURE_BUSY,
      rangeStart: DAY_START,
      rangeEnd: DAY_END,
    });
    expect(sumFreeMinutes(busySlots)).toBeLessThan(sumFreeMinutes(simpleSlots));
  });

  it("respecte la durée minimale demandée", () => {
    const timeline = mergeCalendarItems({
      items: FIXTURE_BUSY,
      rangeStart: DAY_START,
      rangeEnd: DAY_END,
      timezone: "America/Montreal",
    });
    const slots = findFreeSlots({
      items: timeline.items,
      rangeStart: DAY_START,
      rangeEnd: DAY_END,
      minDurationMinutes: 60,
    });
    expect(slots.every((slot) => slot.durationMinutes >= 60)).toBe(true);
  });
});
