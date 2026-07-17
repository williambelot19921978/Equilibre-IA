import { supabase } from "../lib/supabase/client";
import { getMonthBounds } from "../lib/navigation/urlDate";
import { overlapsLocalDay } from "../lib/time/dayBounds";
import { formatSupabaseError } from "../lib/supabase/formatError";

export async function loadCalendarMarkedDates({
  userId,
  householdId,
  year,
  month,
}: {
  userId: string;
  householdId: string;
  year: number;
  month: number;
}): Promise<string[]> {
  const { start, end } = getMonthBounds(year, month);

  const { data, error } = await supabase
    .from("calendar_items")
    .select("starts_at, ends_at")
    .eq("household_id", householdId)
    .eq("user_id", userId)
    .lte("starts_at", end)
    .gte("ends_at", start);

  if (error) {
    throw formatSupabaseError({
      table: "calendar_items",
      operation: "SELECT",
      error,
    });
  }

  const marked = new Set<string>();

  for (const item of data ?? []) {
    const startDate = item.starts_at.slice(0, 10);
    const endDate = item.ends_at.slice(0, 10);
    const cursor = new Date(`${startDate}T12:00:00`);

    while (cursor.toISOString().slice(0, 10) <= endDate) {
      const day = cursor.toISOString().slice(0, 10);

      if (
        overlapsLocalDay({
          date: day,
          startsAt: item.starts_at,
          endsAt: item.ends_at,
        })
      ) {
        marked.add(day);
      }

      cursor.setDate(cursor.getDate() + 1);
    }
  }

  return [...marked].sort();
}
