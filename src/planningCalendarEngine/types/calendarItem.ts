/**
 * EPIC 5A — Unified CalendarItem contract.
 * Single temporal entity for planning, agenda, tasks, goals, appointments.
 */

export type CalendarItemType =
  | "event"
  | "task"
  | "appointment"
  | "goal"
  | "reminder"
  | "constraint"
  | "free"
  | "other";

export type CalendarItemStatus =
  | "proposed"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "tentative";

export type CalendarSyncState =
  | "local"
  | "synced"
  | "pending"
  | "conflict"
  | "external"
  | "error";

export type CalendarItemOrigin =
  | "internal"
  | "task"
  | "goal"
  | "manual"
  | "engine"
  | "google"
  | "outlook"
  | "apple";

export type CalendarRecurrence = {
  readonly frequency?: "daily" | "weekly" | "monthly" | "yearly";
  readonly interval?: number;
  readonly until?: string;
  readonly rule?: string;
};

export type CalendarParticipant = {
  readonly id: string;
  readonly name?: string;
  readonly email?: string;
  readonly role?: "owner" | "attendee" | "optional";
};

export type CalendarItem = {
  readonly id: string;
  readonly type: CalendarItemType;
  readonly title: string;
  readonly description?: string;
  readonly start: string;
  readonly end: string;
  readonly timezone: string;
  readonly allDay: boolean;
  readonly location?: string;
  readonly owner: string;
  readonly household?: string | null;
  readonly participants: readonly CalendarParticipant[];
  readonly status: CalendarItemStatus;
  readonly priority: number;
  readonly origin: CalendarItemOrigin;
  readonly syncState: CalendarSyncState;
  readonly source: string;
  readonly editable: boolean;
  readonly recurrence?: CalendarRecurrence;
  readonly metadata: Readonly<Record<string, unknown>>;
};

export type Timeline = {
  readonly items: readonly CalendarItem[];
  readonly rangeStart: string;
  readonly rangeEnd: string;
  readonly timezone: string;
};

export type CalendarConflictKind =
  | "overlap"
  | "duplicate"
  | "impossible_slot"
  | "goal_during_appointment"
  | "sync_incompatible";

export type CalendarConflict = {
  readonly id: string;
  readonly kind: CalendarConflictKind;
  readonly itemIds: readonly string[];
  readonly message: string;
  readonly severity: "low" | "medium" | "high";
};

export type FreeSlot = {
  readonly id: string;
  readonly start: string;
  readonly end: string;
  readonly durationMinutes: number;
};

export type CalendarSourceInfo = {
  readonly id: string;
  readonly label: string;
  readonly available: boolean;
  readonly itemCount: number;
  readonly syncState: CalendarSyncState;
};

export type PlanningCalendarQuery = {
  readonly userId: string;
  readonly householdId?: string | null;
  readonly start: string;
  readonly end: string;
  readonly timezone?: string;
};

export type PlanningCalendarSnapshot = {
  readonly timeline: Timeline;
  readonly conflicts: readonly CalendarConflict[];
  readonly freeSlots: readonly FreeSlot[];
  readonly sources: readonly CalendarSourceInfo[];
  readonly generatedAt: string;
};
