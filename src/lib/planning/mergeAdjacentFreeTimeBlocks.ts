import type { DayTimelineEntry } from "./displayedDayTimeline";

function isMergeableFreeEntry(entry: DayTimelineEntry): boolean {
  if (entry.completed) return false;
  if (entry.proposedWorkoutSession) return false;
  if (entry.primarySuggestion) return false;
  if (entry.locked) return false;
  if (entry.visualType === "sport" && entry.blockKind !== "free_slot") return false;

  return (
    entry.blockKind === "free_slot" ||
    (entry.visualType === "free" && entry.origin === "computed")
  );
}

function isHardSeparator(entry: DayTimelineEntry): boolean {
  if (entry.locked) return true;
  if (entry.completed) return true;
  if (entry.calendarItemId && entry.origin === "persisted") return true;
  if (
    entry.visualType === "work" ||
    entry.visualType === "appointment" ||
    entry.visualType === "children_routine" ||
    entry.visualType === "commute" ||
    entry.visualType === "wake" ||
    entry.visualType === "sleep"
  ) {
    return true;
  }
  if (entry.blockKind === "task" && entry.visualType !== "free") return true;
  return false;
}

function formatFreeTitle(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours > 0 && remainder > 0) return `Temps libre — ${hours} h ${remainder} min`;
  if (hours > 0) return `Temps libre — ${hours} h`;
  return `Temps libre — ${minutes} min`;
}

function durationMinutes(startsAt: string, endsAt: string): number {
  return Math.round(
    (new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 60_000,
  );
}

export function mergeAdjacentFreeTimeBlocks(
  entries: DayTimelineEntry[],
): DayTimelineEntry[] {
  if (entries.length === 0) return entries;

  const sorted = [...entries].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );

  const merged: DayTimelineEntry[] = [];

  for (const entry of sorted) {
    const last = merged[merged.length - 1];

    if (
      last &&
      isMergeableFreeEntry(last) &&
      isMergeableFreeEntry(entry) &&
      !isHardSeparator(last) &&
      !isHardSeparator(entry) &&
      new Date(last.endsAt).getTime() >= new Date(entry.startsAt).getTime() - 60_000
    ) {
      const nextEndsAt =
        new Date(entry.endsAt).getTime() > new Date(last.endsAt).getTime()
          ? entry.endsAt
          : last.endsAt;
      const minutes = durationMinutes(last.startsAt, nextEndsAt);
      merged[merged.length - 1] = {
        ...last,
        endsAt: nextEndsAt,
        title: formatFreeTitle(minutes),
        explanation: last.explanation ?? entry.explanation,
        primarySuggestion: last.primarySuggestion ?? entry.primarySuggestion,
        freeSlotKind:
          last.freeSlotKind === "evening_available" ||
          entry.freeSlotKind === "evening_available"
            ? "evening_available"
            : last.freeSlotKind ?? entry.freeSlotKind,
      };
      continue;
    }

    if (isMergeableFreeEntry(entry)) {
      const minutes = durationMinutes(entry.startsAt, entry.endsAt);
      merged.push({
        ...entry,
        title: formatFreeTitle(minutes),
      });
      continue;
    }

    merged.push(entry);
  }

  return merged;
}
