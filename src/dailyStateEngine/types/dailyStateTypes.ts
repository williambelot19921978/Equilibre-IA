/**
 * EPIC 6C — Daily State types.
 */

export type DailyStateMood =
  | "excellent"
  | "good"
  | "average"
  | "tired"
  | "very_tired";

export type SpecialDayKind =
  | "normal"
  | "busy"
  | "family"
  | "important_work"
  | "sport"
  | "travel"
  | "vacation"
  | "other";

export type CheckinMode = "quick" | "standard" | "complete";

export type DailyStateSource = "checkin" | "edited" | "imported";

export type DailyState = {
  readonly date: string;
  readonly mood: DailyStateMood;
  readonly energy: number;
  readonly stress: number;
  readonly sleepQuality: number;
  readonly specialDay: SpecialDayKind;
  readonly notes?: string;
  readonly confidence: number;
  readonly source: DailyStateSource;
  readonly adaptiveAnswer?: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type CheckinSkipRecord = {
  readonly date: string;
  readonly skippedAt: string;
};

export type CheckinFlowStep =
  | "mood"
  | "energy"
  | "stress"
  | "sleep"
  | "specialDay"
  | "notes"
  | "adaptive_sleep";

export type CheckinFlowPlan = {
  readonly mode: CheckinMode;
  readonly steps: readonly CheckinFlowStep[];
  readonly adaptiveStep?: CheckinFlowStep;
  readonly estimatedSeconds: number;
};

export type StateTrendPeriod = "7d" | "30d" | "12m";

export type StateTrends = {
  readonly period: StateTrendPeriod;
  readonly averageEnergy: number;
  readonly averageStress: number;
  readonly averageSleepQuality: number;
  readonly averageFatigue: number;
  readonly moodDistribution: Readonly<Record<DailyStateMood, number>>;
  readonly evolution: "improving" | "stable" | "declining";
  readonly sampleCount: number;
  readonly disclaimer: string;
};

export type DailyStateSnapshot = {
  readonly enabled: boolean;
  readonly date: string;
  readonly today: DailyState | null;
  readonly hasCheckinToday: boolean;
  readonly skipCount: number;
  readonly shouldRemind: boolean;
  readonly reminderMessage?: string;
  readonly trends7d: StateTrends;
  readonly phrasingHints: readonly string[];
  readonly flowPlan: CheckinFlowPlan;
  readonly generatedAt: string;
};

export type DailyStateInput = {
  readonly userId: string;
  readonly date: string;
  readonly mood: DailyStateMood;
  readonly energy: number;
  readonly stress: number;
  readonly sleepQuality?: number;
  readonly specialDay?: SpecialDayKind;
  readonly notes?: string;
  readonly adaptiveAnswer?: boolean;
  readonly source?: DailyStateSource;
};

export const MOOD_OPTIONS: readonly {
  readonly value: DailyStateMood;
  readonly label: string;
  readonly emoji: string;
}[] = [
  { value: "excellent", label: "Excellent", emoji: "😀" },
  { value: "good", label: "Bien", emoji: "🙂" },
  { value: "average", label: "Moyen", emoji: "😐" },
  { value: "tired", label: "Fatigué", emoji: "😴" },
  { value: "very_tired", label: "Très fatigué", emoji: "😣" },
];

export const SPECIAL_DAY_OPTIONS: readonly {
  readonly value: SpecialDayKind;
  readonly label: string;
}[] = [
  { value: "normal", label: "Normale" },
  { value: "busy", label: "Chargée" },
  { value: "family", label: "Famille" },
  { value: "important_work", label: "Travail important" },
  { value: "sport", label: "Sport" },
  { value: "travel", label: "Déplacement" },
  { value: "vacation", label: "Vacances" },
  { value: "other", label: "Autre" },
];

export const DEFAULT_CHECKIN_MODE: CheckinMode = "standard";

export const MEDICAL_DISCLAIMER =
  "Tendances basées sur votre ressenti déclaré — aucun diagnostic médical.";
