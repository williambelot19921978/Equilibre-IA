import { supabase } from "../lib/supabase/client";
import type { ChildRecord } from "../types";

const CHILD_SELECT = "id, household_id, first_name, birth_date, created_at";

export async function getChildrenByHousehold(
  householdId: string,
): Promise<ChildRecord[]> {
  const { data, error } = await supabase
    .from("children")
    .select(CHILD_SELECT)
    .eq("household_id", householdId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function addChild({
  householdId,
  firstName,
  birthDate,
}: {
  householdId: string;
  firstName: string;
  birthDate: string | null;
}): Promise<ChildRecord> {
  const { data, error } = await supabase
    .from("children")
    .insert({
      household_id: householdId,
      first_name: firstName,
      birth_date: birthDate,
    })
    .select(CHILD_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return data;
}
