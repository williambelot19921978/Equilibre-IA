import { describe, expect, it } from "vitest";

import { mergeCalendarItems } from "../merge/mergeEngine";
import {
  DAY_END,
  DAY_START,
  FIXTURE_BUSY,
  FIXTURE_MULTI_PROVIDER,
  FIXTURE_OVERLAPS,
  FIXTURE_SIMPLE,
  item,
} from "../testing/fixtures";

describe("EPIC5A Merge Engine", () => {
  it("fusionne et trie une timeline unique", () => {
    const shuffled = [FIXTURE_SIMPLE[1]!, FIXTURE_SIMPLE[0]!];
    const timeline = mergeCalendarItems({
      items: shuffled,
      rangeStart: DAY_START,
      rangeEnd: DAY_END,
      timezone: "America/Montreal",
    });

    expect(timeline.items).toHaveLength(2);
    expect(timeline.items[0]?.id).toBe("evt-1");
    expect(timeline.items[1]?.id).toBe("evt-2");
  });

  it("dédoublonne par id", () => {
    const duplicate = item({
      id: "evt-1",
      title: "Version récente",
      start: "2026-07-20T09:00:00.000Z",
      end: "2026-07-20T10:00:00.000Z",
      metadata: { updatedAt: "2026-07-20T12:00:00.000Z" },
    });
    const timeline = mergeCalendarItems({
      items: [...FIXTURE_SIMPLE, duplicate],
      rangeStart: DAY_START,
      rangeEnd: DAY_END,
      timezone: "America/Montreal",
    });

    expect(timeline.items.filter((entry) => entry.id === "evt-1")).toHaveLength(1);
    expect(timeline.items[0]?.title).toBe("Version récente");
  });

  it("supporte plusieurs providers sans distinction de source dans l'ordre", () => {
    const timeline = mergeCalendarItems({
      items: FIXTURE_MULTI_PROVIDER,
      rangeStart: DAY_START,
      rangeEnd: DAY_END,
      timezone: "America/Montreal",
    });

    expect(timeline.items.length).toBeGreaterThanOrEqual(4);
    const starts = timeline.items.map((entry) => new Date(entry.start).getTime());
    expect(starts).toEqual([...starts].sort((a, b) => a - b));
  });

  it("agenda chargé — conserve tous les événements actifs", () => {
    const timeline = mergeCalendarItems({
      items: FIXTURE_BUSY,
      rangeStart: DAY_START,
      rangeEnd: DAY_END,
      timezone: "America/Montreal",
    });
    expect(timeline.items).toHaveLength(4);
  });

  it("agenda avec chevauchements — items présents dans la timeline", () => {
    const timeline = mergeCalendarItems({
      items: FIXTURE_OVERLAPS,
      rangeStart: DAY_START,
      rangeEnd: DAY_END,
      timezone: "America/Montreal",
    });
    expect(timeline.items).toHaveLength(2);
  });
});
