import { describe, expect, it, vi } from "vitest";

import { SyncEventBus } from "../events/syncEventBus";
import { buildConflictResolutions } from "../sync/conflictDetector";
import { detectSyncConflicts } from "../sync/conflictDetector";
import { LOCAL_LINKED_ITEM, EXTERNAL_ITEM_RENAMED } from "../testing/fixtures";

describe("EPIC5B syncEventBus", () => {
  it("émet SyncStarted, SyncCompleted, ConflictDetected", () => {
    const bus = new SyncEventBus();
    const received: string[] = [];
    bus.subscribe((event) => received.push(event.type));

    bus.emit({
      type: "SyncStarted",
      at: new Date().toISOString(),
      payload: { provider: "google", direction: "pull" },
    });

    const conflicts = detectSyncConflicts({
      localItems: [LOCAL_LINKED_ITEM],
      externalItems: [EXTERNAL_ITEM_RENAMED],
      changes: [],
    });
    const resolutions = buildConflictResolutions(conflicts);

    bus.emit({
      type: "ConflictDetected",
      at: new Date().toISOString(),
      payload: { resolutions },
    });

    bus.emit({
      type: "SyncCompleted",
      at: new Date().toISOString(),
      payload: {
        provider: "google",
        direction: "pull",
        success: true,
        itemCount: 1,
        message: "ok",
      },
    });

    expect(received).toEqual(["SyncStarted", "ConflictDetected", "SyncCompleted"]);
    expect(bus.getHistory()).toHaveLength(3);
  });

  it("unsubscribe arrête les notifications", () => {
    const bus = new SyncEventBus();
    const listener = vi.fn();
    const unsubscribe = bus.subscribe(listener);
    unsubscribe();

    bus.emit({
      type: "SyncStarted",
      at: new Date().toISOString(),
      payload: { provider: "google", direction: "push" },
    });

    expect(listener).not.toHaveBeenCalled();
  });
});
