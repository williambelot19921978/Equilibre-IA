/**
 * EPIC 6E — Life Knowledge types.
 */

export type LifeKnowledgeCategory =
  | "personal_life"
  | "work"
  | "health_recovery"
  | "preferences"
  | "long_term_goals"
  | "life_changes";

export type LifeKnowledgeSource =
  | "settings"
  | "observed"
  | "voluntary"
  | "goals"
  | "user_confirmed";

export type LifeKnowledgeStatus =
  | "active"
  | "pending_confirmation"
  | "confirmed"
  | "forgotten"
  | "rejected";

export type ConfirmationChoice = "yes" | "no" | "later" | "never";

export type LifeKnowledgeItem = {
  readonly id: string;
  readonly category: LifeKnowledgeCategory;
  readonly label: string;
  readonly value: string;
  readonly source: LifeKnowledgeSource;
  readonly confidence: number;
  readonly status: LifeKnowledgeStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly lastVerifiedAt?: string;
  readonly evidence?: readonly string[];
};

export type ConfirmationProposal = {
  readonly id: string;
  readonly knowledgeId: string;
  readonly message: string;
  readonly observation: string;
  readonly confidence: number;
  readonly createdAt: string;
  readonly status: "pending" | "accepted" | "rejected" | "deferred" | "never";
};

export type LifeTimelineEvent = {
  readonly id: string;
  readonly kind:
    | "new_job"
    | "birth"
    | "move"
    | "schedule_change"
    | "new_goal"
    | "vacation"
    | "other";
  readonly title: string;
  readonly description: string;
  readonly date: string;
  readonly source: LifeKnowledgeSource;
  readonly createdAt: string;
};

export type LifeKnowledgeInput = {
  readonly userId: string;
  readonly date: string;
  readonly now?: string;
  readonly profileFacts?: readonly {
    readonly fact_key: string;
    readonly fact_value: { readonly value?: string | number | string[] | null; readonly [key: string]: unknown };
  }[];
  readonly livingInsights?: readonly {
    readonly id: string;
    readonly category: string;
    readonly label: string;
    readonly detail: string;
    readonly confidence: number;
    readonly status: string;
  }[];
  readonly validatedPreferences?: readonly {
    readonly id: string;
    readonly label: string;
    readonly proposedValue: string;
    readonly confidence: number;
  }[];
  readonly activeGoals?: readonly { readonly id: string; readonly name: string }[];
  readonly childrenCount?: number;
};

export type LifeKnowledgeSnapshot = {
  readonly enabled: boolean;
  readonly date: string;
  readonly items: readonly LifeKnowledgeItem[];
  readonly visibleItems: readonly LifeKnowledgeItem[];
  readonly pendingConfirmations: readonly ConfirmationProposal[];
  readonly timeline: readonly LifeTimelineEvent[];
  readonly phrasingHints: readonly string[];
  readonly knowledgeCount: number;
  readonly confirmedCount: number;
  readonly generatedAt: string;
};

export const CATEGORY_LABELS: Record<LifeKnowledgeCategory, string> = {
  personal_life: "Vie personnelle",
  work: "Travail",
  health_recovery: "Santé / récupération",
  preferences: "Préférences",
  long_term_goals: "Objectifs long terme",
  life_changes: "Changements de vie",
};

export const CONFIRMATION_THRESHOLD = 0.85;

export const COACH_KNOWLEDGE_THRESHOLD = 0.85;

export const HIGH_CONFIDENCE_THRESHOLD = 0.92;
