export type NlpIntent =
  | "modify_work"
  | "modify_vacation"
  | "modify_travel"
  | "modify_children"
  | "modify_sleep"
  | "modify_sport"
  | "modify_study"
  | "modify_tasks"
  | "modify_calendar"
  | "modify_spiritual"
  | "declare_fatigue"
  | "quiet_evening"
  | "ask_question"
  | "request_suggestion"
  | "confirm"
  | "cancel"
  | "unknown";

export type NlpScope = "punctual" | "recurring" | "period";

export type NlpActionType =
  | "CreateVacationPeriod"
  | "MarkWorkDay"
  | "MarkRestDay"
  | "CreateWorkTravelPeriod"
  | "UpdateWorkScheduleToday"
  | "UpdateWorkSchedulePermanent"
  | "CreateWorkoutTask"
  | "CreateReadingBlock"
  | "CreatePrayerBlock"
  | "CreateAppointment"
  | "DeleteSportTasks"
  | "CancelTasksByCategory"
  | "CreateChildContextPeriod"
  | "UpdateSleep"
  | "ReduceFillRatio"
  | "QuietEvening"
  | "RebuildDay"
  | "ExplainDay"
  | "NoOp";

export type NlpEntity = {
  dates: string[];
  dateRange?: { start: string; end: string };
  times: string[];
  durationMinutes?: number;
  durationDeltaMinutes?: number;
  weekday?: string;
  weekdays?: string[];
  person?: string;
  childName?: string;
  location?: string;
  activity?: string;
  workTimeStart?: string;
  workTimeEnd?: string;
  workExceptionKind?:
    | "cancel"
    | "half_morning"
    | "half_afternoon"
    | "work_morning_only"
    | "work_afternoon_only"
    | "time_override"
    | "start_override"
    | "end_override";
  scope: NlpScope;
  recurring: boolean;
};

export type NlpAction = {
  type: NlpActionType;
  payload: Record<string, unknown>;
  requiresConfirmation: boolean;
  explanation: string;
  reason: string;
};

export type NlpParseResult = {
  intent: NlpIntent;
  confidence: number;
  entities: NlpEntity;
  rawText: string;
};

export type ConversationMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  timestamp: string;
};

export type ConversationPendingState =
  | {
      kind: "confirmation";
      actions: NlpAction[];
      prompt: string;
    }
  | {
      kind: "memory_proposal";
      actions: NlpAction[];
      prompt: string;
    }
  | {
      kind: "clarification";
      action: import("../lib/nlp/pendingConversationAction").PendingConversationAction;
      message: string;
    };

export type ConversationState = {
  messages: ConversationMessage[];
  pending?: ConversationPendingState;
};

export type ConversationTurnResult = {
  state: ConversationState;
  actionsExecuted: NlpAction[];
  replanDates: string[];
  assistantMessage: string;
  explanation: string[];
  debug?: NlpDebugInfo;
};

export type NlpDebugInfo = {
  normalizedText: string;
  detectedIntent: NlpIntent;
  confidence: number;
  entities: NlpEntity;
  resolvedActionTypes: string[];
  serviceResult?: string[];
  error?: string;
};

export type NlpRuntimeContext = {
  userId: string;
  referenceDate: string;
  childNames: string[];
  defaultWorkStart?: string;
  defaultWorkEnd?: string;
  tasks: Array<{ id: string; title: string; category: string; status: string }>;
};

export type NlpExecutionResult = {
  summaries: string[];
  replanDates: string[];
  explanation: string[];
  persistSucceeded: boolean;
  replanSucceeded: boolean;
  replanFailures: string[];
  workBlocksVerified: boolean;
  persistError?: string;
};
