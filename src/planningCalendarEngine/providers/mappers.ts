/**
 * EPIC 5A — Map legacy records to CalendarItem.
 */

import { isCancelledCalendarItem } from "../../lib/planning/isCancelledCalendarItem";
import type { CalendarItemRecord } from "../../types/database";
import type { TaskRecord } from "../../types/database";
import type { UserGoal } from "../../types/goal";
import type { CalendarItem, CalendarItemType } from "../types/calendarItem";

const DEFAULT_TIMEZONE = "America/Montreal";

function mapItemType(itemType: string): CalendarItemType {
  if (itemType.includes("task")) return "task";
  if (itemType.includes("appointment") || itemType.includes("rdv")) return "appointment";
  if (itemType.includes("goal")) return "goal";
  if (itemType.includes("reminder")) return "reminder";
  if (itemType.includes("constraint") || itemType.includes("margin")) return "constraint";
  return "event";
}

export function calendarRecordToItem(
  record: CalendarItemRecord,
  timezone = DEFAULT_TIMEZONE,
): CalendarItem {
  const origin =
    record.source.includes("google")
      ? "google"
      : record.source.includes("manual")
        ? "manual"
        : record.source.includes("engine")
          ? "engine"
          : "internal";

  return {
    id: record.id,
    type: mapItemType(record.item_type),
    title: record.title,
    description: record.details?.explanation ?? undefined,
    start: record.starts_at,
    end: record.ends_at,
    timezone,
    allDay: false,
    owner: record.user_id,
    household: record.household_id,
    participants: [],
    status: isCancelledCalendarItem(record)
      ? "cancelled"
      : record.details?.status === "completed"
        ? "completed"
        : "confirmed",
    priority: 3,
    origin,
    syncState: origin === "google" ? "external" : "local",
    source: record.source,
    editable: !record.locked,
    metadata: {
      taskId: record.task_id,
      itemType: record.item_type,
      locked: record.locked,
    },
  };
}

export function taskToCalendarItem(
  task: TaskRecord,
  timezone = DEFAULT_TIMEZONE,
): CalendarItem | null {
  if (!task.due_at || task.status === "cancelled") return null;

  const start = task.due_at;
  const endDate = new Date(start);
  endDate.setMinutes(endDate.getMinutes() + (task.estimated_minutes ?? 30));

  return {
    id: `task-${task.id}`,
    type: "task",
    title: task.title,
    description: task.description ?? undefined,
    start,
    end: endDate.toISOString(),
    timezone,
    allDay: false,
    owner: task.assigned_to ?? task.created_by,
    household: task.household_id,
    participants: [],
    status: task.status === "done" ? "completed" : "confirmed",
    priority: task.priority,
    origin: "task",
    syncState: "local",
    source: "tasks",
    editable: true,
    metadata: {
      taskId: task.id,
      category: task.category,
      splittable: task.splittable,
    },
  };
}

export function goalToCalendarItem(
  goal: UserGoal,
  userId: string,
  timezone = DEFAULT_TIMEZONE,
): CalendarItem | null {
  if (!goal.targetDate) return null;

  const nextStep = goal.steps[0];
  const start = `${goal.targetDate}T09:00:00.000Z`;
  const end = `${goal.targetDate}T10:00:00.000Z`;

  return {
    id: `goal-${goal.id}`,
    type: "goal",
    title: goal.name,
    description: nextStep?.title,
    start,
    end,
    timezone,
    allDay: false,
    owner: userId,
    household: null,
    participants: [],
    status: "confirmed",
    priority: goal.importance === "high" ? 5 : 3,
    origin: "goal",
    syncState: "local",
    source: "goals",
    editable: false,
    metadata: {
      goalId: goal.id,
      stepId: nextStep?.id,
    },
  };
}
