/**
 * QA-2 — Supabase client helpers for Guardian data provisioning.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { discoveryQuestions } from "../../../src/config/discoveryQuestions";
import {
  buildFactsValueMap,
  filterAvailableQuestions,
} from "../../../src/lib/discovery/questionFilters";
import type { DiscoveryQuestion } from "../../../src/config/discoveryQuestions";

export type GuardianSupabaseConfig = {
  url: string;
  publishableKey: string;
  serviceRoleKey: string;
};

function parseEnvFile(filePath: string): Record<string, string> {
  const vars: Record<string, string> = {};
  if (!existsSync(filePath)) return vars;

  for (const line of readFileSync(filePath, "utf8").split("\n")) {
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

export function loadGuardianSupabaseConfig(): GuardianSupabaseConfig {
  const root = process.cwd();
  const merged = {
    ...parseEnvFile(path.join(root, ".env")),
    ...parseEnvFile(path.join(root, ".env.local")),
    ...parseEnvFile(path.join(root, ".env.guardian")),
    ...parseEnvFile(path.join(root, ".env.guardian.local")),
  };

  return {
    url: merged.VITE_SUPABASE_URL ?? "",
    publishableKey: merged.VITE_SUPABASE_PUBLISHABLE_KEY ?? "",
    serviceRoleKey:
      merged.GUARDIAN_SUPABASE_SERVICE_ROLE_KEY ??
      merged.SUPABASE_SERVICE_ROLE_KEY ??
      "",
  };
}

export function createGuardianAnonClient(): SupabaseClient {
  const config = loadGuardianSupabaseConfig();
  if (!config.url || !config.publishableKey) {
    throw new Error("Configuration Supabase incomplète pour Guardian.");
  }

  return createClient(config.url, config.publishableKey);
}

export function createGuardianAdminClient(): SupabaseClient | null {
  const config = loadGuardianSupabaseConfig();
  if (!config.url || !config.serviceRoleKey) return null;

  return createClient(config.url, config.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function signInGuardianUser(
  email: string,
  password: string,
): Promise<{ client: SupabaseClient; userId: string }> {
  const client = createGuardianAnonClient();
  const signIn = await client.auth.signInWithPassword({ email, password });

  if (signIn.error || !signIn.data.user) {
    throw new Error(
      `Connexion Guardian impossible : ${signIn.error?.message ?? "user absent"}`,
    );
  }

  return { client, userId: signIn.data.user.id };
}

export async function getHouseholdIdForUser(
  client: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data, error } = await client
    .from("household_members")
    .select("household_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data?.household_id ?? null;
}

export async function ensureAuthUser(
  admin: SupabaseClient,
  {
    email,
    password,
    firstName,
  }: { email: string; password: string; firstName: string },
): Promise<{ userId: string; created: boolean }> {
  const list = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const existing = list.data.users.find(
    (user) => user.email?.toLowerCase() === email.toLowerCase(),
  );

  if (existing) {
    return { userId: existing.id, created: false };
  }

  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { first_name: firstName },
  });

  if (created.error || !created.data.user) {
    throw new Error(
      `Création utilisateur impossible : ${created.error?.message ?? "user absent"}`,
    );
  }

  return { userId: created.data.user.id, created: true };
}

export async function joinHouseholdMember(
  admin: SupabaseClient,
  {
    householdId,
    userId,
    displayName,
    role = "member",
  }: {
    householdId: string;
    userId: string;
    displayName: string;
    role?: string;
  },
): Promise<{ joined: boolean }> {
  const existing = await admin
    .from("household_members")
    .select("household_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing.error) throw existing.error;

  if (existing.data?.household_id === householdId) {
    return { joined: false };
  }

  if (existing.data?.household_id) {
    await admin.from("household_members").delete().eq("user_id", userId);
  }

  const insert = await admin.from("household_members").insert({
    household_id: householdId,
    user_id: userId,
    display_name: displayName,
    role,
  });

  if (insert.error) throw insert.error;
  return { joined: true };
}

export async function createHouseholdViaRpc(
  client: SupabaseClient,
  {
    householdName,
    displayName,
  }: { householdName: string; displayName: string },
): Promise<void> {
  const { error } = await client.rpc("create_household_for_current_user", {
    household_name: householdName,
    display_name: displayName,
  });

  if (error) throw error;
}

export async function deleteAuthUser(
  admin: SupabaseClient,
  userId: string,
): Promise<void> {
  await admin.from("household_members").delete().eq("user_id", userId);
  await admin.auth.admin.deleteUser(userId);
}

export async function authUserExistsByEmail(
  admin: SupabaseClient,
  email: string,
): Promise<boolean> {
  const list = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  return list.data.users.some(
    (user) => user.email?.toLowerCase() === email.toLowerCase(),
  );
}

/**
 * Supprime les comptes jetables Guardian des runs précédents (idempotent).
 */
