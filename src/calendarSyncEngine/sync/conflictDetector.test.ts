import { describe, expect, it } from "vitest";

import { buildConflictResolutions, detectSyncConflicts } from "../sync/conflictDetector";
import { detectSyncChanges } from "../sync/changeDetector";
import {
  EXTERNAL_ITEM,
  EXTERNAL_ITEM_MOVED,
  EXTERNAL_ITEM_RENAMED,
  LOCAL_ITEM_MOVED,
  LOCAL_LINKED_ITEM,
  syncItem,
} from "../testing/fixtures";

describe("EPIC5B conflictDetector", () => {
  it("suppression distante — external_deleted", () => {
    const conflicts = detectSyncConflicts({
      localItems: [LOCAL_LINKED_ITEM],
      externalItems: [],
      changes: [],
    });
    expect(conflicts.some((conflict) => conflict.kind === "external_deleted")).toBe(true);
  });

  it("double modification — both_moved", () => {
    const changes = detectSyncChanges({
      before: [LOCAL_LINKED_ITEM],
      after: [LOCAL_ITEM_MOVED],
    });
    const conflicts = detectSyncConflicts({
      localItems: [LOCAL_ITEM_MOVED],
      externalItems: [EXTERNAL_ITEM_MOVED],
      changes,
    });
    expect(conflicts.some((conflict) => conflict.kind === "both_moved")).toBe(true);
  });

  it("horaire différent — time_mismatch", () => {
    const conflicts = detectSyncConflicts({
      localItems: [LOCAL_LINKED_ITEM],
      externalItems: [EXTERNAL_ITEM_MOVED],
      changes: [],
    });
    expect(conflicts.some((conflict) => conflict.kind === "time_mismatch")).toBe(true);
  });

  it("titre modifié — title_mismatch", () => {
    const conflicts = detectSyncConflicts({
      localItems: [LOCAL_LINKED_ITEM],
      externalItems: [EXTERNAL_ITEM_RENAMED],
      changes: [],
    });
    expect(conflicts.some((conflict) => conflict.kind === "title_mismatch")).toBe(true);
  });

  it("participants différents — participants_mismatch", () => {
    const externalWithGuest = syncItem({
      ...EXTERNAL_ITEM,
      participants: [{ id: "p1", email: "guest@example.com" }],
    });
    const conflicts = detectSyncConflicts({
      localItems: [LOCAL_LINKED_ITEM],
      externalItems: [externalWithGuest],
      changes: [],
    });
    expect(conflicts.some((conflict) => conflict.kind === "participants_mismatch")).toBe(true);
  });

  it("buildConflictResolutions ne résout pas automatiquement", () => {
    const conflicts = detectSyncConflicts({
      localItems: [LOCAL_LINKED_ITEM],
      externalItems: [EXTERNAL_ITEM_RENAMED],
      changes: [],
    });
    const resolutions = buildConflictResolutions(conflicts);
    expect(resolutions.length).toBeGreaterThan(0);
    expect(resolutions.every((resolution) => resolution.resolved === false)).toBe(true);
    expect(resolutions[0]?.preview.before.length).toBeGreaterThan(0);
    expect(resolutions[0]?.options).toContain("keep_local");
  });
});
