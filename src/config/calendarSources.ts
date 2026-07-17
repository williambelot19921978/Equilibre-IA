/** Valeurs autorisées par le CHECK `calendar_items_source_check` côté Supabase. */
export const CALENDAR_ITEM_SOURCES = [
  "user",
  "ai",
  "calendar_sync",
  "system",
] as const;

export type CalendarItemSource = (typeof CALENDAR_ITEM_SOURCES)[number];

/** Contraintes ajoutées manuellement depuis /calendar. */
export const MANUAL_CONSTRAINT_SOURCE: CalendarItemSource = "user";

/** Blocs générés par le Planning Engine (mapping interne → schéma Supabase). */
export const ENGINE_CALENDAR_SOURCE: CalendarItemSource = "ai";

export function isManualCalendarSource(source: string): boolean {
  return source === MANUAL_CONSTRAINT_SOURCE;
}

/** Blocs proposés par le moteur (valeur Supabase ou legacy interne). */
export function isAutoCalendarSource(source: string): boolean {
  return source === ENGINE_CALENDAR_SOURCE || source === "engine";
}

export function isCalendarItemSource(source: string): source is CalendarItemSource {
  return (CALENDAR_ITEM_SOURCES as readonly string[]).includes(source);
}
