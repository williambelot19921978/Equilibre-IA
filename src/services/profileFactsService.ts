import { supabase } from "../lib/supabase/client";
import { formatSupabaseError } from "../lib/supabase/formatError";
import type { ProfileFactRecord } from "../types";
import { getCurrentHouseholdId } from "./householdService";

export type { ProfileFactRecord } from "../types";

export { getCurrentHouseholdId } from "./householdService";

const TABLE = "profile_facts";

export async function getProfileFacts(
  userId: string,
): Promise<ProfileFactRecord[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("fact_key, fact_value")
    .eq("user_id", userId);

  if (error) {
    throw formatSupabaseError({ table: TABLE, operation: "SELECT", error });
  }

  return data ?? [];
}

export async function saveProfileFact({
  householdId,
  userId,
  factKey,
  value,
}: {
  householdId: string;
  userId: string;
  factKey: string;
  value: string | number | string[];
}) {
  const { error } = await supabase.from("profile_facts").upsert(
    {
      household_id: householdId,
      user_id: userId,
      fact_key: factKey,
      fact_value: {
        value,
      },
      source: "progressive_discovery",
      confidence: 1,
      last_asked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id,fact_key",
    },
  );

  if (error) {
    throw formatSupabaseError({ table: TABLE, operation: "UPSERT", error });
  }
}

export async function upsertProfileFacts({
  userId,
  facts,
  source = "daily_routine",
}: {
  userId: string;
  facts: Array<{
    fact_key: string;
    fact_value: ProfileFactRecord["fact_value"];
  }>;
  source?: string;
}) {
  const householdId = await getCurrentHouseholdId(userId);
  const timestamp = new Date().toISOString();

  const rows = facts.map((fact) => ({
    household_id: householdId,
    user_id: userId,
    fact_key: fact.fact_key,
    fact_value: fact.fact_value,
    source,
    confidence: 1,
    updated_at: timestamp,
  }));

  const { error } = await supabase.from("profile_facts").upsert(rows, {
    onConflict: "user_id,fact_key",
  });

  if (error) {
    throw formatSupabaseError({ table: TABLE, operation: "UPSERT", error });
  }
}
