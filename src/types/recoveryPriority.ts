export type RecoveryAction =
  | "reschedule"
  | "shorten"
  | "micro_step"
  | "clarify_blocker"
  | "deprioritize"
  | "archive";

export type RecoveryRecommendation = {
  action: RecoveryAction;
  recommendedDuration?: number;
  suggestedTime?: string;
  reason: string;
  confidence: "low" | "medium" | "high";
  requiresConfirmation: boolean;
  blockerOptions?: string[];
};

export type RecoveryTaskSignals = {
  taskId: string;
  title: string;
  category: string;
  skipCount: number;
  cancellationCount: number;
  consecutiveCancellations: number;
  durationMinutes: number;
  priority: number;
  dueDate?: string | null;
  knownBlocker?: string | null;
};
