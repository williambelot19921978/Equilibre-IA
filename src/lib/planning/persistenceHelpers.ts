import { isAutoCalendarSource, isManualCalendarSource } from "../../config/calendarSources";
import type { CalendarItemRecord, DayPlan, PlannedBlock } from "../../types";

export function shouldDeleteAutoCalendarItem(
  item: CalendarItemRecord,
): boolean {
  if (item.details?.userAccepted === true) {
    return false;
  }

  if (item.locked) {
    return false;
  }

  if (isManualCalendarSource(item.source)) {
    return false;
  }

  if (item.details?.status === "completed") {
    return false;
  }

  return isAutoCalendarSource(item.source);
}

export function getPersistableEngineBlocks(plan: DayPlan): PlannedBlock[] {
  return [...plan.blocks, ...plan.margins].filter(
    (block) =>
      block.source === "engine" &&
      (block.blockType === "task" ||
        block.blockType === "buffer" ||
        block.blockType === "margin"),
  );
}
