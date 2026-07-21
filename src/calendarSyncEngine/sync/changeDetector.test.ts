import { describe, expect, it } from "vitest";

import { detectSyncChanges } from "../sync/changeDetector";
import {
  EXTERNAL_ITEM,
  EXTERNAL_ITEM_MOVED,
  LOCAL_LINKED_ITEM,
  syncItem,
} from "../testing/fixtures";

describe("EPIC5B changeDetector", () => {
  it("Google vide — aucun changement", () => {
    const changes = detectSyncChanges({ before: [], after: [] });
    expect(changes).toHaveLength(0);
  });

  it("Planning vide → Google rempli — created", () => {
    const changes = detectSyncChanges({ before: [], after: [EXTERNAL_ITEM] });
    expect(changes.some((change) => change.kind === "created")).toBe(true);
  });

  it("double modification horaire — time_changed", () => {
    const before = [LOCAL_LINKED_ITEM];
    const after = [
      syncItem({
        ...LOCAL_LINKED_ITEM,
        start: "2026-07-20T16:00:00.000Z",
        end: "2026-07-20T17:00:00.000Z",
      }),
    ];
    const changes = detectSyncChanges({ before, after });
    expect(changes.some((change) => change.kind === "time_changed")).toBe(true);
  });

  it("suppression locale — deleted", () => {
    const changes = detectSyncChanges({ before: [EXTERNAL_ITEM], after: [] });
    expect(changes.some((change) => change.kind === "deleted")).toBe(true);
  });

  it("titre modifié — title_changed", () => {
    const after = [syncItem({ ...EXTERNAL_ITEM, title: "Nouveau titre" })];
    const changes = detectSyncChanges({ before: [EXTERNAL_ITEM], after });
    expect(changes.some((change) => change.kind === "title_changed")).toBe(true);
  });

  it("événement déplacé jour différent — moved", () => {
    const after = [EXTERNAL_ITEM_MOVED];
    const changes = detectSyncChanges({ before: [EXTERNAL_ITEM], after });
    expect(changes.some((change) => change.kind === "moved")).toBe(true);
  });
});
