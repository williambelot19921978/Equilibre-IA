import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { generateWorkoutSession } from "../../src/ai/workoutGenerationEngine";
import { buildManualConstraintInsert } from "../../src/lib/calendar/manualConstraint";
import { getLocalDateFromIso } from "../../src/lib/time/localDateFromIso";
import type { WorkoutSession } from "../../src/types/workoutSession";

const E2E_TITLE_PREFIX = "E2E_";

export type E2eSportSession = {
  runId: string;
  calendarItemId: string;
  title: string;
  session: WorkoutSession;
  date: string;
};

function loadEnvLocal(): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const line of readFileSync(resolve(".env.local"), "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;
    vars[trimmed.slice(0, separatorIndex).trim()] = trimmed
      .slice(separatorIndex + 1)
      .trim();
  }
  return vars;
}

function buildSportWindow(): { startsAt: string; endsAt: string } {
  const nowMs = Date.now();
  const startsAt = new Date(nowMs - 2 * 60_000).toISOString();
  const endsAt = new Date(nowMs + 45 * 60_000).toISOString();

  if (new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
    throw new Error("Fenêtre sport E2E invalide : ends_at <= starts_at");
  }

  return { startsAt, endsAt };
}

async function createAuthenticatedClient(): Promise<{
  client: SupabaseClient;
  userId: string;
}> {
  const env = loadEnvLocal();
  const email = env.PLAYWRIGHT_TEST_EMAIL;
  const password = env.PLAYWRIGHT_TEST_PASSWORD;
  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!email || !password || !url || !key) {
    throw new Error("Variables Playwright/Supabase manquantes dans .env.local");
  }

  const client = createClient(url, key);
  const signIn = await client.auth.signInWithPassword({ email, password });
  if (signIn.error || !signIn.data.user) {
    throw new Error(`Connexion E2E impossible : ${signIn.error?.message ?? "user absent"}`);
  }

  return { client, userId: signIn.data.user.id };
}

export async function createE2eSportSession(
  runId = `${Date.now()}`,
): Promise<E2eSportSession> {
  const { client, userId } = await createAuthenticatedClient();
  const { startsAt, endsAt } = buildSportWindow();
  const date = getLocalDateFromIso(startsAt);

  const membership = await client
    .from("household_members")
    .select("household_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (membership.error || !membership.data?.household_id) {
    throw new Error(
      `Foyer introuvable pour le compte E2E : ${membership.error?.message ?? "absent"}`,
    );
  }

  const session = generateWorkoutSession({
    durationMinutes: 8,
    level: "beginner",
    type: "mobility",
    slotHour: new Date(startsAt).getHours(),
    generationSeed: `${E2E_TITLE_PREFIX}${runId}`,
  });

  session.id = `${E2E_TITLE_PREFIX}${runId}`;
  session.title = `${E2E_TITLE_PREFIX}${runId} Séance test`;

  const payload = buildManualConstraintInsert({
    householdId: membership.data.household_id,
    userId,
    title: session.title,
    constraintType: "sport",
    startsAt,
    endsAt,
    workoutSession: session,
    withSession: true,
    sportType: "mobility",
  });

  const insert = await client
    .from("calendar_items")
    .insert({
      ...payload,
      details: {
        ...payload.details,
        e2eRunId: runId,
      },
    })
    .select("id")
    .single();

  if (insert.error || !insert.data?.id) {
    throw new Error(
      `[calendar_items] INSERT — ${insert.error?.message ?? "id absent"} — payload sport E2E`,
    );
  }

  return {
    runId,
    calendarItemId: insert.data.id,
    title: session.title,
    session,
    date,
  };
}

export async function cleanupE2eSportSessions(): Promise<number> {
  const { client, userId } = await createAuthenticatedClient();
  const today = getLocalDateFromIso(new Date().toISOString());

  const allItems = await client
    .from("calendar_items")
    .select("id, title, details, starts_at")
    .eq("user_id", userId);

  if (allItems.error) {
    throw new Error(`Cleanup E2E sport impossible : ${allItems.error.message}`);
  }

  const completedSportTodayIds = (allItems.data ?? [])
    .filter((item) => {
      if (getLocalDateFromIso(item.starts_at) !== today) {
        return false;
      }

      const details = (item.details ?? {}) as Record<string, unknown>;
      const workoutSession = details.workoutSession as { status?: string } | undefined;
      const isSport =
        details.constraintType === "sport" ||
        details.businessType === "sport" ||
        Boolean(workoutSession);
      const isCompleted =
        details.status === "completed" ||
        typeof details.actual_completed_at === "string" ||
        workoutSession?.status === "completed";

      return isSport && isCompleted;
    })
    .map((item) => item.id);

  const e2eIds = (allItems.data ?? [])
    .filter((item) => item.title?.startsWith(E2E_TITLE_PREFIX))
    .map((item) => item.id);

  const ids = [...new Set([...e2eIds, ...completedSportTodayIds])];

  if (ids.length > 0) {
    const removedEvents = await client
      .from("task_activity_events")
      .delete()
      .in("calendar_item_id", ids);
    if (removedEvents.error && removedEvents.error.code !== "42501") {
      throw new Error(
        `Cleanup E2E sport events : ${removedEvents.error.message}`,
      );
    }

    const removed = await client.from("calendar_items").delete().in("id", ids);
    if (removed.error) {
      throw new Error(`Cleanup E2E sport DELETE : ${removed.error.message}`);
    }
  }

  const todayEvents = await client
    .from("task_activity_events")
    .select("id, metadata")
    .eq("user_id", userId)
    .gte("occurred_at", `${today}T00:00:00`);

  if (todayEvents.error) {
    throw new Error(
      `Cleanup E2E sport events SELECT : ${todayEvents.error.message}`,
    );
  }

  const workoutEventIds = (todayEvents.data ?? [])
    .filter((event) => {
      const metadata = event.metadata as Record<string, unknown> | null;
      return (
        metadata?.workoutCompleted === true ||
        metadata?.partialCompletion === true
      );
    })
    .map((event) => event.id);

  if (workoutEventIds.length > 0) {
    const removedWorkoutEvents = await client
      .from("task_activity_events")
      .delete()
      .in("id", workoutEventIds);
    if (removedWorkoutEvents.error && removedWorkoutEvents.error.code !== "42501") {
      throw new Error(
        `Cleanup E2E workout events DELETE : ${removedWorkoutEvents.error.message}`,
      );
    }
  }

  return ids.length;
}

export async function fetchE2eSportSession(calendarItemId: string): Promise<{
  id: string;
  title: string;
  details: Record<string, unknown> | null;
  starts_at: string;
  ends_at: string;
}> {
  const { client } = await createAuthenticatedClient();
  const result = await client
    .from("calendar_items")
    .select("id, title, details, starts_at, ends_at")
    .eq("id", calendarItemId)
    .single();

  if (result.error || !result.data) {
    throw new Error(
      `[calendar_items] SELECT — ${result.error?.message ?? "ligne absente"} — id=${calendarItemId}`,
    );
  }

  return result.data as {
    id: string;
    title: string;
    details: Record<string, unknown> | null;
    starts_at: string;
    ends_at: string;
  };
}
