/**
 * P2 — Availability + Scheduler (legacy reuse, deterministic).
 * Finds future same-day slots for a study block without LLM.
 */

import type { PlanningContext } from "../../ai/memoryEngine";
import { getBedTime, getWakeTime } from "../../ai/memoryEngine";
import { validatePlannedBlockCore } from "../../ai/engines/decision/decisionEngineCore";
import type { DayTimelineEntry } from "../planning/displayedDayTimeline";
import { isHardConstraint } from "../planning/blockActionHelpers";
import { combineDateAndTime, getDurationMinutes } from "../time/daySchedule";
import type { PlannedBlock } from "../../types/planning";

export type AlternativeStudySlot = {
  readonly slotId: string;
  readonly startsAt: string;
  readonly endsAt: string;
  readonly durationMinutes: number;
  readonly score: number;
  readonly scoreReason: string;
};

const MIN_BUFFER_MINUTES = 10;
const MIN_GAP_MINUTES = 15;

function durationMinutes(startsAt: string, endsAt: string): number {
  return getDurationMinutes(startsAt, endsAt);
}

function mergeIntervals(
  intervals: Array<{ startsAt: string; endsAt: string }>,
): Array<{ startsAt: string; endsAt: string }> {
  const sorted = [...intervals].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );
  const merged: Array<{ startsAt: string; endsAt: string }> = [];

  for (const interval of sorted) {
    const last = merged[merged.length - 1];
    if (!last) {
      merged.push({ ...interval });
      continue;
    }

    if (new Date(interval.startsAt).getTime() <= new Date(last.endsAt).getTime()) {
      if (new Date(interval.endsAt).getTime() > new Date(last.endsAt).getTime()) {
        last.endsAt = interval.endsAt;
      }
      continue;
    }

    merged.push({ ...interval });
  }

  return merged;
}

function buildBlockingIntervals(
  timeline: DayTimelineEntry[],
  excludeEntryId: string,
): Array<{ startsAt: string; endsAt: string }> {
  return mergeIntervals(
    timeline
      .filter(
        (entry) =>
          entry.id !== excludeEntryId &&
          entry.blockKind !== "free_slot" &&
          durationMinutes(entry.startsAt, entry.endsAt) > 0,
      )
      .map((entry) => ({
        startsAt: entry.startsAt,
        endsAt: entry.endsAt,
      })),
  );
}

function overlaps(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
): boolean {
  return (
    new Date(startA).getTime() < new Date(endB).getTime() &&
    new Date(startB).getTime() < new Date(endA).getTime()
  );
}

function scoreSlotForStudy(
  slotStart: string,
  planningContext: PlanningContext,
  now: Date,
): { score: number; reason: string } {
  let score = 50;
  const reasons: string[] = [];
  const hour = new Date(slotStart).getHours();
  const bestPeriod = planningContext.profile.studyBestPeriod;

  if (bestPeriod === "morning" && hour < 12) {
    score += 20;
    reasons.push("matinée favorable aux révisions");
  } else if (bestPeriod === "evening" && hour >= 17) {
    score += 20;
    reasons.push("soirée indiquée pour réviser");
  } else {
    reasons.push("créneau disponible");
  }

  const minutesFromNow =
    (new Date(slotStart).getTime() - now.getTime()) / 60_000;
  if (minutesFromNow >= MIN_BUFFER_MINUTES && minutesFromNow <= 180) {
    score += 10;
    reasons.push("assez proche pour aujourd'hui");
  }

  score -= hour * 0.05;

  return {
    score,
    reason: reasons.join(", "),
  };
}

function toPlannedBlocks(
  timeline: DayTimelineEntry[],
  excludeEntryId: string,
): PlannedBlock[] {
  return timeline
    .filter((entry) => entry.id !== excludeEntryId && entry.blockKind !== "free_slot")
    .map((entry) => ({
      id: entry.id,
      blockType: isHardConstraint(entry) ? "constraint" : "task",
      title: entry.title,
      startsAt: entry.startsAt,
      endsAt: entry.endsAt,
      locked: entry.locked,
      source: entry.origin === "persisted" ? "manual" : "engine",
      explanation: { summary: "", facts: [], confidence: "certain" as const },
      category: entry.activityType,
      energyLevel: "medium" as const,
    }));
}

