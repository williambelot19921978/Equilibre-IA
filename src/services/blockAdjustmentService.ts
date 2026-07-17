import { supabase } from "../lib/supabase/client";
import { buildValidatedCalendarInsert } from "../lib/calendar/validateCalendarInsert";
import { MANUAL_CONSTRAINT_SOURCE } from "../config/calendarSources";
import {
  defaultTitleForActivity,
  mapActivityTypeToCalendarItemType,
  mapActivityTypeToConstraintType,
  mapActivityTypeToVisualType,
  type ActivityType,
} from "../config/activityTypes";
import { buildReplanExplanation } from "../lib/planning/replanExplanation";
import {
  resolveTimelineEditStrategy,
  type TimelineEditStrategy,
} from "../lib/planning/applyTimelineEdit";
import type { DayTimelineEntry } from "../lib/planning/displayedDayTimeline";
import type { CalendarItemDetails, CalendarItemRecord } from "../types/database";
import type { TimelineBlockEditInput } from "../types/manualBlockAdjustment";
import { validateScopeForEdit } from "../lib/planning/blockAdjustmentHelpers";
import {
  deleteAutoProposalsForDate,
  generateAndSaveDayPlan,
  loadCalendarItemsForDate,
  loadDisplayedDayPlan,
} from "./planningService";
import { loadPlanningContextForDate } from "./memoryContextService";
import { PlanningGenerationError } from "../types/planningGenerationError";
import { applyDynamicReplanUpdates } from "./dynamicReplanService";

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

function buildAdjustmentDetails({
  existingDetails,
  edit,
  activityType,
  strategy,
}: {
  existingDetails: CalendarItemDetails | null;
  edit: TimelineBlockEditInput;
  activityType: ActivityType;
  strategy: TimelineEditStrategy;
}): CalendarItemDetails {
  const visualType = mapActivityTypeToVisualType(activityType);

  return {
    ...(existingDetails ?? {}),
    modifiedByUser: true,
    adjustmentScope: edit.adjustment.scope,
    originalStartsAt: edit.adjustment.originalStartsAt,
    originalEndsAt: edit.adjustment.originalEndsAt,
    adjustmentReason: edit.comment,
    comment: edit.comment,
    activityType,
    visualType,
    constraintType: mapActivityTypeToConstraintType(activityType),
    editStrategy: strategy,
    status:
      existingDetails?.status === "completed"
        ? "completed"
        : "accepted",
    explanation:
      strategy === "create_manual_item"
        ? "Activité ajoutée manuellement dans un créneau libre."
        : "Bloc ajusté manuellement pour la journée.",
    origin: "timeline_edit",
    ...(activityType === "sport"
      ? {
          category: "sport",
          businessType: "sport",
          activityType: "workout",
          visualType: "sport",
        }
      : {}),
  };
}

function resolveActivityType(
  entry: DayTimelineEntry,
  edit: TimelineBlockEditInput,
): ActivityType {
  if (edit.activityType) {
    return edit.activityType;
  }

  if (entry.activityType) {
    return entry.activityType;
  }

  if (entry.visualType === "work") return "work";
  if (entry.visualType === "task") return "task";
  if (entry.visualType === "sport") return "sport";
  if (entry.visualType === "children_routine") return "children";
  if (entry.visualType === "commute") return "commute";
  if (entry.visualType === "rest") return "rest";

  return "appointment";
}

async function createManualCalendarItem({
  householdId,
  userId,
  edit,
  activityType,
  strategy,
}: {
  householdId: string;
  userId: string;
  edit: TimelineBlockEditInput;
  activityType: ActivityType;
  strategy: TimelineEditStrategy;
}): Promise<CalendarItemRecord> {
  const details = buildAdjustmentDetails({
    existingDetails: null,
    edit,
    activityType,
    strategy,
  });

  const payload = buildValidatedCalendarInsert({
    household_id: householdId,
    user_id: userId,
    task_id: null,
    title: edit.title.trim() || defaultTitleForActivity(activityType),
    item_type: mapActivityTypeToCalendarItemType(activityType),
    starts_at: edit.startsAt,
    ends_at: edit.endsAt,
    locked: edit.locked,
    source: MANUAL_CONSTRAINT_SOURCE,
    details,
    updated_at: new Date().toISOString(),
  });

  const { data, error } = await supabase
    .from("calendar_items")
    .insert(payload)
    .select(CALENDAR_SELECT)
    .single();

  if (error || !data) {
    throw PlanningGenerationError.fromSupabase({
      table: "calendar_items",
      operation: "INSERT",
      error,
      step: "save",
    });
  }

  return data;
}

