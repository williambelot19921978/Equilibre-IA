/**
 * @vitest-environment happy-dom
 */
import { beforeEach, describe, expect, it } from "vitest";

import { OfflineSyncQueue } from "../sync/offlineQueue";
import { EXTERNAL_ITEM } from "../testing/fixtures";

describe("EPIC5B offlineQueue", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("enqueue et listPending", () => {
    const queue = new OfflineSyncQueue();
    queue.enqueue({
      id: "op-1",
      provider: "google",
      operation: "update",
      item: EXTERNAL_ITEM,
      eventId: "g-event-1",
    });

    const pending = queue.listPending();
    expect(pending).toHaveLength(1);
    expect(pending[0]?.status).toBe("pending");
  });

  it("markFailed puis retry via listPending", () => {
    const queue = new OfflineSyncQueue();
    queue.enqueue({
      id: "op-2",
      provider: "google",
      operation: "delete",
      eventId: "g-event-2",
    });
    queue.markFailed("op-2", "Network error");

    const pending = queue.listPending();
    expect(pending[0]?.status).toBe("failed");
    expect(pending[0]?.lastError).toBe("Network error");
    expect(pending[0]?.attempts).toBe(1);
  });

  it("markSynced retire de la file pending", () => {
    const queue = new OfflineSyncQueue();
    queue.enqueue({
      id: "op-3",
      provider: "google",
      operation: "create",
      item: EXTERNAL_ITEM,
    });
    queue.markSynced("op-3");
    expect(queue.listPending()).toHaveLength(0);
  });
});
