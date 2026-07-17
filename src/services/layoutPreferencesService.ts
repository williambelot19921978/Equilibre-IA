import { supabase } from "../lib/supabase/client";
import { formatSupabaseError } from "../lib/supabase/formatError";
import {
  DEFAULT_LAYOUT_PREFERENCES,
  type LayoutPreferences,
} from "../types/layoutPreferences";
import type { EveningPlanningMode } from "../types/eveningPlanning";
import { getCurrentHouseholdId } from "./householdService";

const TABLE = "user_home_preferences";

const VALID_EVENING_MODES = new Set<EveningPlanningMode>([
  "automatic",
  "suggestions_only",
  "disabled",
]);

function normalizeLayout(raw: {
  sidebar_collapsed?: boolean;
  show_saint_calendar?: boolean;
  evening_planning_mode?: string;
}): LayoutPreferences {
  const mode = VALID_EVENING_MODES.has(
    raw.evening_planning_mode as EveningPlanningMode,
  )
    ? (raw.evening_planning_mode as EveningPlanningMode)
    : DEFAULT_LAYOUT_PREFERENCES.eveningPlanningMode;

  return {
    sidebarCollapsed:
      raw.sidebar_collapsed ?? DEFAULT_LAYOUT_PREFERENCES.sidebarCollapsed,
    showSaintCalendar:
      raw.show_saint_calendar ?? DEFAULT_LAYOUT_PREFERENCES.showSaintCalendar,
    eveningPlanningMode: mode,
  };
}

export async function loadLayoutPreferences(
  userId: string,
): Promise<LayoutPreferences> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("sidebar_collapsed, show_saint_calendar, evening_planning_mode")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw formatSupabaseError({ table: TABLE, operation: "SELECT", error });
  }

  if (!data) return DEFAULT_LAYOUT_PREFERENCES;
  return normalizeLayout(data);
}

export async function saveLayoutPreferences({
  userId,
  preferences,
}: {
  userId: string;
  preferences: LayoutPreferences;
}): Promise<LayoutPreferences> {
  const householdId = await getCurrentHouseholdId(userId).catch(() => null);

  const payload = {
    user_id: userId,
    household_id: householdId,
    sidebar_collapsed: preferences.sidebarCollapsed,
    show_saint_calendar: preferences.showSaintCalendar,
    evening_planning_mode: preferences.eveningPlanningMode,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from(TABLE)
    .upsert(payload, { onConflict: "user_id" })
    .select("sidebar_collapsed, show_saint_calendar, evening_planning_mode")
    .single();

  if (error) {
    throw formatSupabaseError({ table: TABLE, operation: "UPSERT", error });
  }

  return normalizeLayout(data);
}
