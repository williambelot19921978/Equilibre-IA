import { supabase } from "../lib/supabase/client";
import { formatSupabaseError } from "../lib/supabase/formatError";
import type { TaskRecord, TaskStatus } from "../types";
import { getCurrentHouseholdId } from "./householdService";

export type { TaskRecord, TaskStatus } from "../types";

const TABLE = "tasks";

const TASK_SELECT = `
  id,
  household_id,
  assigned_to,
  created_by,
  title,
  description,
  category,
  estimated_minutes,
  due_at,
  priority,
  splittable,
  status,
  skip_count,
  created_at
`;

export async function getUserTasks(userId: string): Promise<TaskRecord[]> {
  const householdId = await getCurrentHouseholdId(userId);

  const { data, error } = await supabase
    .from(TABLE)
    .select(TASK_SELECT)
    .eq("household_id", householdId)
    .neq("status", "cancelled")
    .order("status", { ascending: true })
    .order("priority", { ascending: false })
    .order("due_at", { ascending: true, nullsFirst: false });

  if (error) {
    throw formatSupabaseError({ table: TABLE, operation: "SELECT", error });
  }

  return data ?? [];
}

export async function createTask({
  userId,
  title,
  description,
  category,
  estimatedMinutes,
  dueAt,
  priority,
  splittable,
}: {
  userId: string;
  title: string;
  description?: string;
  category: string;
  estimatedMinutes: number;
  dueAt?: string;
  priority: number;
  splittable: boolean;
}): Promise<TaskRecord> {
  const householdId = await getCurrentHouseholdId(userId);

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      household_id: householdId,
      assigned_to: userId,
      created_by: userId,
      title: title.trim(),
      description: description?.trim() || null,
      category,
      estimated_minutes: estimatedMinutes,
      due_at: dueAt ? new Date(dueAt).toISOString() : null,
      priority,
      splittable,
      status: "todo",
    })
    .select(TASK_SELECT)
    .single();

  if (error) {
    throw formatSupabaseError({ table: TABLE, operation: "INSERT", error });
  }

  return data;
}

export async function updateTaskStatus({
  taskId,
  status,
}: {
  taskId: string;
  status: TaskStatus;
}) {
  const { error } = await supabase
    .from(TABLE)
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId);

  if (error) {
    throw formatSupabaseError({ table: TABLE, operation: "UPDATE", error });
  }
}

export async function incrementTaskSkipCount(
  task: TaskRecord,
): Promise<TaskRecord> {
  const nextSkipCount = (task.skip_count ?? 0) + 1;

  const { data, error } = await supabase
    .from(TABLE)
    .update({
      status: "skipped",
      skip_count: nextSkipCount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", task.id)
    .select(TASK_SELECT)
    .single();

  if (error) {
    throw formatSupabaseError({ table: TABLE, operation: "UPDATE", error });
  }

  return data;
}

export async function getTasksForPlanning(
  userId: string,
): Promise<TaskRecord[]> {
  const householdId = await getCurrentHouseholdId(userId);

  const { data, error } = await supabase
    .from(TABLE)
    .select(TASK_SELECT)
    .eq("household_id", householdId)
    .in("status", ["todo", "skipped", "planned"])
    .order("priority", { ascending: false })
    .order("due_at", { ascending: true, nullsFirst: false });

  if (error) {
    throw formatSupabaseError({ table: TABLE, operation: "SELECT", error });
  }

  return data ?? [];
}

export async function markTasksAsPlanned(taskIds: string[]): Promise<void> {
  if (taskIds.length === 0) {
    return;
  }

  const { error } = await supabase
    .from(TABLE)
    .update({
      status: "planned",
      updated_at: new Date().toISOString(),
    })
    .in("id", taskIds);

  if (error) {
    throw formatSupabaseError({ table: TABLE, operation: "UPDATE", error });
  }
}

export async function getImportantRemainingTasks(
  userId: string,
): Promise<TaskRecord[]> {
  const tasks = await getTasksForPlanning(userId);

  return tasks.filter(
    (task) =>
      task.priority >= 4 &&
      (task.status === "todo" || task.status === "skipped"),
  );
}
