export type LivingInsightStatus =
  | "learned"
  | "confirmed"
  | "rejected"
  | "deferred";

export type HabitTrendDirection = "improving" | "degrading" | "stable";

export type EvolvingMetric<T> = {
  value: T;
  confidence: number;
  sampleSize: number;
  updatedAt: string;
};

export type LivingHabitProfile = {
  preferredStudyTime?: EvolvingMetric<"morning" | "afternoon" | "evening">;
  preferredWorkoutDuration?: EvolvingMetric<number>;
  preferredWorkoutDay?: EvolvingMetric<string>;
  preferredWorkoutHour?: EvolvingMetric<number>;
  preferredCoupleTime?: EvolvingMetric<"morning" | "afternoon" | "evening">;
  preferredSleepTime?: EvolvingMetric<number>;
  averageWorkoutDuration?: EvolvingMetric<number>;
  averageStudyDuration?: EvolvingMetric<number>;
  averageCancellationRate?: EvolvingMetric<number>;
  bestProductivityWindow?: EvolvingMetric<"morning" | "afternoon" | "evening">;
  fatigueRecoverySpeed?: EvolvingMetric<"slow" | "medium" | "fast">;
  preferredFreeTimeBlocks?: EvolvingMetric<string[]>;
  socialMediaTolerance?: EvolvingMetric<"low" | "medium" | "high">;
  favoriteLeisureActivities?: EvolvingMetric<string[]>;
};

export type LivingInsight = {
  id: string;
  category: string;
  label: string;
  detail: string;
  reasoning: string;
  evidence: string[];
  confidence: number;
  firstSeen: string;
  lastConfirmed: string;
  evidenceCount: number;
  status: LivingInsightStatus;
  trend?: HabitTrendDirection;
};

export type HabitTrend = {
  id: string;
  direction: HabitTrendDirection;
  label: string;
  detail: string;
  confidence: number;
  evidence: string[];
};

export type KnowledgeLevelId =
  | "starting"
  | "understanding"
  | "know_well"
  | "anticipating";

export type KnowledgeLevel = {
  id: KnowledgeLevelId;
  label: string;
  score: number;
  nextLabel?: string;
  progressPercent: number;
};

export type DailyMissionCategory =
  | "sport"
  | "study"
  | "family"
  | "couple"
  | "rest"
  | "spiritual"
  | "organization"
  | "calm";

export type DailyMission = {
  id: string;
  category: DailyMissionCategory;
  title: string;
  description: string;
  reasoning: string;
  evidence: string[];
};

export type WeeklyMission = {
  id: string;
  title: string;
  description: string;
  targetLabel: string;
  optional: true;
  reasoning: string;
  evidence: string[];
};

export type AdaptiveSuggestion = {
  id: string;
  domain: "sport" | "study" | "calm" | "couple" | "walk" | "leisure" | "reading";
  message: string;
  previousValue: string;
  suggestedValue: string;
  confidence: number;
  evidence: string[];
};

export type EvolvingGoalSuggestion = {
  id: string;
  domain: "sport" | "study" | "calm" | "organization";
  direction: "increase" | "decrease" | "maintain";
  title: string;
  explanation: string;
  confidence: number;
  evidence: string[];
};

export type LivingMemory = {
  userId: string;
  habitProfile: LivingHabitProfile;
  insights: LivingInsight[];
  trends: HabitTrend[];
  knowledgeLevel: KnowledgeLevel;
  globalConfidence: number;
  coachPersonality: string;
  dailyMission: DailyMission | null;
  weeklyMission: WeeklyMission | null;
  adaptiveSuggestions: AdaptiveSuggestion[];
  goalSuggestions: EvolvingGoalSuggestion[];
  recentlyLearned: LivingInsight[];
  stillLearning: LivingInsight[];
  uncertain: LivingInsight[];
  updatedAt: string;
};

export const KNOWLEDGE_LEVEL_LABELS: Record<KnowledgeLevelId, string> = {
  starting: "Je commence à te connaître.",
  understanding: "Je comprends tes habitudes.",
  know_well: "Je connais très bien ton rythme.",
  anticipating: "Je peux anticiper certaines décisions.",
};