export async function cleanupGuardianDynamicUsers(
  admin: SupabaseClient,
  options?: { preserveEmails?: string[] },
): Promise<string[]> {
  const preserve = new Set(
    (options?.preserveEmails ?? [])
      .map((email) => email.toLowerCase())
      .filter(Boolean),
  );

  const deleted: string[] = [];
  let page = 1;

  while (true) {
    const list = await admin.auth.admin.listUsers({ page, perPage: 200 });
    const users = list.data.users;

    for (const user of users) {
      const email = user.email?.toLowerCase() ?? "";
      if (!email.endsWith("@guardian.equilibre.test")) continue;
      if (preserve.has(email)) continue;

      await deleteAuthUser(admin, user.id);
      deleted.push(user.email ?? user.id);
    }

    if (users.length < 200) break;
    page += 1;
  }

  return deleted;
}

function defaultDiscoveryValue(question: DiscoveryQuestion): string | number | string[] {
  if (question.type === "multi-select") {
    return [question.options?.[0]?.value ?? "guardian"];
  }

  if (question.type === "number") {
    return 30;
  }

  if (question.type === "time") {
    return "08:00";
  }

  if (question.options?.length) {
    return question.options[0].value;
  }

  return "Guardian";
}

/**
 * Accélère la fin d'onboarding via API (infrastructure E2E — pas de modification moteur).
 */
export async function finalizeGuardianOnboardingForUser(
  email: string,
  password: string,
): Promise<void> {
  const { client, userId } = await signInGuardianUser(email, password);
  const householdId = await getHouseholdIdForUser(client, userId);

  if (!householdId) {
    throw new Error(`Foyer introuvable pour finaliser l'onboarding : ${email}`);
  }

  let factsMap = buildFactsValueMap(
    (
      await client.from("profile_facts").select("fact_key, fact_value").eq("user_id", userId)
    ).data ?? [],
  );
  let remaining = filterAvailableQuestions(discoveryQuestions, factsMap);
  const timestamp = new Date().toISOString();

  while (remaining.length > 0) {
    for (const question of remaining) {
      const value = defaultDiscoveryValue(question);

      const { error } = await client.from("profile_facts").upsert(
        {
          household_id: householdId,
          user_id: userId,
          fact_key: question.key,
          fact_value: { value },
          source: "progressive_discovery",
          confidence: 1,
          last_asked_at: timestamp,
          updated_at: timestamp,
        },
        { onConflict: "user_id,fact_key" },
      );

      if (error) {
        throw new Error(
          `Impossible de seed la discovery (${question.key}) : ${error.message}`,
        );
      }

      factsMap.set(question.key, value);
    }

    remaining = filterAvailableQuestions(discoveryQuestions, factsMap);
  }

  const profileUpdate = await client
    .from("profiles")
    .update({
      onboarding_completed: true,
      updated_at: timestamp,
    })
    .eq("id", userId);

  if (profileUpdate.error) {
    throw new Error(
      `Impossible de finaliser l'onboarding : ${profileUpdate.error.message}`,
    );
  }

  await client.auth.signOut();
}
