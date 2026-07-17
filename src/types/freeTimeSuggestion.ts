export type FreeTimeSuggestionType =
  | "sport"
  | "study"
  | "calm"
  | "family_outing"
  | "spiritual"
  | "personal_task"
  | "vacation_activity"
  | "leisure"
  | "music"
  | "keep_free";

export type FreeTimeSuggestionAction =
  | "generate_sport"
  | "assign_study"
  | "open_calm"
  | "create_family"
  | "show_spiritual"
  | "create_task"
  | "add_leisure"
  | "open_spotify"
  | "keep_free";

export type FreeTimeSuggestion = {
  id: string;
  type: FreeTimeSuggestionType;
  title: string;
  description: string;
  recommendedDuration: number;
  reason: string;
  priority: "high" | "medium" | "low";
  action: FreeTimeSuggestionAction;
  optionalContent?: Record<string, unknown>;
  studyProgress?: {
    taskId?: string;
    taskTitle: string;
    isFreeRevision: boolean;
    plannedMinutesThisWeek: number;
    completedMinutesThisWeek: number;
    weeklyGoalMinutes: number;
    progressLabel: string;
  };
  isPrimaryRecommendation?: boolean;
  confidence?: number;
  confidenceFactors?: Array<{ id: string; label: string; positive: boolean }>;
  explanation?: string;
};

export type SportSessionContent = {
  title: string;
  durationMinutes: number;
  sportType: string;
  intensity: string;
  steps: string[];
  equipment?: string;
};

export type SpiritualContentItem = {
  id: string;
  type: "verse" | "encouragement" | "prayer" | "gratitude" | "reflection";
  reference: string;
  text: string;
};
