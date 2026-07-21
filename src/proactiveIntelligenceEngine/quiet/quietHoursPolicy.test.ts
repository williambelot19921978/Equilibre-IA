import { describe, expect, it } from "vitest";

import { evaluateQuietHours, DEFAULT_QUIET_HOURS } from "./quietHoursPolicy";
import { meetingEvent, sportEvent, vacationEvent } from "../testing/fixtures";

describe("QuietHoursPolicy", () => {
  it("diffère pendant heures de sommeil", () => {
    const result = evaluateQuietHours({
      now: "2026-07-20T23:30:00.000Z",
      config: DEFAULT_QUIET_HOURS,
      calendarEvents: [],
    });

    expect(result.isQuiet).toBe(true);
    expect(result.reason).toContain("sommeil");
  });

  it("diffère pendant vacances", () => {
    const result = evaluateQuietHours({
      now: "2026-07-20T10:00:00.000Z",
      config: { ...DEFAULT_QUIET_HOURS, onVacation: true },
      calendarEvents: [],
    });

    expect(result.isQuiet).toBe(true);
    expect(result.reason).toContain("Vacances");
  });

  it("diffère pendant réunion en cours", () => {
    const event = meetingEvent(9);
    const result = evaluateQuietHours({
      now: "2026-07-20T09:30:00.000Z",
      config: DEFAULT_QUIET_HOURS,
      calendarEvents: [event],
    });

    expect(result.isQuiet).toBe(true);
    expect(result.deferUntil).toBe(event.end);
  });

  it("diffère pendant sport", () => {
    const event = sportEvent(18);
    const result = evaluateQuietHours({
      now: "2026-07-20T18:30:00.000Z",
      config: DEFAULT_QUIET_HOURS,
      calendarEvents: [event],
    });

    expect(result.isQuiet).toBe(true);
  });

  it("autorise en dehors des périodes sensibles", () => {
    const result = evaluateQuietHours({
      now: "2026-07-20T10:00:00.000Z",
      config: DEFAULT_QUIET_HOURS,
      calendarEvents: [vacationEvent()],
    });

    expect(result.isQuiet).toBe(false);
  });
});
