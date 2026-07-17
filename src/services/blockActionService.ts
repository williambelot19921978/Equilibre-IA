import { addDaysToDate } from "../lib/time/deviceClock";
import { addMinutesToIso, getDurationMinutes } from "../lib/time/daySchedule";
import { resolveRecoveryRecommendation } from "../ai/recoveryPriorityEngine";
import type { DayTimelineEntry } from "../lib/planning/displayedDayTimeline";
import type { NoTimeChoice, RescheduleOption } from "../types/taskActivity";
import type { TimelineBlockEditInput } from "../types/manualBlockAdjustment";
import type { TaskRecord } from "../types";
import { applyTimelineEditAndReplan } from "./blockAdjustmentService";
import { recordTaskActivityEvent } from "./taskActivityEventService";
import { supabase } from "../lib/supabase/client";
import { formatSupabaseError } from "../lib/supabase/formatError";
import { buildManualBlockAdjustment } from "../lib/planning/blockAdjustmentHelpers";
import type { AchievementFeedback } from "../types/achievementFeedback";
import { PlanningGenerationError } from "../types/planningGenerationError";

function buildEditInput({
  entry,
  userId,
  startsAt,
  endsAt,
  comment,
  activityType,
  locked,
}: {
  entry: DayTimelineEntry;
  userId: string;
  startsAt: string;
  endsAt: string;
  comment?: string;
  activityType?: DayTimelineEntry["activityType"];
  locked?: boolean;
}): TimelineBlockEditInput {
  return {
    title: entry.title,
    startsAt,
    endsAt,
    locked: locked ?? entry.locked,
    activityType: activityType ?? entry.activityType,
    scope: "today",
    comment,
    adjustment: buildManualBlockAdjustment({
      entry,
      startsAt,
      endsAt,
      userId,
      scope: "today",
      reason: comment,
    }),
  };
}

import { isHardConstraint, buildNoTimeExplanation } from "../lib/planning/blockActionHelpers";
import { completeTimelineEntry } from "./completeTimelineEntry";
import { cancelTimelineEntry } from "./cancelTimelineEntry";

export { isHardConstraint, buildNoTimeExplanation };

async function loadTaskById(taskId: string): Promise<TaskRecord | null> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .maybeSingle();

  if (error) {
    throw formatSupabaseError({ table: "tasks", operation: "SELECT", error });
  }

  return data as TaskRecord | null;
}

async function loadTaskForCalendarItem(
  calendarItemId: string,
): Promise<TaskRecord | null> {
  const { data: item, error } = await supabase
    .from("calendar_items")
    .select("task_id")
    .eq("id", calendarItemId)
    .maybeSingle();

  if (error || !item?.task_id) return null;
  return loadTaskById(item.task_id);
}

