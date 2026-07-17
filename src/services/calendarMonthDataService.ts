import { supabase } from "../lib/supabase/client";
import { datesInMonth, getMonthBounds } from "../lib/navigation/urlDate";
import { buildMonthOverview } from "../lib/planning/calendarMonthOverview";
import type { MonthOverviewData } from "../lib/planning/calendarMonthOverview";
import type { CalendarItemRecord } from "../types";
import type { FamilyContextPeriodRecord } from "../types/familyContext";
import { PlanningGenerationError } from "../types/planningGenerationError";

export type {
  MonthDayData,
  MonthDayPreviewItem,
  MonthOverviewData,
} from "../lib/planning/calendarMonthOverview";

export { buildMonthOverview } from "../lib/planning/calendarMonthOverview";

const CALENDAR_SELECT = `
  id,
  household_id,
  user_id,
  task_id,
  title,
  item_type,
  starts_at,
  ends_at,
  locked,
  source,
  details,
  created_at,
  updated_at
`;

export async function loadMonthOverview({
  userId,
  householdId,
  year,
  month,
  periods,
}: {
  userId: string;
  householdId: string;
  year: number;
  month: number;
  periods: FamilyContextPeriodRecord[];
}): Promise<MonthOverviewData> {
  const { start, end } = getMonthBounds(year, month);

  const { data, error } = await supabase
    .from("calendar_items")
    .select(CALENDAR_SELECT)
    .eq("household_id", householdId)
    .eq("user_id", userId)
    .lte("starts_at", end)
    .gte("ends_at", start)
    .order("starts_at", { ascending: true });

  if (error) {
    throw PlanningGenerationError.fromSupabase({
      table: "calendar_items",
      operation: "SELECT",
      error,
      step: "load",
    });
  }

  const dates = datesInMonth(year, month);

  return buildMonthOverview({
    dates,
    items: (data ?? []) as CalendarItemRecord[],
    periods,
  });
}
