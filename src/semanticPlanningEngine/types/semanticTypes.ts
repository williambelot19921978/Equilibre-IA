/**
 * EPIC 5C — Semantic planning shared types.
 */

export type SemanticCategory =
  | "sante"
  | "travail"
  | "sport"
  | "famille"
  | "deplacement"
  | "etudes"
  | "personnel"
  | "social"
  | "spirituel"
  | "repos"
  | "autre";

export type EnergyLevel = "faible" | "moyenne" | "elevee";

export type FlexibilityLevel = "fixe" | "deplacable" | "flexible";

export type ImportanceLevel = 1 | 2 | 3 | 4 | 5;

export type SemanticEnrichment = {
  readonly category: SemanticCategory;
  readonly subcategory: string;
  readonly importance: ImportanceLevel;
  readonly energyBefore: EnergyLevel;
  readonly energyAfter: EnergyLevel;
  readonly stressLevel: number;
  readonly preparationNeeded: boolean;
  readonly travelNeeded: boolean;
  readonly recoveryNeeded: boolean;
  readonly estimatedDuration: number;
  readonly focusRequired: boolean;
  readonly familyImpact: number;
  readonly goalImpact: number;
  readonly healthImpact: number;
  readonly financialImpact: number;
  readonly socialImpact: number;
  readonly flexibility: FlexibilityLevel;
  readonly confidence: number;
  readonly tags: readonly string[];
};

export type DailyLoadBreakdown = {
  readonly mentalLoad: number;
  readonly physicalLoad: number;
  readonly focusMinutes: number;
  readonly travelMinutes: number;
  readonly personalMinutes: number;
  readonly familyMinutes: number;
  readonly workMinutes: number;
  readonly healthMinutes: number;
  readonly freeMinutes: number;
  readonly totalBusyMinutes: number;
};

export type LifeBalancePeriod = "daily" | "weekly" | "monthly";

export type LifeBalanceSignal =
  | "overload"
  | "sleep_deficit"
  | "no_sport"
  | "no_personal_time"
  | "work_overinvestment"
  | "family_imbalance"
  | "balanced";

export type LifeBalanceAssessment = {
  readonly period: LifeBalancePeriod;
  readonly score: number;
  readonly signals: readonly LifeBalanceSignal[];
  readonly confidence: number;
  readonly explanation: string;
};

export type SemanticInsight = {
  readonly id: string;
  readonly message: string;
  readonly category: SemanticCategory | "equilibre" | "charge" | "objectif" | "foyer";
  readonly confidence: number;
  readonly explainability: SemanticExplainability;
};

export type SemanticExplainability = {
  readonly why: string;
  readonly dataUsed: readonly string[];
  readonly calculation: string;
  readonly confidenceLevel: number;
};

export type GoalImpactLink = {
  readonly goalId: string;
  readonly goalName: string;
  readonly impactScore: number;
  readonly reason: string;
};

export type HouseholdTimeVision = {
  readonly togetherMinutes: number;
  readonly sharedFreeMinutes: number;
  readonly parentMinutes: number;
  readonly childrenMinutes: number;
  readonly individualMinutes: number;
  readonly confidence: number;
};

export type PredictionKind =
  | "cancellation"
  | "delay"
  | "overload"
  | "goal_miss";

export type SemanticPrediction = {
  readonly kind: PredictionKind;
  readonly probability: number;
  readonly horizon: LifeBalancePeriod;
  readonly message: string;
  readonly architectureOnly: true;
};

export type LifeProfileKind =
  | "celibataire"
  | "couple"
  | "famille"
  | "etudiant"
  | "travailleur_poste"
  | "independant";

export type SemanticBriefHint = {
  readonly id: string;
  readonly message: string;
  readonly priority: number;
  readonly explainability: SemanticExplainability;
};

export type SemanticPlanningSnapshot = {
  readonly enabled: boolean;
  readonly date: string;
  readonly items: readonly import("./semanticCalendarItem").SemanticCalendarItem[];
  readonly dailyLoad: DailyLoadBreakdown;
  readonly balance: {
    readonly daily: LifeBalanceAssessment;
    readonly weekly: LifeBalanceAssessment;
    readonly monthly: LifeBalanceAssessment;
  };
  readonly insights: readonly SemanticInsight[];
  readonly predictions: readonly SemanticPrediction[];
  readonly household: HouseholdTimeVision;
  readonly briefHints: readonly SemanticBriefHint[];
  readonly categoryDistribution: Readonly<Record<SemanticCategory, number>>;
  readonly generatedAt: string;
};
