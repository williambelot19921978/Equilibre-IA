import { supabase } from "../lib/supabase/client";
import type { ProfileFactInsert, ProfileRecord } from "../types";
import { getCurrentHouseholdId } from "./householdService";

export async function getUserProfile(
  userId: string,
): Promise<ProfileRecord | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, onboarding_completed, created_at, updated_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function completeOnboarding(userId: string): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    throw error;
  }
}

export async function saveBaseProfileFacts({
  userId,
  partnerName,
  workStart,
  workEnd,
  wakeTime,
  bedTime,
  mainPriority,
}: {
  userId: string;
  partnerName: string;
  workStart: string;
  workEnd: string;
  wakeTime: string;
  bedTime: string;
  mainPriority: string;
}): Promise<void> {
  const householdId = await getCurrentHouseholdId(userId);

  const facts: ProfileFactInsert[] = [
    {
      household_id: householdId,
      user_id: userId,
      fact_key: "partner_name",
      fact_value: { value: partnerName.trim() || null },
    },
    {
      household_id: householdId,
      user_id: userId,
      fact_key: "work_schedule",
      fact_value: {
        start: workStart || null,
        end: workEnd || null,
      },
    },
    {
      household_id: householdId,
      user_id: userId,
      fact_key: "sleep_schedule",
      fact_value: {
        wake_time: wakeTime || null,
        bed_time: bedTime || null,
      },
    },
    {
      household_id: householdId,
      user_id: userId,
      fact_key: "main_priority",
      fact_value: { value: mainPriority || null },
    },
  ];

  const { error } = await supabase.from("profile_facts").upsert(facts, {
    onConflict: "user_id,fact_key",
  });

  if (error) {
    throw error;
  }
}