async function updateTaskCancellation(task: TaskRecord): Promise<TaskRecord> {
  const nextCancellation = (task.cancellation_count ?? 0) + 1;
  const nextConsecutive = (task.consecutive_cancellations ?? 0) + 1;

  const { data, error } = await supabase
    .from("tasks")
    .update({
      status: "skipped",
      cancellation_count: nextCancellation,
      consecutive_cancellations: nextConsecutive,
      last_cancelled_at: new Date().toISOString(),
      skip_count: (task.skip_count ?? 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", task.id)
    .select("*")
    .single();

  if (error) {
    throw formatSupabaseError({ table: "tasks", operation: "UPDATE", error });
  }

  return data as TaskRecord;
}

function buildRescheduleTimes({
  option,
  entry,
  date,
  customIso,
}: {
  option: RescheduleOption;
  entry: DayTimelineEntry;
  date: string;
  customIso?: string;
}): { startsAt: string; endsAt: string } {
  const duration = getDurationMinutes(entry.startsAt, entry.endsAt);

  if (option === "tomorrow") {
    const nextDate = addDaysToDate(date, 1);
    const startsAt = `${nextDate}T${entry.startsAt.slice(11)}`;
    return {
      startsAt,
      endsAt: addMinutesToIso(startsAt, duration),
    };
  }

  if (option === "custom" && customIso) {
    return {
      startsAt: customIso,
      endsAt: addMinutesToIso(customIso, duration),
    };
  }

  const later = addMinutesToIso(entry.endsAt, 30);
  return {
    startsAt: later,
    endsAt: addMinutesToIso(later, duration),
  };
}

export async function applyBlockAction({
  userId,
  date,
  entry,
  action,
  choice,
  rescheduleOption,
  customDateTime,
  edit,
}: {
  userId: string;
  date: string;
  entry: DayTimelineEntry;
  action: "reschedule" | "no_time" | "complete" | "cancel" | "modify";
  choice?: NoTimeChoice;
  rescheduleOption?: RescheduleOption;
  customDateTime?: string;
  edit?: TimelineBlockEditInput;
}): Promise<{
  explanation: string;
  timeline: DayTimelineEntry[];
  feedback?: AchievementFeedback;
  freedMinutes?: number;
}> {
  if (isHardConstraint(entry) && (action === "cancel" || action === "no_time")) {
    throw new PlanningGenerationError({
      code: "GENERATE_FAILED",
      userMessage:
        "Cette contrainte est protégée. Signale une exception plutôt qu'une annulation directe.",
      technicalDetails: `hard constraint ${entry.constraintType}`,
      step: "generate",
    });
  }

  const task = entry.calendarItemId
    ? await loadTaskForCalendarItem(entry.calendarItemId)
    : null;

  let recoveryReason = "";

  if (task) {
    const recommendation = resolveRecoveryRecommendation({
      taskId: task.id,
      title: task.title,
      category: task.category,
      skipCount: task.skip_count ?? 0,
      cancellationCount: task.cancellation_count ?? 0,
      consecutiveCancellations: task.consecutive_cancellations ?? 0,
      durationMinutes: task.estimated_minutes ?? 30,
      priority: task.priority,
      dueDate: task.due_at,
    });
    recoveryReason = recommendation.reason;
  }

  if (action === "complete") {
    const result = await completeTimelineEntry({
      userId,
      date,
      entry,
      task,
      allowEarlyCompletion: true,
    });

    return {
      explanation: result.explanation,
      timeline: result.timeline,
      feedback: result.feedback,
      freedMinutes: result.freedMinutes,
    };
  }

  if (action === "cancel") {
    const result = await cancelTimelineEntry({
      userId,
      date,
      entry,
      task,
    });

    return {
      explanation: result.explanation,
      timeline: result.timeline,
    };
  }

  if (action === "no_time" && choice === "keep") {
    return { explanation: `« ${entry.title} » est conservée.`, timeline: [] };
  }

  if (action === "no_time" && choice === "cancel_today") {
    if (entry.calendarItemId) {
      await supabase.from("calendar_items").delete().eq("id", entry.calendarItemId);
    }
    if (task) {
      await updateTaskCancellation(task);
    }
    await recordTaskActivityEvent({
      userId,
      taskId: task?.id,
      calendarItemId: entry.calendarItemId,
      eventType: "cancelled",
      metadata: { title: entry.title, choice },
    });

    const displayed = await applyTimelineEditAndReplan({
      userId,
      date,
      entry,
      edit: buildEditInput({
        entry,
        userId,
        startsAt: entry.startsAt,
        endsAt: entry.startsAt,
        locked: false,
        comment: "Annulé pour aujourd'hui",
      }),
    });

    return {
      explanation: buildNoTimeExplanation("cancel_today", entry.title, recoveryReason),
      timeline: displayed.timeline,
    };
  }

  if (
    action === "reschedule" ||
    (action === "no_time" &&
      (choice === "postpone" || choice === "shorten_10" || choice === "shorten_15"))
  ) {
    const option = rescheduleOption ?? (choice === "postpone" ? "tomorrow" : "later_today");
    const { startsAt, endsAt } = buildRescheduleTimes({
      option,
      entry,
      date,
      customIso: customDateTime,
    });

    let newEndsAt = endsAt;
    if (choice === "shorten_10") {
      newEndsAt = addMinutesToIso(startsAt, 10);
    } else if (choice === "shorten_15") {
      newEndsAt = addMinutesToIso(startsAt, 15);
    }

    await recordTaskActivityEvent({
      userId,
      taskId: task?.id,
      calendarItemId: entry.calendarItemId,
      eventType: choice?.startsWith("shorten") ? "shortened" : "moved",
      metadata: { from: entry.startsAt, to: startsAt, choice, option },
    });

    const displayed = await applyTimelineEditAndReplan({
      userId,
      date,
      entry,
      edit: buildEditInput({
        entry,
        userId,
        startsAt,
        endsAt: newEndsAt,
        comment:
          choice === "shorten_10" || choice === "shorten_15"
            ? "Durée réduite"
            : "Décalé",
      }),
    });

    const timeLabel = new Date(startsAt).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return {
      explanation: `J'ai déplacé « ${entry.title} » à ${timeLabel}.${recoveryReason ? ` ${recoveryReason}` : ""}`,
      timeline: displayed.timeline,
    };
  }

  if (action === "modify" && edit) {
    const displayed = await applyTimelineEditAndReplan({
      userId,
      date,
      entry,
      edit,
    });
    return { explanation: displayed.explanation, timeline: displayed.timeline };
  }

  throw new PlanningGenerationError({
    code: "GENERATE_FAILED",
    userMessage: "Action non reconnue sur ce bloc.",
    technicalDetails: action,
    step: "generate",
  });
}
