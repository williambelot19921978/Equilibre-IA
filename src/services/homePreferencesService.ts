import { supabase } from "../lib/supabase/client";
import { formatSupabaseError } from "../lib/supabase/formatError";
import {
  ALL_HOME_WIDGETS,
  DEFAULT_HOME_PREFERENCES,
  type CalendarWidgetPosition,
  type HomePreferences,
  type HomeWidgetId,
} from "../types/homePreferences";
import {
  DEFAULT_MEAL_SETTINGS,
  type MealSettings,
} from "../types/mealSettings";
import {
  DEFAULT_SPORT_PREFERENCES,
  type SportPreferences,
} from "../types/sportPreferences";
import type { WorkoutLevel, WorkoutSessionType } from "../types/workoutSession";
import { getCurrentHouseholdId } from "./householdService";

const TABLE = "user_home_preferences";

const VALID_POSITIONS: CalendarWidgetPosition[] = [
  "hidden",
  "header_right",
  "drawer",
];

function parseWidgetList(value: unknown): HomeWidgetId[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is HomeWidgetId =>
    ALL_HOME_WIDGETS.includes(item as HomeWidgetId),
  );
}

function parsePosition(value: unknown, fallback: CalendarWidgetPosition): CalendarWidgetPosition {
  if (typeof value === "string" && VALID_POSITIONS.includes(value as CalendarWidgetPosition)) {
    return value as CalendarWidgetPosition;
  }
  return fallback;
}

function parseMealSettings(raw: unknown): MealSettings {
  if (!raw || typeof raw !== "object") return DEFAULT_MEAL_SETTINGS;
  const data = raw as Partial<MealSettings>;
  return {
    breakfast: {
      enabled: data.breakfast?.enabled ?? DEFAULT_MEAL_SETTINGS.breakfast.enabled,
      durationMinutes:
        data.breakfast?.durationMinutes ??
        DEFAULT_MEAL_SETTINGS.breakfast.durationMinutes,
      usualTime: data.breakfast?.usualTime ?? null,
    },
    dinner: {
      durationMinutes:
        data.dinner?.durationMinutes ?? DEFAULT_MEAL_SETTINGS.dinner.durationMinutes,
      usualTime: data.dinner?.usualTime ?? null,
      beforeEveningRoutine:
        data.dinner?.beforeEveningRoutine ??
        DEFAULT_MEAL_SETTINGS.dinner.beforeEveningRoutine,
    },
  };
}

function normalizePreferences(raw: {
  visible_widgets: unknown;
  widget_order: unknown;
  compact_mode: boolean;
  calendar_widget_position?: unknown;
  calendar_widget_position_mobile?: unknown;
}): HomePreferences {
  const widgetOrder =
    parseWidgetList(raw.widget_order).length > 0
      ? parseWidgetList(raw.widget_order)
      : DEFAULT_HOME_PREFERENCES.widgetOrder;

  const visibleWidgets =
    parseWidgetList(raw.visible_widgets).length > 0
      ? parseWidgetList(raw.visible_widgets)
      : DEFAULT_HOME_PREFERENCES.visibleWidgets;

  return {
    visibleWidgets,
    widgetOrder,
    compactMode: raw.compact_mode ?? true,
    calendarWidgetPosition: parsePosition(
      raw.calendar_widget_position,
      DEFAULT_HOME_PREFERENCES.calendarWidgetPosition,
    ),
    calendarWidgetPositionMobile: parsePosition(
      raw.calendar_widget_position_mobile,
      DEFAULT_HOME_PREFERENCES.calendarWidgetPositionMobile,
    ),
  };
}

const SELECT_FIELDS =
  "visible_widgets, widget_order, compact_mode, calendar_widget_position, calendar_widget_position_mobile, meal_settings";

export async function loadHomePreferences(
  userId: string,
): Promise<HomePreferences> {
  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_FIELDS)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw formatSupabaseError({ table: TABLE, operation: "SELECT", error });
  }

  if (!data) {
    return DEFAULT_HOME_PREFERENCES;
  }

  return normalizePreferences(data);
}

export async function loadMealSettings(userId: string): Promise<MealSettings> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("meal_settings")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw formatSupabaseError({ table: TABLE, operation: "SELECT", error });
  }

  if (!data) return DEFAULT_MEAL_SETTINGS;
  return parseMealSettings(data.meal_settings);
}

