import { supabase } from "../lib/supabase/client";
import { replanAfterBlockMove } from "../lib/planning/replanAfterBlockMove";
import type { DayTimelineEntry } from "../lib/planning/displayedDayTimeline";
import type { CalendarItemRecord } from "../types/database";
import { resolveCheckinPlanningImpact } from "../types/dailyCheckin";
import type { PlanningContext } from "../ai/memoryEngine";

export async function applyDynamicReplanUpdates({
  timeline,
  items,
  movedEntryId,
  nextStartsAt,
  nextEndsAt,
  planningContext,
}: {
  timeline: DayTimelineEntry[];
  items: CalendarItemRecord[];
  movedEntryId: string;
  nextStartsAt: string;
  nextEndsAt: string;
  planningContext?: PlanningContext | null;
}): Promise<{ explanation: string[]; updatedCount: number }> {
  const checkinImpact = planningContext?.dailyCheckin
    ? resolveCheckinPlanningImpact(
        planningContext.dailyCheckin.mood,
        planningContext.dailyCheckin.intensity,
      )
    : null;

  const minimumFreeMinutes = checkinImpact?.minimalPlanning ? 20 : 10;

  const result = replanAfterBlockMove({
    entries: timeline,
    items,
    movedEntryId,
    nextStartsAt,
    nextEndsAt,
    minimumFreeMinutes,
  });

  for (const update of result.itemUpdates) {
    await supabase
      .from("calendar_items")
      .update({
        starts_at: update.startsAt,
        ends_at: update.endsAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", update.calendarItemId);
  }

  return {
    explanation: result.explanation,
    updatedCount: result.itemUpdates.length,
  };
}