function validateSlotWithDecisionEngine(
  startsAt: string,
  endsAt: string,
  movingEntry: DayTimelineEntry,
  timeline: DayTimelineEntry[],
  planningContext: PlanningContext,
  totalFreeMinutes: number,
): boolean {
  const block: PlannedBlock = {
    id: `p2-candidate-${movingEntry.id}`,
    blockType: "task",
    title: movingEntry.title,
    startsAt,
    endsAt,
    category: "studies",
    locked: false,
    source: "engine",
    explanation: { summary: "", facts: [], confidence: "certain" },
    energyLevel: "medium",
  };

  const result = validatePlannedBlockCore({
    block,
    context: planningContext,
    existingBlocks: toPlannedBlocks(timeline, movingEntry.id),
    totalFreeMinutes,
    plannedMinutes: 0,
  });

  return result.valid;
}

export function findAlternativeStudySlots({
  timeline,
  movingEntry,
  planningContext,
  date,
  now = new Date(),
}: {
  timeline: DayTimelineEntry[];
  movingEntry: DayTimelineEntry;
  planningContext: PlanningContext;
  date: string;
  now?: Date;
}): AlternativeStudySlot[] {
  const taskDuration = durationMinutes(movingEntry.startsAt, movingEntry.endsAt);
  if (taskDuration < 5) return [];

  const wakeTime = getWakeTime(planningContext);
  const bedTime = getBedTime(planningContext);
  const dayStart = combineDateAndTime(date, wakeTime);
  const dayEnd = combineDateAndTime(date, bedTime);

  const minStartMs = Math.max(
    now.getTime() + MIN_BUFFER_MINUTES * 60_000,
    new Date(dayStart).getTime(),
  );
  const maxEndMs = new Date(dayEnd).getTime();

  if (minStartMs >= maxEndMs) return [];

  const blocking = buildBlockingIntervals(timeline, movingEntry.id);
  const candidates: AlternativeStudySlot[] = [];

  const boundaries = [
    { startsAt: new Date(minStartMs).toISOString(), endsAt: new Date(minStartMs).toISOString() },
    ...blocking,
    { startsAt: new Date(maxEndMs).toISOString(), endsAt: new Date(maxEndMs).toISOString() },
  ].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );

  for (let index = 0; index < boundaries.length - 1; index += 1) {
    const gapStart = Math.max(
      new Date(boundaries[index].endsAt).getTime(),
      minStartMs,
    );
    const gapEnd = new Date(boundaries[index + 1].startsAt).getTime();
    const gapMinutes = Math.round((gapEnd - gapStart) / 60_000);

    if (gapMinutes < Math.max(taskDuration, MIN_GAP_MINUTES)) continue;

    const startsAt = new Date(gapStart).toISOString();
    const endsAt = new Date(gapStart + taskDuration * 60_000).toISOString();

    const hasOverlap = blocking.some((block) =>
      overlaps(startsAt, endsAt, block.startsAt, block.endsAt),
    );
    if (hasOverlap) continue;

    const totalFreeMinutes = Math.round((maxEndMs - minStartMs) / 60_000);
    if (
      !validateSlotWithDecisionEngine(
        startsAt,
        endsAt,
        movingEntry,
        timeline,
        planningContext,
        totalFreeMinutes,
      )
    ) {
      continue;
    }

    const { score, reason } = scoreSlotForStudy(
      startsAt,
      planningContext,
      now,
    );

    candidates.push({
      slotId: `slot-${startsAt}`,
      startsAt,
      endsAt,
      durationMinutes: taskDuration,
      score,
      scoreReason: reason,
    });
  }

  return candidates.sort((a, b) => b.score - a.score);
}

export function pickBestAlternativeSlot(
  slots: AlternativeStudySlot[],
): AlternativeStudySlot | null {
  return slots[0] ?? null;
}
