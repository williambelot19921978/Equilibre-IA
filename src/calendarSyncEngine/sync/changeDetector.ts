/**
 * EPIC 5B — Detect changes between sync snapshots.
 */

import type { CalendarItem } from "../../planningCalendarEngine/types/calendarItem";
import type { SyncChange, SyncChangeKind, SyncProviderId } from "../types/syncTypes";

function providerFromItem(item: CalendarItem): SyncProviderId {
  if (item.origin === "google") return "google";
  if (item.origin === "outlook") return "outlook";
  if (item.origin === "apple") return "apple";
  return "internal";
}

function buildChange(
  kind: SyncChangeKind,
  item: CalendarItem,
  before?: Partial<CalendarItem>,
  after?: Partial<CalendarItem>,
): SyncChange {
  return {
    id: `change-${item.id}-${kind}-${Date.now()}`,
    provider: providerFromItem(item),
    kind,
    itemId: item.id,
    externalId: String(item.metadata.externalEventId ?? item.metadata.googleEventId ?? ""),
    before,
    after,
    detectedAt: new Date().toISOString(),
  };
}

export function detectSyncChanges(input: {
  readonly before: readonly CalendarItem[];
  readonly after: readonly CalendarItem[];
}): SyncChange[] {
  const changes: SyncChange[] = [];
  const beforeMap = new Map(input.before.map((item) => [item.id, item]));
  const afterMap = new Map(input.after.map((item) => [item.id, item]));

  for (const [id, afterItem] of afterMap) {
    const beforeItem = beforeMap.get(id);
    if (!beforeItem) {
      changes.push(buildChange("created", afterItem, undefined, afterItem));
      continue;
    }

    if (beforeItem.start !== afterItem.start || beforeItem.end !== afterItem.end) {
      changes.push(
        buildChange("time_changed", afterItem, { start: beforeItem.start, end: beforeItem.end }, {
          start: afterItem.start,
          end: afterItem.end,
        }),
      );
      if (beforeItem.start.slice(0, 10) !== afterItem.start.slice(0, 10)) {
        changes.push(buildChange("moved", afterItem));
      }
    }

    if (beforeItem.title !== afterItem.title) {
      changes.push(
        buildChange("title_changed", afterItem, { title: beforeItem.title }, { title: afterItem.title }),
      );
    }

    const beforeParticipants = JSON.stringify(beforeItem.participants);
    const afterParticipants = JSON.stringify(afterItem.participants);
    if (beforeParticipants !== afterParticipants) {
      changes.push(buildChange("participants_changed", afterItem));
    }

    if (beforeItem.status !== "cancelled" && afterItem.status === "cancelled") {
      changes.push(buildChange("deleted", afterItem, beforeItem, afterItem));
    }
  }

  for (const [id, beforeItem] of beforeMap) {
    if (!afterMap.has(id)) {
      changes.push(buildChange("deleted", beforeItem, beforeItem, undefined));
    }
  }

  return changes;
}
