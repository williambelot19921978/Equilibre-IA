/**
 * EPIC 5A — Free Slot Engine.
 */

import type { CalendarItem, FreeSlot } from "../types/calendarItem";

function toMs(iso: string): number {
  return new Date(iso).getTime();
}

export function findFreeSlots(input: {
  readonly items: readonly CalendarItem[];
  readonly rangeStart: string;
  readonly rangeEnd: string;
  readonly minDurationMinutes?: number;
}): FreeSlot[] {
  const minDuration = input.minDurationMinutes ?? 15;
  const minMs = minDuration * 60 * 1000;
  const rangeStartMs = toMs(input.rangeStart);
  const rangeEndMs = toMs(input.rangeEnd);

  const busy = input.items
    .filter((item) => item.status !== "cancelled" && item.type !== "free")
    .map((item) => ({
      start: Math.max(toMs(item.start), rangeStartMs),
      end: Math.min(toMs(item.end), rangeEndMs),
    }))
    .filter((segment) => segment.end > segment.start)
    .sort((left, right) => left.start - right.start);

  const merged: Array<{ start: number; end: number }> = [];
  for (const segment of busy) {
    const last = merged[merged.length - 1];
    if (!last || segment.start > last.end) {
      merged.push({ ...segment });
    } else {
      last.end = Math.max(last.end, segment.end);
    }
  }

  const slots: FreeSlot[] = [];
  let cursor = rangeStartMs;

  for (const segment of merged) {
    if (segment.start - cursor >= minMs) {
      slots.push(buildSlot(cursor, segment.start));
    }
    cursor = Math.max(cursor, segment.end);
  }

  if (rangeEndMs - cursor >= minMs) {
    slots.push(buildSlot(cursor, rangeEndMs));
  }

  return slots;
}

function buildSlot(startMs: number, endMs: number): FreeSlot {
  const durationMinutes = Math.round((endMs - startMs) / 60_000);
  return {
    id: `free-${startMs}-${endMs}`,
    start: new Date(startMs).toISOString(),
    end: new Date(endMs).toISOString(),
    durationMinutes,
  };
}

export function sumFreeMinutes(slots: readonly FreeSlot[]): number {
  return slots.reduce((total, slot) => total + slot.durationMinutes, 0);
}
