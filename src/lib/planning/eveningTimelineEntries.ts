import type { EveningActivityBlock } from "../../types/eveningPlanning";
import type { ActivityType } from "../../config/activityTypes";
import type { DayTimelineEntry, DayTimelineVisualType } from "./displayedDayTimeline";

const EVENING_VISUAL: Record<string, DayTimelineVisualType> = {
  transition: "rest",
  study: "task",
  sport: "sport",
  calm: "rest",
  reading: "rest",
  spiritual: "rest",
  prep_tomorrow: "task",
  couple: "rest",
  leisure: "free",
  social_media: "free",
  wind_down: "rest",
  keep_free: "free",
};

const EVENING_ACTIVITY: Partial<Record<string, ActivityType>> = {
  study: "task",
  sport: "sport",
  calm: "rest",
  spiritual: "rest",
};

export function eveningBlocksToTimelineEntries(
  blocks: EveningActivityBlock[],
  _options: { automatic: boolean },
): DayTimelineEntry[] {
  return blocks.map((block) => ({
    id: block.id,
    visualType: EVENING_VISUAL[block.type] ?? "free",
    title: block.title,
    startsAt: block.startsAt,
    endsAt: block.endsAt,
    locked: false,
    origin: "computed" as const,
    blockKind: "free_slot" as const,
    freeSlotKind: "evening_available" as const,
    status: block.suggested ? "proposed" : undefined,
    explanation: block.reason,
    activityType: EVENING_ACTIVITY[block.type],
  }));
}

export function createEveningHeaderEntry({
  startsAt,
  summary,
}: {
  startsAt: string;
  endsAt: string;
  summary: string;
}): DayTimelineEntry {
  return {
    id: `evening-header-${startsAt}`,
    visualType: "free",
    title: "Temps disponible du soir",
    startsAt,
    endsAt: startsAt,
    locked: false,
    origin: "computed",
    blockKind: "free_slot",
    freeSlotKind: "evening_available",
    explanation: summary,
  };
}
