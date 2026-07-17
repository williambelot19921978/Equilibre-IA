import { supabase } from "../lib/supabase/client";
import type { HouseholdMemberRecord } from "../types";

export async function getHouseholdMembership(
  userId: string,
): Promise<HouseholdMemberRecord | null> {
  const { data, error } = await supabase
    .from("household_members")
    .select("household_id, user_id, display_name, role")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function getCurrentHouseholdId(
  userId: string,
): Promise<string> {
  const membership = await getHouseholdMembership(userId);

  if (!membership) {
    throw new Error("Aucun foyer n’a été trouvé pour cet utilisateur.");
  }

  return membership.household_id;
}

export async function getHouseholdMembers(
  householdId: string,
): Promise<HouseholdMemberRecord[]> {
  const { data, error } = await supabase
    .from("household_members")
    .select("household_id, user_id, display_name, role")
    .eq("household_id", householdId)
    .order("display_name", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function createHouseholdForCurrentUser({
  householdName,
  displayName,
}: {
  householdName: string;
  displayName: string;
}): Promise<void> {
  const { error } = await supabase.rpc("create_household_for_current_user", {
    household_name: householdName,
    display_name: displayName,
  });

  if (error) {
    throw error;
  }
}
