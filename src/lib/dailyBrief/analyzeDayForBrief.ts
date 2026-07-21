/**
 * EPIC1-A — Day synthesis from timeline (Availability pattern, deterministic).
 */

import type { DayTimelineEntry } from "../planning/displayedDayTimeline";

export type DayBriefAnalysis = {
  readonly scheduledBlockCount: number;
  readonly scheduledMinutes: number;
  readonly freeMinutes: number;
  readonly afternoonBlockCount: number;
  readonly afternoonMinutes: number;
  readonly synthesisKey: "open" | "busy" | "balanced" | "empty";
};

function entryMinutes(entry: DayTimelineEntry): number {
  return Math.max(
    0,
    Math.round(
      (new Date(entry.endsAt).getTime() - new Date(entry.startsAt).getTime()) /
        60_000,
    ),
  );
}

function isMeaningfulBlock(entry: DayTimelineEntry): boolean {
  return (
    entry.blockKind !== "free_slot" &&
    entry.blockKind !== "structural" &&
    !entry.completed
  );
}

function isAfternoonBlock(entry: DayTimelineEntry): boolean {
  const hour = new Date(entry.startsAt).getHours();
  return hour >= 12 && hour < 18;
}

export function analyzeDayForBrief(
  timeline: DayTimelineEntry[],
): DayBriefAnalysis {
  const meaningful = timeline.filter(isMeaningfulBlock);
  const freeSlots = timeline.filter(
    (entry) => entry.blockKind === "free_slot" && !entry.completed,
  );
  const afternoon = meaningful.filter(isAfternoonBlock);

  const scheduledMinutes = meaningful.reduce(
    (sum, entry) => sum + entryMinutes(entry),
    0,
  );
  const freeMinutes = freeSlots.reduce(
    (sum, entry) => sum + entryMinutes(entry),
    0,
  );
  const afternoonMinutes = afternoon.reduce(
    (sum, entry) => sum + entryMinutes(entry),
    0,
  );

  let synthesisKey: DayBriefAnalysis["synthesisKey"] = "balanced";

  if (meaningful.length === 0 && freeMinutes === 0) {
    synthesisKey = "empty";
  } else if (freeMinutes >= 90 && scheduledMinutes < 180) {
    synthesisKey = "open";
  } else if (scheduledMinutes >= 300 || meaningful.length >= 8) {
    synthesisKey = "busy";
  }

  return {
    scheduledBlockCount: meaningful.length,
    scheduledMinutes,
    freeMinutes,
    afternoonBlockCount: afternoon.length,
    afternoonMinutes,
    synthesisKey,
  };
}

export function isAfternoonDense(analysis: DayBriefAnalysis): boolean {
  return analysis.afternoonBlockCount >= 4 || analysis.afternoonMinutes >= 180;
}
