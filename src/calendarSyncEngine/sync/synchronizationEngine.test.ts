/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it, vi } from "vitest";

import type { ICalendarProvider } from "../../planningCalendarEngine/providers/calendarProvider";
import { PlanningCalendarEngine } from "../../planningCalendarEngine/engine/planningCalendarEngine";
import { GoogleCalendarConnector } from "../connectors/googleCalendarConnector";
import { SyncEventBus } from "../events/syncEventBus";
import { OfflineSyncQueue } from "../sync/offlineQueue";
import { SynchronizationEngine } from "../sync/synchronizationEngine";
import { EXTERNAL_ITEM, DAY_END, DAY_START } from "../testing/fixtures";
import { FIXTURE_SIMPLE, item } from "../../planningCalendarEngine/testing/fixtures";

function mockProvider(id: string, items: readonly ReturnType<typeof item>[]): ICalendarProvider {
  return {
    id,
    label: id,
    fetchItems: vi.fn(async () => ({
      items,
      syncState: "local" as const,
      available: true,
    })),
  };
}

describe("EPIC5B SynchronizationEngine", () => {
  const syncContext = {
    userId: "user-1",
    householdId: "hh-1",
    rangeStart: DAY_START,
    rangeEnd: DAY_END,
  };

  it("pull synchronise et émet SyncCompleted", async () => {
    const eventBus = new SyncEventBus();
    const events: string[] = [];
    eventBus.subscribe((event) => events.push(event.type));

    const planningEngine = new PlanningCalendarEngine({
      providers: [
        mockProvider("internal-planning", FIXTURE_SIMPLE),
        mockProvider("google-calendar", [EXTERNAL_ITEM]),
      ],
      rescheduleNonUrgentTasks: vi.fn(),
      defaultTimezone: "America/Montreal",
    });

    const googleConnector = new GoogleCalendarConnector({
      getConnection: vi.fn(),
      startAuth: vi.fn(),
      sync: vi.fn(async () => ({ synced: 2, message: "2 sync" })),
      disconnect: vi.fn(),
      loadEvents: vi.fn(),
    });

    const engine = new SynchronizationEngine({
      planningEngine,
      googleConnector,
      offlineQueue: new OfflineSyncQueue(),
      eventBus,
    });

    const result = await engine.pull(syncContext, { force: true });
    expect(result.success).toBe(true);
    expect(result.pulledCount).toBe(2);
    expect(events).toContain("SyncStarted");
    expect(events).toContain("SyncCompleted");
  });

  it("push traite la file offline", async () => {
    const offlineQueue = new OfflineSyncQueue();
    offlineQueue.enqueue({
      id: "push-1",
      provider: "google",
      operation: "update",
      item: EXTERNAL_ITEM,
      eventId: "g-event-1",
    });

    const invokeMutate = vi.fn(async () => ({ success: true, message: "updated" }));
    const googleConnector = new GoogleCalendarConnector({
      getConnection: vi.fn(),
      startAuth: vi.fn(),
      sync: vi.fn(),
      disconnect: vi.fn(),
      loadEvents: vi.fn(),
      invokeMutate,
    });

    const engine = new SynchronizationEngine({
      planningEngine: new PlanningCalendarEngine({
        providers: [mockProvider("internal-planning", [])],
        rescheduleNonUrgentTasks: vi.fn(),
        defaultTimezone: "America/Montreal",
      }),
      googleConnector,
      offlineQueue,
      eventBus: new SyncEventBus(),
    });

    googleConnector.setContext({ userId: "user-1", householdId: "hh-1" });

    const result = await engine.push(syncContext);
    expect(result.success).toBe(true);
    expect(result.pushedCount).toBe(1);
    expect(invokeMutate).toHaveBeenCalled();
  });

  it("push retry après échec réseau", async () => {
    const offlineQueue = new OfflineSyncQueue();
    offlineQueue.enqueue({
      id: "push-fail",
      provider: "google",
      operation: "delete",
      eventId: "g-event-9",
    });

    const invokeMutate = vi.fn(async () => ({ success: false, message: "offline" }));
    const googleConnector = new GoogleCalendarConnector({
      getConnection: vi.fn(),
      startAuth: vi.fn(),
      sync: vi.fn(),
      disconnect: vi.fn(),
      loadEvents: vi.fn(),
      invokeMutate,
    });

    const engine = new SynchronizationEngine({
      planningEngine: new PlanningCalendarEngine({
        providers: [mockProvider("internal-planning", [])],
        rescheduleNonUrgentTasks: vi.fn(),
        defaultTimezone: "America/Montreal",
      }),
      googleConnector,
      offlineQueue,
      eventBus: new SyncEventBus(),
    });

    googleConnector.setContext({ userId: "user-1", householdId: "hh-1" });

    const first = await engine.retryFailedPush(syncContext);
    expect(first.success).toBe(false);
    expect(first.failures.length).toBeGreaterThan(0);
    expect(offlineQueue.listPending()[0]?.status).toBe("failed");

    invokeMutate.mockResolvedValueOnce({ success: true, message: "ok" });
    const second = await engine.retryFailedPush(syncContext);
    expect(second.success).toBe(true);
    expect(second.pushedCount).toBe(1);
  });

  it("executePlanningCommand délègue au planning engine", async () => {
    const executePlanningCommand = vi.fn(async () => ({
      success: true,
      message: "ok",
      scope: "internal" as const,
    }));

    const planningEngine = {
      executePlanningCommand,
      reorganizeDay: vi.fn(),
      buildSnapshot: vi.fn(),
    } as unknown as PlanningCalendarEngine;

    const engine = new SynchronizationEngine({
      planningEngine,
      googleConnector: new GoogleCalendarConnector({
        getConnection: vi.fn(),
        startAuth: vi.fn(),
        sync: vi.fn(),
        disconnect: vi.fn(),
        loadEvents: vi.fn(),
      }),
      offlineQueue: new OfflineSyncQueue(),
      eventBus: new SyncEventBus(),
    });

    const result = await engine.executePlanningCommand({
      userId: "user-1",
      target: {
        operation: "createEvent",
        scope: "internal",
        summary: "Test",
      },
      payload: {},
    });

    expect(result.success).toBe(true);
    expect(executePlanningCommand).toHaveBeenCalled();
  });
});
