import type { CalendarActivityCategory } from "../lib/planning/classifyCalendarItemActivity";
import type { CompletionTiming } from "../lib/planning/evaluateCompletionTiming";

export type AchievementTone = "calm" | "encouraging" | "celebratory" | "reflective";

export type CelebrationLevel = "discrete" | "normal" | "important";

export type AchievementFeedback = {
  id: string;
  title: string;
  message: string;
  tone: AchievementTone;
  icon: string;
  celebrationLevel: CelebrationLevel;
  statusLabel: string;
  followUpSuggestion?: string;
};

export type AchievementFeedbackInput = {
  activityCategory: CalendarActivityCategory;
  activityType?: string;
  visualType?: string;
  title: string;
  completionTiming: CompletionTiming;
  durationMinutes?: number;
  deltaMinutes?: number;
  priority?: string | null;
  skipCount?: number;
  cancellationCount?: number;
  energyLevel?: string | null;
  dayType?: "normal" | "heavy" | "light";
  streakCount?: number;
  completedPercentage?: number;
  isWorkout?: boolean;
  isPartialWorkout?: boolean;
  recentFeedbackIds?: string[];
};

export type ActivityCompletionDetails = {
  status: "completed";
  scheduled_starts_at: string;
  scheduled_ends_at: string;
  actual_started_at?: string;
  actual_completed_at: string;
  completion_delta_minutes: number;
  completion_timing: CompletionTiming;
  achievement_feedback_id: string;
  achievement_message: string;
  achievement_title: string;
  completion_status_label: string;
  celebration_level: CelebrationLevel;
  freed_minutes?: number;
};
