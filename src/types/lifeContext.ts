import type {
  DailyActivityCompletionState,
  DailyActivityUsage,
} from "../lib/planning/dailyActivityCompletionState";
import type { DecisionFactor, LifeDecision } from "./lifeDecision";

export type LifeDayType =
  | "WORKDAY"
  | "RESTDAY"
  | "VACATION"
  | "TRAVEL"
  | "PARENT_ALONE"
  | "WEEKEND"
  | "SPECIAL";

export type LifeFamilySituation =
  | "normal"
  | "parent_alone"
  | "partner_absent"
  | "child_sick"
  | "vacation"
  | "travel";

export type LifeEnergyPrediction = "low" | "medium" | "high" | "variable";

export type LifeProposalCategory =
  | "sport"
  | "study"
  | "calm"
  | "family"
  | "admin"
  | "reading"
  | "spiritual"
  | "rest"
  | "outing"
  | "leisure"
  | "couple"
  | "keep_free";

export type ScoredFreeSlot = {
  id: string;
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
  slotKind: "day" | "evening_available";
  score: number;
  scoreReason: string;
};

export type LifeProposal = {
  id: string;
  category: LifeProposalCategory;
  title: string;
  description: string;
  durationMinutes: number;
  reason: string;
  priority: "high" | "medium" | "low";
  slotId?: string;
  leisureActivityId?: string;
  taskId?: string;
  taskTitle?: string;
  confidence?: number;
  confidenceFactors?: DecisionFactor[];
  explanation?: string;
  decision?: LifeDecision;
};

export type LifeContext = {
  date: string;
  dayType: LifeDayType;
  dayTypeReason: string;
  workDay: boolean;
  vacation: boolean;
  restDay: boolean;
  travelDay: boolean;
  familySituation: LifeFamilySituation;
  availableMinutes: number;
  lockedMinutes: number;
  energyPrediction: LifeEnergyPrediction;
  childrenPresent: boolean;
  partnerPresent: boolean;
  sportPossible: boolean;
  morningWorkoutAutomaticallyAllowed: boolean;
  studyPossible: boolean;
  freeEvening: boolean;
  workoutCompletedToday: boolean;
  workoutMinutesCompletedToday: number;
  workoutTypeCompletedToday: string | null;
  priority: string | null;
  reasoning: string[];
  freeSlots: ScoredFreeSlot[];
  proposals: LifeProposal[];
  maxFillRatio: number;
  activityCompletion?: DailyActivityCompletionState;
  activityUsage?: DailyActivityUsage;
};

export const LIFE_DAY_TYPE_LABELS: Record<LifeDayType, string> = {
  WORKDAY: "Journée de travail",
  RESTDAY: "Journée de repos",
  VACATION: "Vacances",
  TRAVEL: "Déplacement",
  PARENT_ALONE: "Parent seul",
  WEEKEND: "Week-end",
  SPECIAL: "Journée particulière",
};
