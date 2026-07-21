import { describe, expect, it } from "vitest";

import {
  CALENDAR_CONNECTOR_NOT_IMPLEMENTED,
  stubGoogleCalendarConnector,
} from "../contract/calendarConnector";

describe("EPIC5A CalendarConnector stubs", () => {
  it("connect retourne not implemented", async () => {
    const result = await stubGoogleCalendarConnector.connect();
    expect(result.success).toBe(false);
    expect(result.message).toBe(CALENDAR_CONNECTOR_NOT_IMPLEMENTED);
  });

  it("fetchEvents retourne not implemented", async () => {
    const result = await stubGoogleCalendarConnector.fetchEvents({
      start: "2026-07-20T00:00:00.000Z",
      end: "2026-07-20T23:59:59.999Z",
    });
    expect(result.success).toBe(false);
  });

  it("pushChanges retourne not implemented", async () => {
    const result = await stubGoogleCalendarConnector.pushChanges([]);
    expect(result.success).toBe(false);
  });
});
