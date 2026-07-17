import type { TaskRecord } from "./database";

export type EnergyLevel = "high" | "medium" | "low" | "variable";

export type DayPeriod = "morning" | "midday" | "afternoon" | "evening";

export type ConstraintType =
  | "wake"
  | "sleep"
  | "breakfast"
  | "dinner"
  | "personal_prep"
  | "morning_routine"
  | "commute_out"
  | "work"
  | "commute_in"
  | "evening_transition"
  | "evening_routine"
  | "rest_day"
  | "day_banner"
  | "manual";

export type DayConstraint = {
  id: string;
  type: ConstraintType;
  title: string;
  startsAt: string;
  endsAt: string;
  locked: boolean;
  source: "engine" | "manual";
  incomplete?: boolean;
  incompleteReason?: string;
};

export type AvailableSlot = {
  id: string;
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
  energyLevel: EnergyLevel;
  period: DayPeriod;
};

export type PlanningExplanation = {
  summary: string;
  facts: string[];
  confidence: "estimated" | "certain";
};

export type PlannedBlockType = "constraint" | "task" | "buffer" | "margin";

export type PlannedBlock = {
  id: string;
  blockType: PlannedBlockType;
  title: string;
  startsAt: string;
  endsAt: string;
  taskId?: string;
  category?: string;
  locked: boolean;
  source: "engine" | "manual";
  explanation: PlanningExplanation;
  segmentIndex?: number;
  segmentTotal?: number;
  energyLevel?: EnergyLevel;
};

export type UnplannableTask = {
  taskId: string;
  title: string;
  reason: string;
};

export type IgnoredCalendarItem = {
  id: string;
  title: string;
  reason: string;
};

export type DayPlan = {
  date: string;
  constraints: DayConstraint[];
  blocks: PlannedBlock[];
  margins: PlannedBlock[];
  unplannableTasks: UnplannableTask[];
  freeMinutesRemaining: number;
  totalFreeMinutes: number;
  fillPercentage: number;
  incompleteData: string[];
  contextAdaptations: string[];
  contextWarnings: string[];
  ignoredCalendarItems?: IgnoredCalendarItem[];
};

export type PlanningRejection = {
  block: PlannedBlock;
  reason: string;
};

export type PlanningResult = {
  plan: DayPlan;
  rejectedBlocks: PlanningRejection[];
};

export type TaskSegment = {
  taskId: string;
  title: string;
  durationMinutes: number;
  segmentIndex: number;
  segmentTotal: number;
  originalTask: TaskRecord;
  isRestartSession: boolean;
};

export type ScoredTask = {
  task: TaskRecord;
  score: number;
  segments: TaskSegment[];
  requiredEnergy: EnergyLevel;
};
