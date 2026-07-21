/**
 * EPIC 5B — Sync conflict detection (no auto-resolution).
 */

import type { CalendarItem } from "../../planningCalendarEngine/types/calendarItem";
import type { SyncChange, SyncConflictKind } from "../types/syncTypes";
import type { ConflictResolution, ConflictResolutionPreview } from "../types/syncTypes";

export type SyncConflict = {
  readonly id: string;
  readonly kind: SyncConflictKind;
  readonly localItem?: CalendarItem;
  readonly externalItem?: CalendarItem;
  readonly changes: readonly SyncChange[];
  readonly message: string;
};

function previewForConflict(
  conflict: SyncConflict,
): ConflictResolutionPreview {
  const local = conflict.localItem;
  const external = conflict.externalItem;
  return {
    before: [
      local ? `Local : « ${local.title} » ${local.start.slice(0, 16)}` : "Local : absent",
      external ? `Externe : « ${external.title} » ${external.start.slice(0, 16)}` : "Externe : absent",
    ],
    after: ["Résolution en attente — choix utilisateur requis."],
    source: local?.origin === "google" ? "google" : "internal",
    destination: external?.origin === "google" ? "google" : "internal",
    differences: conflict.changes.map((change) => `${change.kind} (${change.itemId})`),
    impact: "La timeline unifiée restera en conflit jusqu'à validation explicite.",
  };
}

export function detectSyncConflicts(input: {
  readonly localItems: readonly CalendarItem[];
  readonly externalItems: readonly CalendarItem[];
  readonly changes: readonly SyncChange[];
}): SyncConflict[] {
  const conflicts: SyncConflict[] = [];
  const localByExternalId = new Map<string, CalendarItem>();
  const externalByExternalId = new Map<string, CalendarItem>();

  for (const item of input.localItems) {
    const extId = String(item.metadata.externalEventId ?? item.metadata.googleEventId ?? "");
    if (extId) localByExternalId.set(extId, item);
  }
  for (const item of input.externalItems) {
    const extId = String(item.metadata.externalEventId ?? item.metadata.googleEventId ?? "");
    if (extId) externalByExternalId.set(extId, item);
  }

  for (const [extId, localItem] of localByExternalId) {
    const externalItem = externalByExternalId.get(extId);
    const relatedChanges = input.changes.filter((change) => change.externalId === extId || change.itemId === localItem.id);

    if (!externalItem) {
      conflicts.push({
        id: `conflict-ext-del-${extId}`,
        kind: "external_deleted",
        localItem,
        changes: relatedChanges,
        message: `« ${localItem.title} » supprimé côté agenda externe.`,
      });
      continue;
    }

    const localMoved = relatedChanges.some((change) => change.kind === "moved" || change.kind === "time_changed");
    const externalMoved =
      externalItem.start !== localItem.start || externalItem.end !== localItem.end;

    if (localMoved && externalMoved) {
      conflicts.push({
        id: `conflict-both-moved-${extId}`,
        kind: "both_moved",
        localItem,
        externalItem,
        changes: relatedChanges,
        message: `« ${localItem.title} » déplacé des deux côtés.`,
      });
    } else if (externalItem.title !== localItem.title) {
      conflicts.push({
        id: `conflict-title-${extId}`,
        kind: "title_mismatch",
        localItem,
        externalItem,
        changes: relatedChanges,
        message: `Titre différent pour « ${localItem.title} » / « ${externalItem.title} ».`,
      });
    } else if (externalMoved || localMoved) {
      conflicts.push({
        id: `conflict-time-${extId}`,
        kind: "time_mismatch",
        localItem,
        externalItem,
        changes: relatedChanges,
        message: `Horaire différent pour « ${localItem.title} ».`,
      });
    }

    const localParticipants = JSON.stringify(localItem.participants);
    const externalParticipants = JSON.stringify(externalItem.participants);
    if (localParticipants !== externalParticipants) {
      conflicts.push({
        id: `conflict-participants-${extId}`,
        kind: "participants_mismatch",
        localItem,
        externalItem,
        changes: relatedChanges,
        message: `Participants différents pour « ${localItem.title} ».`,
      });
    }
  }

  for (const change of input.changes) {
    if (change.kind === "deleted" && change.provider !== "internal") {
      const exists = conflicts.some((conflict) => conflict.id.includes(change.itemId));
      if (!exists) {
        conflicts.push({
          id: `conflict-local-del-${change.itemId}`,
          kind: "local_deleted",
          changes: [change],
          message: `Événement ${change.itemId} supprimé localement.`,
        });
      }
    }
  }

  return conflicts;
}

export function buildConflictResolutions(conflicts: readonly SyncConflict[]): ConflictResolution[] {
  return conflicts.map((conflict) => ({
    id: `resolution-${conflict.id}`,
    conflictKind: conflict.kind,
    itemIds: [conflict.localItem?.id, conflict.externalItem?.id].filter(Boolean) as string[],
    message: conflict.message,
    preview: previewForConflict(conflict),
    options: ["keep_local", "keep_external", "merge_manual", "skip"],
    resolved: false,
  }));
}
