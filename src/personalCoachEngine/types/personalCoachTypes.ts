/**
 * EPIC 6D — Personal Coach types.
 */

export type CoachingDomain =
  | "physical_activity"
  | "sleep_recovery"
  | "mental_load"
  | "wellbeing"
  | "family_life"
  | "study_learning"
  | "personal_goals";

export type LifePriority =
  | "balance"
  | "family"
  | "wellbeing"
  | "sport"
  | "study"
  | "personal_goals";

export type CoachAdviceKind =
  | "observation"
  | "opportunity"
  | "tip"
  | "encouragement"
  | "recovery"
  | "success"
  | "weekly_review"
  | "monthly_reflection";

export type CoachingSessionKind = "daily" | "weekly" | "ad_hoc";

export type CoachExplainability = {
  readonly why: string;
  readonly whyToday: string;
  readonly goalId?: string;
  readonly goalName?: string;
  readonly expectedImpact: string;
  readonly confidence: number;
};

export type CoachAdvice = {
  readonly id: string;
  readonly domain: CoachingDomain;
  readonly kind: CoachAdviceKind;
  readonly title: string;
  readonly message: string;
  readonly suggestion?: string;
  readonly explainability: CoachExplainability;
  readonly estimatedSeconds: number;
};

export type CoachingSession = {
  readonly id: string;
  readonly kind: CoachingSessionKind;
  readonly title: string;
  readonly messages: readonly CoachAdvice[];
  readonly estimatedSeconds: number;
  readonly optional: true;
  readonly createdAt: string;
};

export type DomainInsights = {
  readonly domain: CoachingDomain;
  readonly label: string;
  readonly observations: readonly string[];
  readonly opportunities: readonly CoachAdvice[];
  readonly tips: readonly CoachAdvice[];
  readonly encouragements: readonly CoachAdvice[];
};

export type PersonalCoachInput = {
  readonly userId: string;
  readonly date: string;
  readonly now?: string;
  readonly firstName?: string;
  readonly lifePriority?: LifePriority;
  readonly dailyEnergy?: number;
  readonly dailyStress?: number;
  readonly dailyMood?: string;
  readonly mentalLoad?: number;
  readonly balanceScore?: number;
  readonly freeMinutes?: number;
  readonly conflictCount?: number;
  readonly taskTodoCount?: number;
  readonly activeGoals?: readonly { readonly id: string; readonly name: string }[];
  readonly validatedHabits?: readonly string[];
  readonly topHabits?: readonly string[];
  readonly recentSuccesses?: readonly string[];
  readonly trendEnergy7d?: number;
  readonly trendStress7d?: number;
  readonly skipStreak?: number;
  readonly blockCount?: number;
  readonly childrenCount?: number;
  readonly confirmedKnowledge?: readonly string[];
};

export type PersonalCoachSnapshot = {
  readonly enabled: boolean;
  readonly date: string;
  readonly lifePriority: LifePriority;
  readonly todayInsights: readonly CoachAdvice[];
  readonly opportunities: readonly CoachAdvice[];
  readonly recovery: readonly CoachAdvice[];
  readonly successes: readonly CoachAdvice[];
  readonly weeklyReview: CoachAdvice | null;
  readonly monthlyReflection: CoachAdvice | null;
  readonly domainInsights: readonly DomainInsights[];
  readonly proposedSession: CoachingSession | null;
  readonly phrasingHints: readonly string[];
  readonly generatedAt: string;
};

export const COACHING_DOMAIN_LABELS: Record<CoachingDomain, string> = {
  physical_activity: "Activité physique",
  sleep_recovery: "Sommeil et récupération",
  mental_load: "Charge mentale",
  wellbeing: "Bien-être",
  family_life: "Vie familiale",
  study_learning: "Études / apprentissage",
  personal_goals: "Objectifs personnels",
};

export const LIFE_PRIORITY_OPTIONS: readonly {
  readonly value: LifePriority;
  readonly label: string;
}[] = [
  { value: "balance", label: "Équilibre" },
  { value: "family", label: "Famille" },
  { value: "wellbeing", label: "Bien-être" },
  { value: "sport", label: "Sport" },
  { value: "study", label: "Études" },
  { value: "personal_goals", label: "Objectifs personnels" },
];

export const DEFAULT_LIFE_PRIORITY: LifePriority = "balance";

export const COACH_DISCLAIMER =
  "Accompagnement basé sur votre contexte déclaré — aucune action automatique.";

export const ALL_COACHING_DOMAINS: readonly CoachingDomain[] = [
  "physical_activity",
  "sleep_recovery",
  "mental_load",
  "wellbeing",
  "family_life",
  "study_learning",
  "personal_goals",
];
