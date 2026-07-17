/**
 * Valeurs autorisées par calendar_items_item_type_check (migration 00007).
 * Source de vérité unique — ne pas écrire ces chaînes ailleurs dans le code.
 */
export const CALENDAR_ITEM_TYPES = [
  "task",
  "event",
  "routine",
  "buffer",
  "constraint",
  "margin",
] as const;

export type CalendarItemType = (typeof CALENDAR_ITEM_TYPES)[number];

/** Types internes du Planning Engine (avant mapping Supabase). */
export type EngineBlockKind =
  | "task"
  | "routine"
  | "buffer"
  | "margin"
  | "rest"
  | "sport"
  | "manual_constraint";

export const MANUAL_CALENDAR_ITEM_TYPE: CalendarItemType = "event";

const ENGINE_BLOCK_TO_ITEM_TYPE: Record<EngineBlockKind, CalendarItemType> = {
  task: "task",
  routine: "routine",
  buffer: "buffer",
  margin: "buffer",
  rest: "buffer",
  sport: "task",
  manual_constraint: "event",
};

/** Types PlannedBlock internes (planning.ts). */
export type PlannedBlockKind = "constraint" | "task" | "buffer" | "margin";

const PLANNED_BLOCK_TO_ITEM_TYPE: Record<PlannedBlockKind, CalendarItemType> = {
  task: "task",
  buffer: "buffer",
  margin: "buffer",
  constraint: "event",
};

export function formatAllowedCalendarItemTypes(): string {
  return CALENDAR_ITEM_TYPES.join(", ");
}

export function isCalendarItemType(value: string): value is CalendarItemType {
  return (CALENDAR_ITEM_TYPES as readonly string[]).includes(value);
}

export function mapEngineBlockKindToCalendarItemType(
  kind: EngineBlockKind,
): CalendarItemType {
  return ENGINE_BLOCK_TO_ITEM_TYPE[kind];
}

export function mapPlannedBlockTypeToCalendarItemType(
  blockType: PlannedBlockKind,
): CalendarItemType {
  return PLANNED_BLOCK_TO_ITEM_TYPE[blockType];
}

export function mapCalendarItemTypeToPlannedBlockType(
  itemType: string,
  details?: { blockType?: string } | null,
): PlannedBlockKind {
  if (details?.blockType === "margin") {
    return "margin";
  }

  if (itemType === "margin") {
    return "margin";
  }

  if (itemType === "event" || itemType === "constraint") {
    return "constraint";
  }

  if (itemType === "task") {
    return "task";
  }

  if (itemType === "buffer" || itemType === "routine" || itemType === "rest") {
    return "buffer";
  }

  return "buffer";
}

export function isManualCalendarItemType(itemType: string): boolean {
  return itemType === "event" || itemType === "constraint";
}

export function isMarginCalendarItem(
  item: { item_type: string; details?: { blockType?: string } | null },
): boolean {
  return (
    item.item_type === "margin" ||
    (item.item_type === "buffer" && item.details?.blockType === "margin")
  );
}

export function isBlockingCalendarItemType(itemType: string): boolean {
  return (
    itemType === "task" ||
    itemType === "buffer" ||
    itemType === "routine" ||
    itemType === "event" ||
    itemType === "constraint"
  );
}

export const MANUAL_CONSTRAINT_ITEM_TYPES = [
  "event",
  "constraint",
] as const;
