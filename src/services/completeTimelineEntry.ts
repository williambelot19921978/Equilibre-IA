import type { DayTimelineEntry } from "../lib/planning/displayedDayTimeline";
import { isTimelineEntryCompletable } from "../lib/planning/isTimelineEntryCompletable";
import type { TaskRecord } from "../types";
import type { AchievementFeedback } from "../types/achievementFeedback";
import { PlanningGenerationError } from "../types/planningGenerationError";
import { loadDailyCheckin } from "./dailyCheckinService";
import { completeActivityWithFeedback } from "./activityCompletionService";

export async function completeTimelineEntry({
  userId,
  date,
  entry,
  task = null,
  allowEarlyCompletion = true,
}: {
  userId: string;
  date: string;
  entry: DayTimelineEntry;
  task?: TaskRecord | null;
  allowEarlyCompletion?: boolean;
}): Promise<{
  explanation: string;
  timeline: DayTimelineEntry[];
  feedback?: AchievementFeedback;
  freedMinutes?: number;
}> {
  if (!isTimelineEntryCompletable(entry)) {
    throw new PlanningGenerationError({
      code: "GENERATE_FAILED",
      userMessage: "Cette activité ne peut pas être marquée comme terminée.",
      technicalDetails: `entry not completable ${entry.id}`,
      step: "generate",
    });
  }

  const dailyCheckin = await loadDailyCheckin({ userId, date }).catch(() => null);

  const result = await completeActivityWithFeedback({
    userId,
    date,
    entry,
    task,
    dailyCheckin,
    allowEarlyCompletion,
  });

  return {
    explanation: result.explanation || "Activité terminée.",
    timeline: result.timeline,
    feedback: result.feedback,
    freedMinutes: result.freedMinutes,
  };
}