async function updateExistingCalendarItem({
  calendarItemId,
  edit,
  activityType,
  strategy,
}: {
  calendarItemId: string;
  edit: TimelineBlockEditInput;
  activityType: ActivityType;
  strategy: TimelineEditStrategy;
}): Promise<CalendarItemRecord> {
  const { data: existing, error: loadError } = await supabase
    .from("calendar_items")
    .select(CALENDAR_SELECT)
    .eq("id", calendarItemId)
    .single();

  if (loadError || !existing) {
    throw new PlanningGenerationError({
      code: "LOAD_DATA_FAILED",
      userMessage: "Impossible de retrouver ce bloc dans le calendrier.",
      technicalDetails: loadError?.message ?? "missing calendar item",
      step: "load",
    });
  }

  const mergedDetails = buildAdjustmentDetails({
    existingDetails: existing.details,
    edit,
    activityType,
    strategy,
  });

  const { data, error } = await supabase
    .from("calendar_items")
    .update({
      title: edit.title.trim() || defaultTitleForActivity(activityType),
      item_type: mapActivityTypeToCalendarItemType(activityType),
      starts_at: edit.startsAt,
      ends_at: edit.endsAt,
      locked: edit.locked,
      details: mergedDetails,
      updated_at: new Date().toISOString(),
    })
    .eq("id", calendarItemId)
    .select(CALENDAR_SELECT)
    .single();

  if (error || !data) {
    throw PlanningGenerationError.fromSupabase({
      table: "calendar_items",
      operation: "UPDATE",
      error,
      step: "save",
    });
  }

  return data;
}

export async function applyTimelineEdit({
  userId,
  householdId,
  entry,
  edit,
}: {
  userId: string;
  householdId: string;
  entry: DayTimelineEntry;
  edit: TimelineBlockEditInput;
}): Promise<CalendarItemRecord> {
  const strategy = resolveTimelineEditStrategy(entry);
  const activityType = resolveActivityType(entry, edit);

  if (strategy === "update_existing_item" && entry.calendarItemId) {
    return updateExistingCalendarItem({
      calendarItemId: entry.calendarItemId,
      edit,
      activityType,
      strategy,
    });
  }

  return createManualCalendarItem({
    householdId,
    userId,
    edit,
    activityType,
    strategy:
      strategy === "update_existing_item"
        ? "create_daily_override"
        : strategy,
  });
}

export async function applyTimelineEditAndReplan({
  userId,
  date,
  entry,
  edit,
}: {
  userId: string;
  date: string;
  entry: DayTimelineEntry;
  edit: TimelineBlockEditInput;
}): Promise<{
  plan: NonNullable<Awaited<ReturnType<typeof loadDisplayedDayPlan>>>["plan"];
  timeline: DayTimelineEntry[];
  items: CalendarItemRecord[];
  explanation: string;
}> {
  const scopeMessage = validateScopeForEdit(edit.scope);

  if (scopeMessage) {
    throw new PlanningGenerationError({
      code: "GENERATE_FAILED",
      userMessage: scopeMessage,
      technicalDetails: `scope=${edit.scope}`,
      step: "generate",
    });
  }

  const planningContext = await loadPlanningContextForDate({ userId, date });

  if (!planningContext) {
    throw new PlanningGenerationError({
      code: "NO_HOUSEHOLD",
      userMessage: "Aucun foyer trouvé pour modifier le planning.",
      technicalDetails: "loadPlanningContextForDate returned null.",
      step: "load",
    });
  }

  const previousItems = await loadCalendarItemsForDate({
    userId,
    householdId: planningContext.householdId,
    date,
  });

  const activityType = resolveActivityType(entry, edit);
  const strategy = resolveTimelineEditStrategy(entry);

  await applyTimelineEdit({
    userId,
    householdId: planningContext.householdId,
    entry,
    edit,
  });

  let dynamicExplanation: string[] = [];

  const partialDisplayed = await loadDisplayedDayPlan({ userId, date });
  if (partialDisplayed) {
    const dynamic = await applyDynamicReplanUpdates({
      timeline: partialDisplayed.timeline,
      items: partialDisplayed.items,
      movedEntryId: entry.id,
      nextStartsAt: edit.startsAt,
      nextEndsAt: edit.endsAt,
      planningContext,
    });
    dynamicExplanation = dynamic.explanation;
  }

  await deleteAutoProposalsForDate({
    householdId: planningContext.householdId,
    userId,
    date,
  });

  try {
    await generateAndSaveDayPlan({ userId, date });
  } catch (error) {
    if (
      error instanceof PlanningGenerationError &&
      error.code === "NO_AVAILABLE_SLOTS"
    ) {
      // La modification est conservée même si le moteur ne peut pas tout replanifier.
    } else {
      throw error;
    }
  }

  const displayed = await loadDisplayedDayPlan({ userId, date });

  if (!displayed) {
    throw new PlanningGenerationError({
      code: "LOAD_DATA_FAILED",
      userMessage: "Impossible de recharger la journée après modification.",
      technicalDetails: "loadDisplayedDayPlan returned null.",
      step: "load",
    });
  }

  const explanation = buildReplanExplanation({
    adjustment: edit.adjustment,
    previousItems,
    nextItems: displayed.items,
    activityType,
    strategy,
    entry,
  });

  return {
    plan: displayed.plan,
    timeline: displayed.timeline,
    items: displayed.items,
    explanation: [explanation, ...dynamicExplanation].filter(Boolean).join(" "),
  };
}

export {
  buildManualBlockAdjustment,
  combineDateAndLocalTime,
  isoToTimeInput,
  validateScopeForEdit,
} from "../lib/planning/blockAdjustmentHelpers";

export { resolveTimelineEditStrategy } from "../lib/planning/applyTimelineEdit";
