import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const E2E_EXPRESSION = "je suis sec";
const FATIGUE_DAY_CONTEXT_TITLE = "Journée allégée — fatigue";

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

async function createAuthenticatedClient() {
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

function isMissingTableError(message: string): boolean {
  return (
    message.includes("does not exist") ||
    message.includes("Could not find the table") ||
    message.includes("schema cache")
  );
}

export async function isPersonalLanguageTableAvailable(): Promise<boolean> {
  try {
    const { client } = await createAuthenticatedClient();
    const { error } = await client
      .from("user_language_expressions")
      .select("id")
      .limit(0);

    if (error && isMissingTableError(error.message)) {
      return false;
    }
    if (error) {
      throw new Error(`Probe table expression E2E impossible : ${error.message}`);
    }
    return true;
  } catch {
    return false;
  }
}

export async function cleanupE2ePersonalLanguageExpression(
  normalizedExpression = E2E_EXPRESSION,
): Promise<void> {
  const { client, userId } = await createAuthenticatedClient();

  const { error } = await client
    .from("user_language_expressions")
    .delete()
    .eq("user_id", userId)
    .eq("normalized_expression", normalizedExpression);

  if (error && !isMissingTableError(error.message)) {
    throw new Error(`Nettoyage expression E2E impossible : ${error.message}`);
  }
}

export async function loadE2ePersonalLanguageExpression(
  normalizedExpression = E2E_EXPRESSION,
): Promise<{ confidence: number; confirmationCount: number } | null> {
  const { client, userId } = await createAuthenticatedClient();

  const { data, error } = await client
    .from("user_language_expressions")
    .select("confidence, confirmation_count")
    .eq("user_id", userId)
    .eq("normalized_expression", normalizedExpression)
    .maybeSingle();

  if (error && !isMissingTableError(error.message)) {
    throw new Error(`Lecture expression E2E impossible : ${error.message}`);
  }

  if (!data) return null;
  return {
    confidence: Number(data.confidence),
    confirmationCount: Number(data.confirmation_count),
  };
}

export async function cleanupE2eFatigueDayPeriods(
  dates?: string[],
): Promise<void> {
  const { client, userId } = await createAuthenticatedClient();

  const { data: membership, error: membershipError } = await client
    .from("household_members")
    .select("household_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (membershipError) {
    throw new Error(`Lecture household E2E impossible : ${membershipError.message}`);
  }

  if (!membership?.household_id) {
    return;
  }

  const targetDates = dates ?? [new Date().toISOString().slice(0, 10)];

  for (const date of targetDates) {
    const { error } = await client
      .from("family_context_periods")
      .delete()
      .eq("household_id", membership.household_id)
      .eq("title", FATIGUE_DAY_CONTEXT_TITLE)
      .gte("starts_at", `${date}T00:00:00.000Z`)
      .lte("ends_at", `${date}T23:59:59.999Z`);

    if (error && !isMissingTableError(error.message)) {
      throw new Error(`Nettoyage période fatigue E2E impossible : ${error.message}`);
    }
  }
}

export async function cleanupE2ePersonalLanguageArtifacts(
  normalizedExpression = E2E_EXPRESSION,
  dates?: string[],
): Promise<void> {
  await cleanupE2ePersonalLanguageExpression(normalizedExpression);
  await cleanupE2eFatigueDayPeriods(dates);
}

export { E2E_EXPRESSION };
