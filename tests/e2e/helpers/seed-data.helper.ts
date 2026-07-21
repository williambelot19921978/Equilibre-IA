/**
 * QA-2 — Deterministic seed data for Guardian scenarios.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

const GUARDIAN_PREFIX = "GUARDIAN_QA";

export function getGuardianPrefix(): string {
  return GUARDIAN_PREFIX;
}

export function getGuardianRunId(): string {
  return process.env.GUARDIAN_RUN_ID ?? `${Date.now()}`;
}

export function todayLocalDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function seedGuardianTasks(
  client: SupabaseClient,
  {
    householdId,
    userId,
    runId = getGuardianRunId(),
    titlePrefix = `${GUARDIAN_PREFIX} tâche`,
  }: {
    householdId: string;
    userId: string;
    runId?: string;
    titlePrefix?: string;
  },
): Promise<string[]> {
  const titles = [
    `${titlePrefix} prioritaire ${runId}`,
    `${titlePrefix} secondaire ${runId}`,
    `${titlePrefix} charge ${runId}`,
  ];

  const dueAt = new Date();
  dueAt.setHours(18, 0, 0, 0);

  const insertedIds: string[] = [];

  for (const [index, title] of titles.entries()) {
    const { data, error } = await client
      .from("tasks")
      .insert({
        household_id: householdId,
        assigned_to: userId,
        created_by: userId,
        title,
        category: "other",
        estimated_minutes: 30 + index * 15,
        due_at: dueAt.toISOString(),
        priority: 3 - index,
        splittable: true,
        status: "todo",
      })
      .select("id")
      .single();

    if (error) throw error;
    insertedIds.push(data.id);
  }

  return insertedIds;
}

export async function seedGuardianBusyCalendar(
  client: SupabaseClient,
  {
    householdId,
    userId,
    date = todayLocalDate(),
    runId = getGuardianRunId(),
  }: {
    householdId: string;
    userId: string;
    date?: string;
    runId?: string;
  },
): Promise<void> {
  const base = new Date(`${date}T08:00:00`);
  const blocks = [
    { offsetMin: 0, durationMin: 120, title: `${GUARDIAN_PREFIX} bloc matin ${runId}` },
    { offsetMin: 150, durationMin: 90, title: `${GUARDIAN_PREFIX} bloc midi ${runId}` },
    { offsetMin: 240, durationMin: 60, title: `${GUARDIAN_PREFIX} bloc midi-aprem ${runId}` },
    { offsetMin: 300, durationMin: 120, title: `${GUARDIAN_PREFIX} bloc aprem ${runId}` },
    { offsetMin: 360, durationMin: 90, title: `${GUARDIAN_PREFIX} bloc aprem-2 ${runId}` },
    { offsetMin: 420, durationMin: 60, title: `${GUARDIAN_PREFIX} bloc aprem-3 ${runId}` },
    { offsetMin: 480, durationMin: 60, title: `${GUARDIAN_PREFIX} bloc fin aprem ${runId}` },
  ];

  for (const block of blocks) {
    const startsAt = new Date(base.getTime() + block.offsetMin * 60_000);
    const endsAt = new Date(startsAt.getTime() + block.durationMin * 60_000);

    const { error } = await client.from("calendar_items").insert({
      household_id: householdId,
      user_id: userId,
      title: block.title,
      item_type: "constraint",
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      source: "manual",
      locked: false,
      details: { constraintType: "other", status: "accepted" },
    });

    if (error) throw error;
  }
}

export async function cleanupGuardianTasks(
  client: SupabaseClient,
  householdId: string,
  runId = getGuardianRunId(),
): Promise<void> {
  await client
    .from("tasks")
    .delete()
    .eq("household_id", householdId)
    .ilike("title", `%${GUARDIAN_PREFIX}%`);

  await client
    .from("calendar_items")
    .delete()
    .eq("household_id", householdId)
    .ilike("title", `%${GUARDIAN_PREFIX}%`);
}

export function guardianTaskTitle(runId = getGuardianRunId()): string {
  return `${GUARDIAN_PREFIX} tâche prioritaire ${runId}`;
}

export function guardianTaskTitleHouseholdB(runId = getGuardianRunId()): string {
  return `${GUARDIAN_PREFIX} tâche foyer B prioritaire ${runId}`;
}

export function guardianGoalName(runId = getGuardianRunId()): string {
  return `${GUARDIAN_PREFIX} objectif ${runId}`;
}
