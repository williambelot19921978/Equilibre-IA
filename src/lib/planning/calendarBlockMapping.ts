import { isManualCalendarSource } from "../../config/calendarSources";
import { mapCalendarItemTypeToPlannedBlockType } from "../../config/calendarItemTypes";
import type { CalendarItemRecord } from "../../types/database";
import type { PlannedBlock } from "../../types/planning";

export function calendarItemToPlannedBlock(item: CalendarItemRecord): PlannedBlock {
  const details = item.details ?? {};

  return {
    id: item.id,
    blockType: mapCalendarItemTypeToPlannedBlockType(item.item_type, details),
    title: item.title,
    startsAt: item.starts_at,
    endsAt: item.ends_at,
    taskId: item.task_id ?? undefined,
    category:
      typeof details.category === "string" ? details.category : undefined,
    locked: item.locked,
    source: isManualCalendarSource(item.source) ? "manual" : "engine",
    explanation: {
      summary: details.explanation ?? "",
      facts: details.facts ?? [],
      confidence: details.confidence ?? "certain",
    },
    segmentIndex: details.segmentIndex,
    segmentTotal: details.segmentTotal,
    energyLevel:
      details.energyLevel === "high" ||
      details.energyLevel === "medium" ||
      details.energyLevel === "low" ||
      details.energyLevel === "variable"
        ? details.energyLevel
        : undefined,
  };
}
