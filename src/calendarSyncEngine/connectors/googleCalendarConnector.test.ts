import { describe, expect, it, vi } from "vitest";

import {
  GOOGLE_WRITE_SCOPE_REQUIRED,
  GoogleCalendarConnector,
} from "../connectors/googleCalendarConnector";
import { externalEventToCalendarItem } from "../mappers/externalEventMapper";
import { externalRecord } from "../testing/fixtures";

describe("EPIC5B GoogleCalendarConnector", () => {
  const context = { userId: "user-1", householdId: "hh-1" };

  it("connect retourne redirectUrl OAuth", async () => {
    const connector = new GoogleCalendarConnector({
      getConnection: vi.fn(),
      startAuth: vi.fn(async () => ({ authUrl: "https://accounts.google.com/o/oauth2" })),
      sync: vi.fn(),
      disconnect: vi.fn(),
      loadEvents: vi.fn(),
    });
    connector.setContext(context);

    const result = await connector.connect();
    expect(result.success).toBe(true);
    expect(result.redirectUrl).toContain("google.com");
  });

  it("fetchEvents charge depuis external_calendar_events", async () => {
    const record = externalRecord({ external_event_id: "evt-42", title: "Test" });
    const connector = new GoogleCalendarConnector({
      getConnection: vi.fn(),
      startAuth: vi.fn(),
      sync: vi.fn(),
      disconnect: vi.fn(),
      loadEvents: vi.fn(async () => [record]),
    });
    connector.setContext(context);

    const result = await connector.fetchEvents({
      start: "2026-07-20T00:00:00.000Z",
      end: "2026-07-20T23:59:59.999Z",
    });

    expect(result.success).toBe(true);
    expect(result.items).toHaveLength(1);
    expect(result.items?.[0]?.origin).toBe("google");
  });

  it("pullSync délègue à sync edge function", async () => {
    const sync = vi.fn(async () => ({ synced: 3, message: "3 sync" }));
    const connector = new GoogleCalendarConnector({
      getConnection: vi.fn(),
      startAuth: vi.fn(),
      sync,
      disconnect: vi.fn(),
      loadEvents: vi.fn(),
    });
    connector.setContext(context);

    const result = await connector.pullSync(true);
    expect(sync).toHaveBeenCalledWith({ householdId: "hh-1", userId: "user-1", force: true });
    expect(result.synced).toBe(3);
  });

  it("createEvent sans invokeMutate retourne scope requis", async () => {
    const connector = new GoogleCalendarConnector({
      getConnection: vi.fn(),
      startAuth: vi.fn(),
      sync: vi.fn(),
      disconnect: vi.fn(),
      loadEvents: vi.fn(),
    });
    connector.setContext(context);

    const item = externalEventToCalendarItem(
      externalRecord({ external_event_id: "x", title: "X" }),
    );
    const result = await connector.createEvent(item);
    expect(result.success).toBe(false);
    expect(result.message).toBe(GOOGLE_WRITE_SCOPE_REQUIRED);
  });

  it("createEvent avec invokeMutate délègue la mutation", async () => {
    const invokeMutate = vi.fn(async () => ({ success: true, message: "ok" }));
    const connector = new GoogleCalendarConnector({
      getConnection: vi.fn(),
      startAuth: vi.fn(),
      sync: vi.fn(),
      disconnect: vi.fn(),
      loadEvents: vi.fn(),
      invokeMutate,
    });
    connector.setContext(context);

    const item = externalEventToCalendarItem(
      externalRecord({ external_event_id: "x", title: "X" }),
    );
    const result = await connector.createEvent(item);
    expect(invokeMutate).toHaveBeenCalled();
    expect(result.success).toBe(true);
  });

  it("disconnect appelle edge function", async () => {
    const disconnect = vi.fn(async () => undefined);
    const connector = new GoogleCalendarConnector({
      getConnection: vi.fn(),
      startAuth: vi.fn(),
      sync: vi.fn(),
      disconnect,
      loadEvents: vi.fn(),
    });
    connector.setContext(context);

    const result = await connector.disconnect();
    expect(disconnect).toHaveBeenCalledWith({ householdId: "hh-1" });
    expect(result.success).toBe(true);
  });
});
