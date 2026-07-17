import { supabase } from "../lib/supabase/client";
import { formatSupabaseError } from "../lib/supabase/formatError";
import type { SpiritualFavoriteRecord } from "../types/spiritual";
import { getCurrentHouseholdId } from "./householdService";

const TABLE = "spiritual_favorites";

const SELECT = `
  id,
  user_id,
  household_id,
  content_id,
  content_type,
  custom_text,
  created_at
`;

export async function loadSpiritualFavorites(
  userId: string,
): Promise<SpiritualFavoriteRecord[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT)
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

    throw formatSupabaseError({ table: TABLE, operation: "SELECT", error });
  }

  return (data ?? []) as SpiritualFavoriteRecord[];
}

export async function addSpiritualFavorite({
  userId,
  contentId,
  contentType,
  customText,
}: {
  userId: string;
  contentId: string;
  contentType: string;
  customText?: string;
}): Promise<SpiritualFavoriteRecord> {
  const householdId = await getCurrentHouseholdId(userId);

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      user_id: userId,
      household_id: householdId,
      content_id: contentId,
      content_type: contentType,
      custom_text: customText ?? null,
    })
    .select(SELECT)
    .single();

  if (error) {
    throw formatSupabaseError({ table: TABLE, operation: "INSERT", error });
  }

  return data as SpiritualFavoriteRecord;
}

export async function removeSpiritualFavorite({
  userId,
  favoriteId,
}: {
  userId: string;
  favoriteId: string;
}): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq("id", favoriteId)
    .eq("user_id", userId);

  if (error) {
    throw formatSupabaseError({ table: TABLE, operation: "DELETE", error });
  }
}

export async function isSpiritualFavorite({
  userId,
  contentId,
}: {
  userId: string;
  contentId: string;
}): Promise<boolean> {
  const favorites = await loadSpiritualFavorites(userId);
  return favorites.some((item) => item.content_id === contentId);
}
