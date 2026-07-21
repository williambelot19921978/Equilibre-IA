/**
 * EPIC 5A — Conflict Engine.
 */

import type { CalendarConflict, CalendarItem } from "../types/calendarItem";

function rangesOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

function isActiveItem(item: CalendarItem): boolean {
  return item.status !== "cancelled" && item.type !== "free";
}

export function detectCalendarConflicts(items: readonly CalendarItem[]): CalendarConflict[] {
  const conflicts: CalendarConflict[] = [];
  const active = items.filter(isActiveItem);

  for (const item of active) {
    if (new Date(item.end).getTime() <= new Date(item.start).getTime()) {
      conflicts.push({
        id: `impossible-${item.id}`,
        kind: "impossible_slot",
        itemIds: [item.id],
        message: `Créneau impossible pour « ${item.title} ».`,
        severity: "high",
      });
    }
  }

  for (let index = 0; index < active.length; index += 1) {
    for (let other = index + 1; other < active.length; other += 1) {
      const left = active[index]!;
      const right = active[other]!;
      const leftStart = new Date(left.start).getTime();
      const leftEnd = new Date(left.end).getTime();
      const rightStart = new Date(right.start).getTime();
      const rightEnd = new Date(right.end).getTime();

      if (!rangesOverlap(leftStart, leftEnd, rightStart, rightEnd)) continue;

      if (
        left.title.trim().toLowerCase() === right.title.trim().toLowerCase() &&
        Math.abs(leftStart - rightStart) < 5 * 60 * 1000
      ) {
        conflicts.push({
          id: `dup-${left.id}-${right.id}`,
          kind: "duplicate",
          itemIds: [left.id, right.id],
          message: `Doublon probable : « ${left.title} ».`,
          severity: "medium",
        });
        continue;
      }

      if (
        (left.type === "goal" && right.type === "appointment") ||
        (left.type === "appointment" && right.type === "goal")
      ) {
        conflicts.push({
          id: `goal-appt-${left.id}-${right.id}`,
          kind: "goal_during_appointment",
          itemIds: [left.id, right.id],
          message: "Objectif planifié pendant un rendez-vous.",
          severity: "high",
        });
        continue;
      }

      if (
        left.syncState === "external" &&
        right.syncState === "external" &&
        left.source !== right.source
      ) {
        conflicts.push({
          id: `sync-${left.id}-${right.id}`,
          kind: "sync_incompatible",
          itemIds: [left.id, right.id],
          message: "Deux événements synchronisés incompatibles.",
          severity: "high",
        });
        continue;
      }

      if (leftEnd <= leftStart || rightEnd <= rightStart) {
        conflicts.push({
          id: `impossible-${left.id}-${right.id}`,
          kind: "impossible_slot",
          itemIds: [left.id, right.id],
          message: "Créneau impossible (durée nulle ou inversée).",
          severity: "high",
        });
        continue;
      }

      conflicts.push({
        id: `overlap-${left.id}-${right.id}`,
        kind: "overlap",
        itemIds: [left.id, right.id],
        message: `Chevauchement : « ${left.title} » et « ${right.title} ».`,
        severity: left.type === "appointment" || right.type === "appointment" ? "high" : "medium",
      });
    }
  }

  const seen = new Set<string>();
  return conflicts.filter((conflict) => {
    if (seen.has(conflict.id)) return false;
    seen.add(conflict.id);
    return true;
  });
}