export async function saveHomePreferences({
  userId,
  preferences,
}: {
  userId: string;
  preferences: HomePreferences;
}): Promise<HomePreferences> {
  const householdId = await getCurrentHouseholdId(userId).catch(() => null);

  const payload = {
    user_id: userId,
    household_id: householdId,
    visible_widgets: preferences.visibleWidgets,
    widget_order: preferences.widgetOrder,
    compact_mode: preferences.compactMode,
    calendar_widget_position: preferences.calendarWidgetPosition,
    calendar_widget_position_mobile: preferences.calendarWidgetPositionMobile,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from(TABLE)
    .upsert(payload, { onConflict: "user_id" })
    .select(SELECT_FIELDS)
    .single();

  if (error) {
    throw formatSupabaseError({ table: TABLE, operation: "UPSERT", error });
  }

  return normalizePreferences(data);
}

export async function saveMealSettings({
  userId,
  mealSettings,
}: {
  userId: string;
  mealSettings: MealSettings;
}): Promise<MealSettings> {
  const householdId = await getCurrentHouseholdId(userId).catch(() => null);

  const { data, error } = await supabase
    .from(TABLE)
    .upsert(
      {
        user_id: userId,
        household_id: householdId,
        meal_settings: mealSettings,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select("meal_settings")
    .single();

  if (error) {
    throw formatSupabaseError({ table: TABLE, operation: "UPSERT", error });
  }

  return parseMealSettings(data.meal_settings);
}

export function getOrderedVisibleWidgets(
  preferences: HomePreferences,
): HomeWidgetId[] {
  const visible = new Set(preferences.visibleWidgets);
  return preferences.widgetOrder.filter((id) => visible.has(id));
}

export function resolveCalendarWidgetPosition(
  preferences: HomePreferences,
  isMobile: boolean,
): CalendarWidgetPosition {
  return isMobile
    ? preferences.calendarWidgetPositionMobile
    : preferences.calendarWidgetPosition;
}

export function parseSportSettings(raw: unknown): SportPreferences {
  if (!raw || typeof raw !== "object") return DEFAULT_SPORT_PREFERENCES;
  const value = raw as Partial<SportPreferences>;
  return {
    level: (value.level as WorkoutLevel) ?? DEFAULT_SPORT_PREFERENCES.level,
    preferredTypes: Array.isArray(value.preferredTypes)
      ? (value.preferredTypes as WorkoutSessionType[])
      : DEFAULT_SPORT_PREFERENCES.preferredTypes,
    avoidedTypes: Array.isArray(value.avoidedTypes)
      ? (value.avoidedTypes as WorkoutSessionType[])
      : DEFAULT_SPORT_PREFERENCES.avoidedTypes,
    availableEquipment: Array.isArray(value.availableEquipment)
      ? value.availableEquipment.filter((item) => typeof item === "string")
      : DEFAULT_SPORT_PREFERENCES.availableEquipment,
    preferredDurationMinutes:
      typeof value.preferredDurationMinutes === "number"
        ? value.preferredDurationMinutes
        : DEFAULT_SPORT_PREFERENCES.preferredDurationMinutes,
    minimumDurationMinutes:
      typeof value.minimumDurationMinutes === "number"
        ? value.minimumDurationMinutes
        : DEFAULT_SPORT_PREFERENCES.minimumDurationMinutes,
    intensity: value.intensity ?? DEFAULT_SPORT_PREFERENCES.intensity,
    preferredZones: Array.isArray(value.preferredZones)
      ? value.preferredZones.filter((item) => typeof item === "string")
      : DEFAULT_SPORT_PREFERENCES.preferredZones,
    weeklyFrequencyGoal:
      typeof value.weeklyFrequencyGoal === "number"
        ? value.weeklyFrequencyGoal
        : DEFAULT_SPORT_PREFERENCES.weeklyFrequencyGoal,
    location: value.location ?? DEFAULT_SPORT_PREFERENCES.location,
  };
}

export async function loadSportSettings(userId: string): Promise<SportPreferences> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("sport_settings")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw formatSupabaseError({ table: TABLE, operation: "SELECT", error });
  }

  if (!data) return DEFAULT_SPORT_PREFERENCES;
  return parseSportSettings(data.sport_settings);
}

export async function saveSportSettings({
  userId,
  settings,
}: {
  userId: string;
  settings: SportPreferences;
}): Promise<SportPreferences> {
  const householdId = await getCurrentHouseholdId(userId).catch(() => null);

  const { data, error } = await supabase
    .from(TABLE)
    .upsert(
      {
        user_id: userId,
        household_id: householdId,
        sport_settings: settings,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select("sport_settings")
    .single();

  if (error) {
    throw formatSupabaseError({ table: TABLE, operation: "UPSERT", error });
  }

  return parseSportSettings(data.sport_settings);
}
