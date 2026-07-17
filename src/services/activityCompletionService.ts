import { classifyCalendarItemActivityFromEntry } from "../lib/planning/classifyCalendarItemActivityFromEntry";
import { evaluateCompletionTiming } from "../lib/planning/evaluateCompletionTiming";
import { getDurationMinutes } from "../lib/time/daySchedule";
import {
  rememberFeedbackId,
  resolveAchievementFeedback,
  resolveRecentFeedbackIdsFromStorage,
} from "../ai/achievementFeedbackEngine";
import type { DayTimelineEntry } from "../lib/planning/displayedDayTimeline";
import type {
  ActivityCompletionDetails,
  AchievementFeedback,
} from "../types/achievementFeedback";
import type { TaskRecord } from "../types";
import type { DailyCheckinRecord } from "../types/dailyCheckin";
import { supabase } from "../lib/supabase/client";
import { formatSupabaseError } from "../lib/supabase/formatError";
import { recordTaskActivityEvent } from "./taskActivityEventService";
import { applyTimelineEditAndReplan } from "./blockAdjustmentService";
import { buildManualBlockAdjustment } from "../lib/planning/blockAdjustmentHelpers";
import type { TimelineBlockEditInput } from "../types/manualBlockAdjustment";
import { getCurrentDeviceDate } from "../lib/time/deviceClock";
import { resolveBlockCompletionAvailability } from "../lib/planning/resolveBlockCompletionAvailability";
import { buildFreedTimeFollowUp } from "../lib/planning/releaseEarlyFinishTime";
import { PlanningGenerationError } from "../types/planningGenerationError";

export type ActivityCompletionResult = {
  feedback: AchievementFeedback;
  details: ActivityCompletionDetails;
  explanation: string;
  timeline: DayTimelineEntry[];
  freedMinutes: number;
};

function mapEnergyFromCheckin(checkin: DailyCheckinRecord | null): string | null {
  if (!checkin) return null;
  return checkin.mood;
}

function buildCompletionEventMetadata(
  details: ActivityCompletionDetails,
  feedback: AchievementFeedback,
  extra: Record<string, unknown> = {},
): Record<string, unknown> {
  const timing = details.completion_timing;
  return {
    scheduledStart: details.scheduled_starts_at,
    scheduledEnd: details.scheduled_ends_at,
    actualStart: details.actual_started_at ?? null,
    actualEnd: details.actual_completed_at,
    deltaMinutes: details.completion_delta_minutes,
    durationCompleted: getDurationMinutes(
      details.scheduled_starts_at,
      details.actual_completed_at,
    ),
    feedbackId: feedback.id,
    completionTiming: timing,
    completedEarly: timing === "early",
    completedOnTime: timing === "on_time",
    completedLate: timing === "late",
    workoutCompleted: extra.workoutCompleted === true,
    partialCompletion: extra.partialCompletion === true,
    freedMinutes: details.freed_minutes ?? 0,
    ...extra,
  };
}

