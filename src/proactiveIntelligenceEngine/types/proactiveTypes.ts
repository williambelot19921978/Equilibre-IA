/**
 * EPIC 6B — Proactive Intelligence types.
 */

export type SuggestionKind =
  | "prevention"
  | "anticipation"
  | "optimization"
  | "encouragement"
  | "alert"
  | "organization"
  | "motivation";

export type SuggestionLifecycleState =
  | "generated"
  | "scheduled"
  | "displayed"
  | "accepted"
  | "dismissed"
  | "expired"
  | "cancelled";

export type PreparedActionType =
  | "moveTask"
  | "createTask"
  | "reorganizeDay"
  | "startFocusSession";

export type ProactiveExplainability = {
  readonly why: string;
  readonly observations: readonly string[];
  readonly habits: readonly string[];
  readonly goalId?: string;
  readonly goalName?: string;
  readonly whyNow: string;
  readonly whyNotLater: string;
  readonly confidenceLevel: number;
  readonly formula: string;
};

export type ProactiveSuggestion = {
  readonly id: string;
  readonly kind: SuggestionKind;
  readonly title: string;
  readonly description: string;
  readonly reason: string;
  readonly impact: string;
  readonly urgency: number;
  readonly confidence: number;
  readonly priority: number;
  readonly status: SuggestionLifecycleState;
  readonly score: number;
  readonly explainability: ProactiveExplainability;
  readonly preparedAction?: PreparedActionType;
  readonly scheduledFor?: string;
  readonly expiresAt: string;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type ProactiveScoreFactors = {
  readonly urgency: number;
  readonly importance: number;
  readonly confidence: number;
  readonly userImpact: number;
  readonly opportuneMoment: number;
  readonly mentalLoad: number;
  readonly dismissHistory: number;
  readonly availability: number;
};

export type ProactiveScore = ProactiveScoreFactors & {
  readonly finalScore: number;
  readonly shouldDisplay: boolean;
  readonly formula: string;
};

export type AttentionDecision = {
  readonly shouldIntervene: boolean;
  readonly delayUntil?: string;
  readonly cancel: boolean;
  readonly why: string;
  readonly whyNotNow?: string;
  readonly sensitivePeriod?: string;
};

export type SensitivePeriodKind =
  | "meeting"
  | "sleep"
  | "focus"
  | "sport"
  | "call"
  | "driving"
  | "family"
  | "vacation"
  | "deep_work";

export type CalendarEventInput = {
  readonly id: string;
  readonly title: string;
  readonly start: string;
  readonly end: string;
  readonly category?: string;
  readonly type?: string;
};

export type ProactiveIntelligenceInput = {
  readonly userId: string;
  readonly date: string;
  readonly now?: string;
  readonly calendarEvents?: readonly CalendarEventInput[];
  readonly mentalLoad?: number;
  readonly balanceScore?: number;
  readonly freeMinutes?: number;
  readonly conflictCount?: number;
  readonly topHabits?: readonly string[];
  readonly validatedPreferences?: readonly string[];
  readonly activeGoals?: readonly { readonly id: string; readonly name: string }[];
  readonly taskTodoCount?: number;
  readonly onVacation?: boolean;
  readonly sleepHours?: readonly { readonly start: string; readonly end: string }[];
  readonly dailyEnergy?: number;
  readonly dailyStress?: number;
};

export type ProactiveDigest = {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly suggestionIds: readonly string[];
  readonly scheduledFor?: string;
  readonly createdAt: string;
};

export type ProactiveTimelineEntryKind =
  | "suggestion_created"
  | "suggestion_scheduled"
  | "suggestion_displayed"
  | "suggestion_accepted"
  | "suggestion_dismissed"
  | "suggestion_expired"
  | "suggestion_cancelled"
  | "digest_created"
  | "life_transition_detected";

export type ProactiveTimelineEntry = {
  readonly id: string;
  readonly timestamp: string;
  readonly kind: ProactiveTimelineEntryKind;
  readonly message: string;
  readonly relatedId: string;
  readonly metadata: Readonly<Record<string, unknown>>;
};

export type LifeTransitionKind =
  | "new_job"
  | "schedule_change"
  | "new_child"
  | "vacation"
  | "post_vacation"
  | "relocation"
  | "new_activity";

export type LifeTransitionSignal = {
  readonly id: string;
  readonly kind: LifeTransitionKind;
  readonly label: string;
  readonly confidence: number;
  readonly message: string;
  readonly detectedAt: string;
};

export type ProactiveBehaviorMetrics = {
  readonly interruptionTolerance: number;
  readonly notificationPreference: "minimal" | "balanced" | "active";
  readonly acceptanceRate: number;
  readonly dismissRate: number;
  readonly preferredMoments: readonly string[];
};

export type ProactiveIntelligenceSnapshot = {
  readonly enabled: boolean;
  readonly date: string;
  readonly suggestions: readonly ProactiveSuggestion[];
  readonly displayableSuggestions: readonly ProactiveSuggestion[];
  readonly digests: readonly ProactiveDigest[];
  readonly timeline: readonly ProactiveTimelineEntry[];
  readonly behaviorMetrics: ProactiveBehaviorMetrics;
  readonly lifeTransitions: readonly LifeTransitionSignal[];
  readonly phrasingHints: readonly string[];
  readonly generatedAt: string;
};

export type NotificationChannel =
  | "in_app"
  | "push"
  | "email"
  | "watch"
  | "widget";

export type ProactiveNotification = {
  readonly channel: NotificationChannel;
  readonly message: string;
  readonly suggestionId: string;
  readonly at: string;
  readonly architectureOnly: true;
};
