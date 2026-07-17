import { generateWorkoutSession } from "../ai/workoutGenerationEngine";
import { buildSportManualDetails } from "../lib/calendar/manualConstraint";
import type { DayTimelineEntry } from "../lib/planning/displayedDayTimeline";
import type { WorkoutSession } from "../types/workoutSession";
import type { WorkoutLevel, WorkoutSessionType } from "../types/workoutSession";
import { completeActivityWithFeedback } from "./activityCompletionService";
import type { WorkoutCompletionOutcome } from "../components/planning/WorkoutSessionPlayer";
import { loadSportSettings } from "./homePreferencesService";
import { getDurationMinutes } from "../lib/time/daySchedule";
import type { AchievementFeedback } from "../types/achievementFeedback";
import type { DailyCheckinRecord } from "../types/dailyCheckin";
import { supabase } from "../lib/supabase/client";

export async function generateWorkoutForCalendarItem({
  userId,
  entry,
  level,
  type,
}: {
  userId: string;
  entry: DayTimelineEntry;
  level?: WorkoutLevel;
  type?: WorkoutSessionType;
}): Promise<WorkoutSession> {
  const preferences = await loadSportSettings(userId);
  const durationMinutes = Math.min(
    getDurationMinutes(entry.startsAt, entry.endsAt) - 5,
    preferences.preferredDurationMinutes,
  );
  const hour = new Date(entry.startsAt).getHours();

  return generateWorkoutSession({
    durationMinutes,
    level: level ?? preferences.level,
    type,
    slotHour: hour,
    preferences,
    generationSeed: `${entry.id}-${Date.now()}`,
  });
}

export async function attachWorkoutSessionToEntry({
  entry,
  session,
}: {
  userId: string;
  entry: DayTimelineEntry;
  session: WorkoutSession;
}): Promise<void> {
  if (!entry.calendarItemId) return;

  const { data: existing } = await supabase
    .from("calendar_items")
    .select("details")
    .eq("id", entry.calendarItemId)
    .maybeSingle();

  const details = {
    ...(existing?.details ?? {}),
    ...buildSportManualDetails({
      constraintType: "sport",
      workoutSession: session,
      withSession: true,
    }),
    workoutSession: session,
  };

  await supabase
    .from("calendar_items")
    .update({
      title: session.title,
      details,
      updated_at: new Date().toISOString(),
    })
    .eq("id", entry.calendarItemId);
}

export async function finishWorkoutSession({
  userId,
  date,
  entry,
  session,
  outcome,
  dailyCheckin,
}: {
  userId: string;
  date: string;
  entry: DayTimelineEntry;
  session: WorkoutSession;
  outcome: WorkoutCompletionOutcome;
  dailyCheckin?: DailyCheckinRecord | null;
}): Promise<{ feedback: AchievementFeedback; explanation: string; freedMinutes: number } | null> {
  if (outcome !== "completed" && outcome !== "partial") {
    return null;
  }

  const result = await completeActivityWithFeedback({
    userId,
    date,
    entry,
    dailyCheckin,
    isWorkout: true,
    isPartialWorkout: outcome === "partial",
    preserveExistingDetails: {
      workoutSession: session,
      businessType: "sport",
      activityType: "workout",
      visualType: "sport",
    },
  });

  return {
    feedback: result.feedback,
    explanation: result.explanation,
    freedMinutes: result.freedMinutes,
  };
}
