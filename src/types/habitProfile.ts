export type HabitInsightKind =
  | "preferred_sport_time"
  | "preferred_study_time"
  | "preferred_sport_type"
  | "typical_session_duration"
  | "calm_after_work"
  | "low_evening_activity"
  | "weekend_running"
  | "revision_morning"
  | "natural_rhythm";

export type HabitInsightStatus = "learned" | "confirmed" | "rejected" | "deferred";

export type HabitInsight = {
  id: string;
  kind: HabitInsightKind;
  label: string;
  detail: string;
  confidence: number;
  lastUpdated: string;
  status: HabitInsightStatus;
  evidenceCount: number;
};

export type HabitProfile = {
  userId: string;
  insights: HabitInsight[];
  updatedAt: string;
};
