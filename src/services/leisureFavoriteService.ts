import { supabase } from "../lib/supabase/client";
import { formatSupabaseError } from "../lib/supabase/formatError";
import type { LeisureCategory, LeisureFavoriteRecord } from "../types/leisure";

export async function loadLeisureFavorites(
  userId: string,
): Promise<LeisureFavoriteRecord[]> {
  const { data, error } = await supabase
    .from("leisure_favorites")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    if (
      error.message.includes("does not exist") ||
      error.code === "42P01" ||
      error.code === "PGRST205"
    ) {
      return [];
    }

    throw formatSupabaseError({
      table: "leisure_favorites",
      operation: "SELECT",
      error,
    });
  }

  return (data ?? []) as LeisureFavoriteRecord[];
}

export async function addLeisureFavorite({
  userId,
  householdId,
  activityId,
  category,
  customLabel,
}: {
  userId: string;
  householdId: string;
  activityId: string;
  category: LeisureCategory;
  customLabel?: string | null;
}): Promise<LeisureFavoriteRecord> {
  const { data, error } = await supabase
    .from("leisure_favorites")
    .insert({
      user_id: userId,
      household_id: householdId,
      activity_id: activityId,
      category,
      custom_label: customLabel ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throw formatSupabaseError({
      table: "leisure_favorites",
      operation: "INSERT",
      error,
    });
  }

  return data as LeisureFavoriteRecord;
}

export async function removeLeisureFavorite(favoriteId: string): Promise<void> {
  const { error } = await supabase
    .from("leisure_favorites")
    .delete()
    .eq("id", favoriteId);

  if (error) {
    throw formatSupabaseError({
      table: "leisure_favorites",
      operation: "DELETE",
      error,
    });
  }
}
