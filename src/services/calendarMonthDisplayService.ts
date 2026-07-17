import { datesInMonth, getMonthBounds } from "../lib/navigation/urlDate";
import {
  buildMonthDisplayEvents,
} from "../lib/planning/buildMonthDisplayEvents";
import type { MonthDisplayEvent } from "../lib/planning/monthEventLayout";
import { buildMonthOverview } from "../lib/planning/calendarMonthOverview";
import type { MonthOverviewData } from "../lib/planning/calendarMonthOverview";
import { supabase } from "../lib/supabase/client";
import type { CalendarItemRecord } from "../types";
import type { FamilyContextPeriodRecord } from "../types/familyContext";
import type { ExternalCalendarEventRecord } from "../types/googleCalendar";
import { PlanningGenerationError } from "../types/planningGenerationError";
import { loadExternalEventsForMonth } from "./googleCalendarService";

export type MonthDisplayData = {
  overview: MonthOverviewData;
  displayEvents: MonthDisplayEvent[];
};

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

export async function loadMonthDisplayData({
  userId,
  householdId,
  year,
  month,
  periods,
  workDays = [],
}: {
  userId: string;
  householdId: string;
  year: number;
  month: number;
  periods: FamilyContextPeriodRecord[];
  workDays?: string[];
}): Promise<MonthDisplayData> {
  const { start, end } = getMonthBounds(year, month);
  const dates = datesInMonth(year, month);

  const [itemsResult, externalEvents] = await Promise.all([
    supabase
      .from("calendar_items")
      .select(CALENDAR_SELECT)
      .eq("household_id", householdId)
      .eq("user_id", userId)
      .lte("starts_at", end)
      .gte("ends_at", start)
      .order("starts_at", { ascending: true }),
    loadExternalEventsForMonth({ userId, householdId, year, month }).catch(
      () => [] as ExternalCalendarEventRecord[],
    ),
  ]);

  if (itemsResult.error) {
    throw PlanningGenerationError.fromSupabase({
      table: "calendar_items",
      operation: "SELECT",
      error: itemsResult.error,
      step: "load",
    });
  }

  const items = (itemsResult.data ?? []) as CalendarItemRecord[];

  const displayEvents = buildMonthDisplayEvents({
    dates,
    calendarItems: items,
    periods,
    externalEvents,
    workDays,
  });

  const overview = buildMonthOverview({
    dates,
    items,
    periods,
    externalPreview: displayEvents,
  });

  return { overview, displayEvents };
}
