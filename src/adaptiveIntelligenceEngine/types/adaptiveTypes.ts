/**
 * EPIC 6A — Adaptive Intelligence types.
 */

export type ObservationSource =
  | "planning"
  | "calendar"
  | "task"
  | "conversation"
  | "semantic"
  | "memory";

export type ObservationType =
  | "created"
  | "deleted"
  | "moved"
  | "cancelled"
  | "rescheduled"
  | "repeated"
  | "completed";

export type BehaviorObservation = {
  readonly id: string;
  readonly timestamp: string;
  readonly source: ObservationSource;
  readonly type: ObservationType;
  readonly confidence: number;
  readonly label: string;
  readonly metadata: Readonly<Record<string, unknown>>;
};

export type HabitKind =
  | "sport"
  | "sleep"
  | "work"
  | "preferred_slot"
  | "personal_time"
  | "reading"
  | "meditation"
  | "study"
  | "work_focus";

export type DetectedHabit = {
  readonly id: string;
  readonly kind: HabitKind;
  readonly label: string;
  readonly score: number;
  readonly frequency: number;
  readonly stability: number;
  readonly antiquityDays: number;
  readonly evolution: "emerging" | "stable" | "declining" | "abandoned";
  readonly preferredTime?: string;
  readonly observationIds: readonly string[];
};

export type PreferenceValidationState =
  | "pending"
  | "accepted"
  | "rejected"
  | "expired"
  | "obsolete";

export type ConfidenceExplanation = {
  readonly why: string;
  readonly dataUsed: readonly string[];
  readonly observationCount: number;
  readonly periodDays: number;
  readonly confidenceLevel: number;
  readonly formula: string;
};

export type PreferenceProposal = {
  readonly id: string;
  readonly kind: HabitKind;
  readonly label: string;
  readonly proposedValue: string;
  readonly status: PreferenceValidationState;
  readonly confidence: number;
  readonly explainability: ConfidenceExplanation;
  readonly habitId: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly validatedAt?: string;
};

export type LearningTimelineEntryKind =
  | "habit_detected"
  | "preference_proposed"
  | "preference_accepted"
  | "preference_rejected"
  | "habit_evolved"
  | "habit_obsolete";

export type LearningTimelineEntry = {
  readonly id: string;
  readonly timestamp: string;
  readonly kind: LearningTimelineEntryKind;
  readonly message: string;
  readonly relatedId: string;
  readonly metadata: Readonly<Record<string, unknown>>;
};

export type AdaptiveIntelligenceSnapshot = {
  readonly enabled: boolean;
  readonly date: string;
  readonly observations: readonly BehaviorObservation[];
  readonly habits: readonly DetectedHabit[];
  readonly proposals: readonly PreferenceProposal[];
  readonly validatedPreferences: readonly PreferenceProposal[];
  readonly timeline: readonly LearningTimelineEntry[];
  readonly phrasingHints: readonly string[];
  readonly generatedAt: string;
};

export type AdaptiveIntelligenceInput = {
  readonly userId: string;
  readonly date: string;
  readonly calendarEvents?: readonly {
    readonly id: string;
    readonly title: string;
    readonly start: string;
    readonly end: string;
    readonly category?: string;
    readonly type?: string;
  }[];
  readonly taskEvents?: readonly {
    readonly id: string;
    readonly title: string;
    readonly eventType: string;
    readonly occurredAt: string;
  }[];
};

export type AdaptiveNotificationKind =
  | "habit_detected"
  | "preference_proposed"
  | "habit_obsolete";

export type AdaptiveNotification = {
  readonly kind: AdaptiveNotificationKind;
  readonly message: string;
  readonly at: string;
  readonly architectureOnly: true;
};
