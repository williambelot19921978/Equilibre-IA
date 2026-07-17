export type SpiritualContentType =
  | "verse"
  | "motivation"
  | "prayer"
  | "reflection"
  | "gratitude"
  | "encouragement"
  | "calm_invitation";

export type SpiritualFaithLevel = "neutral" | "christian";

export type SpiritualContentContext =
  | "morning"
  | "evening"
  | "fatigue"
  | "family"
  | "alone"
  | "vacation"
  | "work"
  | "any";

export type PrayerCategory =
  | "morning"
  | "evening"
  | "gratitude"
  | "courage"
  | "fatigue"
  | "family"
  | "children"
  | "work"
  | "studies"
  | "peace"
  | "difficulty";

export type SpiritualContentItem = {
  id: string;
  type: SpiritualContentType;
  title?: string;
  text: string;
  reference?: string;
  tags: string[];
  contexts: SpiritualContentContext[];
  durationMinutes: number;
  faithLevel: SpiritualFaithLevel;
  /** Source biblique documentée (ex. Louis Segond 1910). */
  source?: string;
  prayerCategory?: PrayerCategory;
};

export type RelaxationGuide = {
  id: string;
  title: string;
  durationMinutes: number;
  steps: string[];
  tags: string[];
  faithLevel: SpiritualFaithLevel;
};

export type SpiritualActivityType =
  | "breathing"
  | "silence"
  | "relaxation"
  | "prayer"
  | "gratitude"
  | "reading"
  | "walk"
  | "music"
  | "screen_free"
  | "reflection";

export type SpiritualSuggestion = {
  id: string;
  activityType: SpiritualActivityType;
  title: string;
  description: string;
  durationMinutes: number;
  reason: string;
  optional: boolean;
  content?: SpiritualContentItem;
  guide?: RelaxationGuide;
};

export type SpiritualScheduleOption = "now" | "next_free" | "custom";

export type SpiritualFavoriteRecord = {
  id: string;
  user_id: string;
  household_id: string;
  content_id: string;
  content_type: string;
  custom_text: string | null;
  created_at: string;
};

export type SpiritualPreferences = {
  faithImportance?: string;
  faithContent: string[];
  frequency?: string;
  preferredDuration?: number;
  preferredMoment?: string;
  themesAvoid: string[];
  showOnHome: boolean;
  afterWorkEnergy?: string;
};