async function markTaskCompleted(taskId: string): Promise<void> {
  const { error } = await supabase
    .from("tasks")
    .update({
      status: "done",
      consecutive_cancellations: 0,
      last_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId);

  if (error) {
    throw formatSupabaseError({ table: "tasks", operation: "UPDATE", error });
  }
}

function mapTaskPriority(priority: number | null | undefined): string | null {
  if (priority == null) return null;
  if (priority >= 5) return "urgent";
  if (priority >= 4) return "high";
  if (priority >= 2) return "medium";
  return "low";
}

export async function completeActivityWithFeedback({
  userId,
  date,
  entry,
  task,
  dailyCheckin,
  actualCompletedAt = new Date().toISOString(),
  actualStartedAt,
  isWorkout = false,
  isPartialWorkout = false,
  preserveExistingDetails = {},
  allowEarlyCompletion = false,
}: {
  userId: string;
  date: string;
  entry: DayTimelineEntry;
  task?: TaskRecord | null;
  dailyCheckin?: DailyCheckinRecord | null;
  actualCompletedAt?: string;
  actualStartedAt?: string;
  isWorkout?: boolean;
  isPartialWorkout?: boolean;
  preserveExistingDetails?: Record<string, unknown>;
  allowEarlyCompletion?: boolean;
}): Promise<ActivityCompletionResult> {
  const completionGuard = resolveBlockCompletionAvailability({
    entry,
    currentLocalDate: getCurrentDeviceDate(),
    actualCompletedAt,
    allowEarlyCompletion,
  });

  if (!completionGuard.allowed) {
    throw new PlanningGenerationError({
      code: "GENERATE_FAILED",
      userMessage: completionGuard.message,
      technicalDetails: `block completion blocked for ${entry.id}`,
      step: "generate",
    });
  }

  const classification = classifyCalendarItemActivityFromEntry(entry);
  const { timing, deltaMinutes } = evaluateCompletionTiming({
    scheduledStartsAt: entry.startsAt,
    scheduledEndsAt: entry.endsAt,
    actualCompletedAt,
  });

  const freedMinutes =
    timing === "early"
      ? Math.max(0, Math.round((new Date(entry.endsAt).getTime() - new Date(actualCompletedAt).getTime()) / 60_000))
      : 0;

  const feedback = resolveAchievementFeedback({
    activityCategory: classification.activityCategory,
    activityType: entry.activityType,
    visualType: entry.visualType,
    title: entry.title,
    completionTiming: timing,
    durationMinutes: getDurationMinutes(entry.startsAt, entry.endsAt),
    deltaMinutes,
    priority: mapTaskPriority(task?.priority),
    skipCount: task?.skip_count ?? 0,
    cancellationCount: task?.cancellation_count ?? 0,
    energyLevel: mapEnergyFromCheckin(dailyCheckin ?? null),
    isWorkout,
    isPartialWorkout,
    recentFeedbackIds: resolveRecentFeedbackIdsFromStorage(),
  });

  rememberFeedbackId(feedback.id);

  const nextEndsAt =
    timing === "early" && freedMinutes > 0 ? actualCompletedAt : entry.endsAt;

  const details: ActivityCompletionDetails = {
    status: "completed",
    scheduled_starts_at: entry.startsAt,
    scheduled_ends_at: entry.endsAt,
    actual_started_at: actualStartedAt,
    actual_completed_at: actualCompletedAt,
    completion_delta_minutes: deltaMinutes,
    completion_timing: timing,
    achievement_feedback_id: feedback.id,
    achievement_message: feedback.message,
    achievement_title: feedback.title,
    completion_status_label: feedback.statusLabel,
    celebration_level: feedback.celebrationLevel,
    freed_minutes: freedMinutes > 0 ? freedMinutes : undefined,
  };

  if (entry.calendarItemId) {
    const { data: existing } = await supabase
      .from("calendar_items")
      .select("details")
      .eq("id", entry.calendarItemId)
      .maybeSingle();

    await supabase
      .from("calendar_items")
      .update({
        ends_at: nextEndsAt,
        details: {
          ...(existing?.details ?? {}),
          ...preserveExistingDetails,
          ...details,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", entry.calendarItemId);
  }

  if (task) {
    await markTaskCompleted(task.id);
  }

  await recordTaskActivityEvent({
    userId,
    taskId: task?.id,
    calendarItemId: entry.calendarItemId,
    eventType: "completed",
    occurredAt: actualCompletedAt,
    metadata: buildCompletionEventMetadata(details, feedback, {
      workoutCompleted: isWorkout && !isPartialWorkout,
      partialCompletion: isPartialWorkout,
      title: entry.title,
      activityCategory: classification.activityCategory,
      studySession:
        classification.activityCategory === "study" ||
        entry.activityType === ("revision" as string) ||
        preserveExistingDetails.businessType === "study",
      suggestionType:
        typeof preserveExistingDetails.suggestionType === "string"
          ? preserveExistingDetails.suggestionType
          : undefined,
    }),
  });

  const edit: TimelineBlockEditInput = {
    title: entry.title,
    startsAt: entry.startsAt,
    endsAt: nextEndsAt,
    locked: entry.locked,
    activityType: entry.activityType,
    scope: "today",
    comment: feedback.statusLabel,
    adjustment: buildManualBlockAdjustment({
      entry: { ...entry, endsAt: nextEndsAt },
      startsAt: entry.startsAt,
      endsAt: nextEndsAt,
      userId,
      scope: "today",
      reason: feedback.statusLabel,
    }),
  };

  const displayed = await applyTimelineEditAndReplan({
    userId,
    date,
    entry: { ...entry, endsAt: nextEndsAt },
    edit,
  });

  let explanation = feedback.message;
  if (freedMinutes > 0) {
    explanation = `${feedback.message} ${buildFreedTimeFollowUp(freedMinutes)}`.trim();
  }

  return {
    feedback,
    details,
    explanation,
    timeline: displayed.timeline,
    freedMinutes,
  };
}
