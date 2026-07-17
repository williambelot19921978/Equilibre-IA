import { supabase } from "../lib/supabase/client";
import { formatSupabaseError } from "../lib/supabase/formatError";
import { isTimelineEntryCancellable } from "../lib/planning/isTimelineEntryCancellable";
import { buildManualBlockAdjustment } from "../lib/planning/blockAdjustmentHelpers";
import type { DayTimelineEntry } from "../lib/planning/displayedDayTimeline";
import type { TaskRecord } from "../types";
import { PlanningGenerationError } from "../types/planningGenerationError";
import { recordTaskActivityEvent } from "./taskActivityEventService";
import { applyTimelineEditAndReplan } from "./blockAdjustmentService";
import type { TimelineBlockEditInput } from "../types/manualBlockAdjustment";

async function touchTaskAfterCancellation(task: TaskRecord): Promise<void> {
  const { error } = await supabase
    .from("tasks")
    .update({
      skip_count: (task.skip_count ?? 0) + 1,
      last_cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", task.id);

  if (error) {
    throw formatSupabaseError({ table: "tasks", operation: "UPDATE", error });
  }
}

export async function cancelTimelineEntry({
  userId,
  date,
  entry,
  task = null,
}: {
  userId: string;
  date: string;
  entry: DayTimelineEntry;
  task?: TaskRecord | null;
}): Promise<{
  explanation: string;
  timeline: DayTimelineEntry[];
}> {
  if (import.meta.env.DEV) {
    console.log("[CANCEL ACTIVITY CLICK]", {
      entryId: entry.id,
      calendarItemId: entry.calendarItemId,
      taskId: task?.id ?? null,
      source: entry.origin,
      visualType: entry.visualType,
      cancellable: isTimelineEntryCancellable(entry),
    });
  }

  if (!isTimelineEntryCancellable(entry)) {
    throw new PlanningGenerationError({
      code: "GENERATE_FAILED",
      userMessage: "Cette activité ne peut pas être annulée.",
      technicalDetails: `entry not cancellable ${entry.id}`,
      step: "generate",
    });
  }

  if (entry.calendarItemId) {
    const { error } = await supabase
      .from("calendar_items")
      .delete()
      .eq("id", entry.calendarItemId);

    if (error) {
      throw formatSupabaseError({ table: "calendar_items", operation: "DELETE", error });
    }
  }

  if (task) {
    await touchTaskAfterCancellation(task);
  }

  await recordTaskActivityEvent({
    userId,
    taskId: task?.id,
    calendarItemId: entry.calendarItemId,
    eventType: "cancelled",
    metadata: {
      title: entry.title,
      cancelledForToday: true,
      date,
      status: "cancelled_for_today",
    },
  });

  const edit: TimelineBlockEditInput = {
    title: entry.title,
    startsAt: entry.startsAt,
    endsAt: entry.startsAt,
    locked: false,
    scope: "today",
    comment: "Annulé pour aujourd'hui",
    adjustment: buildManualBlockAdjustment({
      entry,
      startsAt: entry.startsAt,
      endsAt: entry.startsAt,
      userId,
      scope: "today",
      reason: "Annulé pour aujourd'hui",
    }),
  };

  const displayed = await applyTimelineEditAndReplan({
    userId,
    date,
    entry,
    edit,
  });

  return {
    explanation: "Activité annulée pour aujourd'hui.",
    timeline: displayed.timeline,
  };
}
