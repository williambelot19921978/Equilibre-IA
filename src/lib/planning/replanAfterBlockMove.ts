import { getDurationMinutes } from "../time/daySchedule";
import type { DayTimelineEntry } from "./displayedDayTimeline";
import {
  absorbDurationChangeWithFreeTime,
  type AbsorptionChange,
  type SchedulableBlock,
} from "./absorbDurationChangeWithFreeTime";
import { extractFlexibleBuffers } from "./flexibleBuffer";
import { classifyCalendarItemActivity } from "./classifyCalendarItemActivity";
import type { CalendarItemRecord } from "../../types/database";
import { isHardConstraint } from "./blockActionHelpers";

export type ReplanAfterBlockMoveInput = {
  entries: DayTimelineEntry[];
  items: CalendarItemRecord[];
  movedEntryId: string;
  nextStartsAt: string;
  nextEndsAt: string;
  minimumFreeMinutes?: number;
};

export type ReplanAfterBlockMoveResult = {
  itemUpdates: Array<{
    calendarItemId: string;
    startsAt: string;
    endsAt: string;
    reason: string;
  }>;
  changes: AbsorptionChange[];
  explanation: string[];
};

function entryToSchedulableBlock(entry: DayTimelineEntry): SchedulableBlock | null {
  if (entry.origin !== "persisted" || !entry.calendarItemId) return null;
  if (entry.visualType === "wake" || entry.visualType === "sleep") return null;

  return {
    id: entry.id,
    calendarItemId: entry.calendarItemId,
    startsAt: entry.startsAt,
    endsAt: entry.endsAt,
    locked: entry.locked,
    flexible: !isHardConstraint(entry),
    title: entry.title,
  };
}

export function replanAfterBlockMove({
  entries,
  items,
  movedEntryId,
  nextStartsAt,
  nextEndsAt,
  minimumFreeMinutes = 10,
}: ReplanAfterBlockMoveInput): ReplanAfterBlockMoveResult {
  const blocks = entries
    .map(entryToSchedulableBlock)
    .filter((block): block is SchedulableBlock => block !== null);

  const buffers = extractFlexibleBuffers(entries, minimumFreeMinutes);
  const movedBlock = blocks.find((block) => block.id === movedEntryId);

  if (!movedBlock) {
    return {
      itemUpdates: [],
      changes: [],
      explanation: ["Bloc déplacé introuvable dans les éléments persistés."],
    };
  }

  const result = absorbDurationChangeWithFreeTime({
    blocks,
    buffers,
    targetBlockId: movedEntryId,
    nextStartsAt,
    nextEndsAt,
    minimumFreeMinutes,
  });

  const movedDuration = getDurationMinutes(nextStartsAt, nextEndsAt);
  const previousDuration = getDurationMinutes(movedBlock.startsAt, movedBlock.endsAt);
  const explanation = [...result.explanation];

  if (nextStartsAt !== movedBlock.startsAt) {
    explanation.unshift(
      `« ${movedBlock.title} » déplacée à ${new Date(nextStartsAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}.`,
    );
  } else if (movedDuration !== previousDuration) {
    explanation.unshift(`« ${movedBlock.title} » ajustée à ${movedDuration} minutes.`);
  }

  const itemUpdates = result.changes
    .filter((change) => change.calendarItemId)
    .map((change) => ({
      calendarItemId: change.calendarItemId!,
      startsAt: change.nextStartsAt,
      endsAt: change.nextEndsAt,
      reason: change.reason,
    }));

  const movedItem = items.find((item) => item.id === movedBlock.calendarItemId);
  if (movedItem) {
    const classification = classifyCalendarItemActivity(movedItem);
    if (classification.isSport) {
      explanation.push("Séance sport conservée avec le nouveau créneau.");
    }
  }

  return {
    itemUpdates,
    changes: result.changes,
    explanation,
  };
}
