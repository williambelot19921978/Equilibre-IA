import { describe, expect, it } from "vitest";

import { getLocalDayBounds, overlapsLocalDay } from "./dayBounds";

describe("dayBounds", () => {
  it("returns local day bounds for a date", () => {
    const bounds = getLocalDayBounds("2026-07-13");
    expect(new Date(bounds.end).getTime()).toBeGreaterThan(
      new Date(bounds.start).getTime(),
    );
    expect(new Date(bounds.start).getDate()).toBe(13);
    expect(new Date(bounds.end).getDate()).toBe(13);
  });

  it("detects overlap for items inside the day", () => {
    expect(
      overlapsLocalDay({
        date: "2026-07-13",
        startsAt: new Date("2026-07-13T10:00:00").toISOString(),
        endsAt: new Date("2026-07-13T11:00:00").toISOString(),
      }),
    ).toBe(true);
  });

  it("detects overlap for items crossing midnight into the day", () => {
    expect(
      overlapsLocalDay({
        date: "2026-07-13",
        startsAt: new Date("2026-07-12T23:30:00").toISOString(),
        endsAt: new Date("2026-07-13T01:00:00").toISOString(),
      }),
    ).toBe(true);
  });

  it("rejects items fully outside the day", () => {
    expect(
      overlapsLocalDay({
        date: "2026-07-13",
        startsAt: new Date("2026-07-14T09:00:00").toISOString(),
        endsAt: new Date("2026-07-14T10:00:00").toISOString(),
      }),
    ).toBe(false);
  });
});
