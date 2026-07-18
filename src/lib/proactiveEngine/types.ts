export type ScheduledDayItem = {
  id: string;
  title: string;
  category?: string | null;
  startsAt: string;
  endsAt: string;
  status?: string | null;
  priority?: string | null;
  postponementCount?: number;
};

export type DayAnalysisSleep = {
  plannedHours?: number | null;
  actualHours?: number | null;
};

export type DayAnalysisUserPreferences = {
  preferredDailyLoadMinutes?: number;
  minimumSleepHours?: number;
  minimumPersonalTimeMinutes?: number;
  minimumSportMinutesPerWeek?: number;
};

export type DayAnalysisInput = {
  date: string;
  scheduledItems: ScheduledDayItem[];
  sleep?: DayAnalysisSleep;
  personalTimeMinutes?: number;
  sportMinutes?: number;
  studyMinutes?: number;
  workMinutes?: number;
  childcareMinutes?: number;
  travelMinutes?: number;
  userPreferences?: DayAnalysisUserPreferences;
};

export type BalanceLevel = "balanced" | "busy" | "overloaded";

export type BalanceScoreFactor = {
  code: string;
  label: string;
  impact: number;
  explanation: string;
};

export type BalanceScoreResult = {
  score: number;
  level: BalanceLevel;
  factors: BalanceScoreFactor[];
};

export type OverloadSeverity = "info" | "warning" | "critical";

export type OverloadReason = {
  code: string;
  severity: OverloadSeverity;
  explanation: string;
};

export type OverloadDetectionResult = {
  overloaded: boolean;
  reasons: OverloadReason[];
  totalPlannedMinutes: number;
  overlapCount: number;
  highPriorityCount: number;
  lastActivityEndMinutes: number | null;
};

export type PostponementSeverity = "info" | "warning" | "critical";

export type PostponementInsight = {
  taskId: string;
  title: string;
  count: number;
  severity: PostponementSeverity;
  message: string;
};

export type PostponementDetectionResult = {
  items: PostponementInsight[];
  maxCount: number;
};

export type ProactiveInsightType =
  | "overload"
  | "sleep"
  | "postponement"
  | "personal_time"
  | "sport"
  | "planning";

export type ProactiveInsightSeverity = "info" | "warning" | "critical";

export type ProactiveSuggestedAction = {
  type: string;
  label: string;
  payload?: Record<string, unknown>;
};

export type ProactiveInsight = {
  id: string;
  type: ProactiveInsightType;
  severity: ProactiveInsightSeverity;
  title: string;
  message: string;
  reason: string;
  suggestedAction?: ProactiveSuggestedAction;
};

export type ProactiveAnalysisResult = {
  date: string;
  balanceScore: BalanceScoreResult | null;
  overload: OverloadDetectionResult | null;
  postponements: PostponementDetectionResult | null;
  insights: ProactiveInsight[];
  hasSufficientData: boolean;
};
