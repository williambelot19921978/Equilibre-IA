import { describe, expect, it } from "vitest";

import { combineDateAndTime } from "../time/daySchedule";
import type { CalendarItemRecord } from "../../types/database";
import {
  getCalendarDayBounds,
  normalizeCalendarItemToConstraint,
  normalizeCalendarItemsForPlanning,
  validateCalendarItemForPlanning,
} from "./normalizeCalendarConstraint";

function makeManualItem(
  overrides: Partial<CalendarItemRecord> = {},
): CalendarItemRecord {
  return {
    id: "item-1",
    household_id: "household-1",
    user_id: "user-1",
    task_id: null,
    title: "Médecin",
    item_type: "event",
    starts_at: combineDateAndTime("2026-07-13", "14:00"),
    ends_at: combineDateAndTime("2026-07-13", "15:00"),
    locked: true,
    source: "user",
    details: { constraintType: "appointment", status: "accepted" },
    created_at: "2026-07-13T10:00:00.000Z",
    updated_at: "2026-07-13T10:00:00.000Z",
    ...overrides,
  };
}

describe("normalizeCalendarItemToConstraint", () => {
  const targetDate = "2026-07-13";

  it("A. accepts a valid manual appointment", () => {
    const result = normalizeCalendarItemToConstraint(
      makeManualItem(),
      targetDate,
      { wakeTime: "07:00", bedTime: "22:00" },
    );

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.constraint.title).toBe("Médecin");
      expect(result.constraint.source).toBe("manual");
      expect(result.constraint.locked).toBe(true);
    }
  });

  it("B. rejects end before start", () => {
    const result = normalizeCalendarItemToConstraint(
      makeManualItem({
        starts_at: combineDateAndTime(targetDate, "14:00"),
        ends_at: combineDateAndTime(targetDate, "13:00"),
      }),
      targetDate,
    );

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.reason).toContain("se termine avant");
    }
  });

  it("C. clips an appointment crossing midnight", () => {
    const { dayEnd } = getCalendarDayBounds(targetDate);
    const result = normalizeCalendarItemToConstraint(
      makeManualItem({
        starts_at: combineDateAndTime(targetDate, "23:00"),
        ends_at: combineDateAndTime("2026-07-14", "01:00"),
      }),
      targetDate,
    );

    expect(result.success).toBe(true);

    if (result.success) {
      expect(new Date(result.constraint.endsAt).getTime()).toBeLessThanOrEqual(
        new Date(dayEnd).getTime(),
      );
    }
  });

  it("D. rejects an appointment outside the target date", () => {
    const result = normalizeCalendarItemToConstraint(
      makeManualItem({
        starts_at: combineDateAndTime("2026-07-14", "12:00"),
        ends_at: combineDateAndTime("2026-07-14", "13:00"),
      }),
      targetDate,
    );

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.reason).toContain("Hors de la date ciblée");
    }
  });

  it("G. clips an appointment starting before wake", () => {
    const result = normalizeCalendarItemToConstraint(
      makeManualItem({
        starts_at: combineDateAndTime(targetDate, "05:00"),
        ends_at: combineDateAndTime(targetDate, "08:00"),
      }),
      targetDate,
      { wakeTime: "07:00", bedTime: "22:00" },
    );

    expect(result.success).toBe(true);

    if (result.success) {
      expect(new Date(result.constraint.startsAt).getTime()).toBeGreaterThanOrEqual(
        new Date(combineDateAndTime(targetDate, "07:00")).getTime(),
      );
    }
  });

  it("H. clips an appointment ending after bed", () => {
    const result = normalizeCalendarItemToConstraint(
      makeManualItem({
        starts_at: combineDateAndTime(targetDate, "21:00"),
        ends_at: combineDateAndTime(targetDate, "23:30"),
      }),
      targetDate,
      { wakeTime: "07:00", bedTime: "22:00" },
    );

    expect(result.success).toBe(true);

    if (result.success) {
      expect(new Date(result.constraint.endsAt).getTime()).toBeLessThanOrEqual(
        new Date(combineDateAndTime(targetDate, "22:00")).getTime(),
      );
    }
  });

  it("L. invalid item is ignored without throwing", () => {
    const { ignored, constraints } = normalizeCalendarItemsForPlanning({
      items: [
        makeManualItem({ starts_at: "invalid", ends_at: combineDateAndTime(targetDate, "15:00") }),
        makeManualItem({ id: "item-2", title: "Valide" }),
      ],
      targetDate,
      wakeTime: "07:00",
      bedTime: "22:00",
    });

    expect(constraints).toHaveLength(1);
    expect(ignored).toHaveLength(1);
    expect(ignored[0].reason).toContain("invalide");
  });
});

describe("validateCalendarItemForPlanning", () => {
  it("flags manual items without locked=true", () => {
    const validation = validateCalendarItemForPlanning(
      makeManualItem({ locked: false }),
    );

    expect(validation.valid).toBe(false);
  });

  it("flags manual items with wrong item_type", () => {
    const validation = validateCalendarItemForPlanning(
      makeManualItem({ item_type: "task" }),
    );

    expect(validation.valid).toBe(false);

    if (!validation.valid) {
      expect(validation.reason).toContain("event");
    }
  });
});
