export type TaskActivityEventType =
  | "created"
  | "planned"
  | "started"
  | "completed"
  | "skipped"
  | "cancelled"
  | "shortened"
  | "moved";

export type TaskActivityEventRecord = {
  id: string;
  household_id: string;
  user_id: string;
  task_id: string | null;
  calendar_item_id: string | null;
  event_type: TaskActivityEventType;
  occurred_at: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type BlockActionType =
  | "reschedule"
  | "no_time"
  | "modify"
  | "complete"
  | "cancel";

export type RescheduleOption = "later_today" | "tomorrow" | "custom" | "next_slot";

export type NoTimeChoice =
  | "cancel_today"
  | "postpone"
  | "shorten_10"
  | "shorten_15"
  | "keep";
