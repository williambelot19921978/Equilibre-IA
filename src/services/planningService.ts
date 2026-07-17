import { supabase } from "../lib/supabase/client";
import { generateDayPlan } from "../ai/planningEngine";
import {
  ENGINE_CALENDAR_SOURCE,
  MANUAL_CONSTRAINT_SOURCE,
} from "../config/calendarSources";
import {
  mapPlannedBlockTypeToCalendarItemType,
  isMarginCalendarItem,
} from "../config/calendarItemTypes";
import { buildValidatedCalendarInsert } from "../lib/calendar/validateCalendarInsert";
import {
  getBedTime,
  getWakeTime,
} from "../ai/memoryEngine";
import {
  computeFillPercentage,
  computeNextFreeSlot,
} from "../lib/planning/daySummary";
import { enrichPlanningContextWithLife } from "../ai/lifeEngine";
import { mergeExternalEventsForDay } from "../lib/planning/externalEventsToPlanningItems";
import { loadExternalEventsForDate } from "./googleCalendarService";
import { buildHistoricalDayView } from "../lib/planning/buildHistoricalDayView";
import { buildDisplayDayView } from "../lib/planning/buildDisplayDayView";
import {
  resolveDayDisplayMode,
  type DayDisplayMode,
} from "../lib/planning/dayDisplayMode";
import { calendarItemToPlannedBlock } from "../lib/planning/calendarBlockMapping";
import type { DayTimelineEntry } from "../lib/planning/displayedDayTimeline";
import { formatSupabaseError } from "../lib/supabase/formatError";
import { loadHouseholdMemoryContext, loadPlanningContextForDate } from "./memoryContextService";
import { loadTaskActivityEventsForDate } from "./taskActivityEventService";
import { getTasksForPlanning, getImportantRemainingTasks, markTasksAsPlanned } from "./tasksService";
import {
  PlanningGenerationError,
} from "../types/planningGenerationError";
import {
  getPersistableEngineBlocks,
  shouldDeleteAutoCalendarItem,
} from "../lib/planning/persistenceHelpers";
import type {
  CalendarItemDetails,
  CalendarItemRecord,
  DayPlan,
  IgnoredCalendarItem,
  PlannedBlock,
  PlanningResult,
} from "../types";

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

import { getLocalDayBounds } from "../lib/time/dayBounds";
import { getLocalWeekBounds } from "../lib/time/weekBounds";

function blockToCalendarInsert(
  block: PlannedBlock,
  {
    householdId,
    userId,
  }: {
    householdId: string;
    userId: string;
  },
) {
  const details: CalendarItemDetails = {
    explanation: block.explanation.summary,
    facts: block.explanation.facts,
    confidence: block.explanation.confidence,
    status: "proposed",
    segmentIndex: block.segmentIndex,
    segmentTotal: block.segmentTotal,
    energyLevel: block.energyLevel,
    blockType: block.blockType,
  };

  const itemType = mapPlannedBlockTypeToCalendarItemType(block.blockType);

  const payload = buildValidatedCalendarInsert({
    household_id: householdId,
    user_id: userId,
    task_id: block.taskId ?? null,
    title: block.title,
    item_type: itemType,
    starts_at: block.startsAt,
    ends_at: block.endsAt,
    locked: block.locked,
    source:
      block.source === "manual"
        ? MANUAL_CONSTRAINT_SOURCE
        : ENGINE_CALENDAR_SOURCE,
    details,
    updated_at: new Date().toISOString(),
  });

  return payload;
}

export async function loadCalendarItemsForDate({
  userId,
  householdId,
  date,
}: {
  userId: string;
  householdId: string;
  date: string;
}): Promise<CalendarItemRecord[]> {
  const { start, end } = getLocalDayBounds(date);

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

  return data ?? [];
}

export async function loadCalendarItemsForWeek({
  userId,
  householdId,
  referenceDate,
}: {
  userId: string;
  householdId: string;
  referenceDate: string;
}): Promise<CalendarItemRecord[]> {
  const { start, end } = getLocalWeekBounds(referenceDate);

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

  return data ?? [];
}

export async function deleteAutoProposalsForDate({
  householdId,
  userId,
  date,
}: {
  householdId: string;
  userId: string;
  date: string;
}): Promise<void> {
  const existing = await loadCalendarItemsForDate({
    userId,
    householdId,
    date,
  });

  const deletableIds = existing
    .filter((item) => shouldDeleteAutoCalendarItem(item))
    .map((item) => item.id);

  if (deletableIds.length === 0) {
    return;
  }

  const { error } = await supabase
    .from("calendar_items")
    .delete()
    .in("id", deletableIds);

  if (error) {
    throw PlanningGenerationError.fromSupabase({
      table: "calendar_items",
      operation: "DELETE",
      error,
      step: "save",
    });
  }
}

export async function saveDayPlan({
  userId,
  householdId,
  plan,
}: {
  userId: string;
  householdId: string;
  plan: DayPlan;
}): Promise<CalendarItemRecord[]> {
  const blocksToSave = getPersistableEngineBlocks(plan);

  if (blocksToSave.length === 0) {
    return [];
  }

  const inserts = blocksToSave.map((block) =>
    blockToCalendarInsert(block, { householdId, userId }),
  );

  const { data, error } = await supabase
    .from("calendar_items")
    .insert(inserts)
    .select(CALENDAR_SELECT);

  if (error) {
    throw PlanningGenerationError.fromSupabase({
      table: "calendar_items",
      operation: "INSERT",
      error,
      step: "save",
    });
  }

  const taskIds = plan.blocks
    .filter((block) => block.blockType === "task" && block.taskId)
    .map((block) => block.taskId as string);

  await markTasksAsPlanned(taskIds);

  return data ?? [];
}

function mergePersistedPlan({
  date,
  items,
  result,
  context,
  tasks,
}: {
  date: string;
  items: CalendarItemRecord[];
  result: PlanningResult;
  context: NonNullable<Awaited<ReturnType<typeof loadPlanningContextForDate>>>;
  tasks: Awaited<ReturnType<typeof getTasksForPlanning>>;
}): DayPlan {
  const { plan } = buildDisplayDayView({
    date,
    context,
    tasks,
    persistedItems: items,
  });

  return {
    ...plan,
    unplannableTasks: result.plan.unplannableTasks,
    freeMinutesRemaining: result.plan.freeMinutesRemaining,
    totalFreeMinutes: result.plan.totalFreeMinutes,
    fillPercentage: result.plan.fillPercentage,
    contextAdaptations: result.plan.contextAdaptations,
    contextWarnings: result.plan.contextWarnings,
    ignoredCalendarItems: result.plan.ignoredCalendarItems,
  };
}

export async function loadDisplayedDayPlan({
  userId,
  date,
  sportProposalOverrides,
}: {
  userId: string;
  date: string;
  sportProposalOverrides?: Record<
    string,
    import("../types/workoutSession").WorkoutSession
  >;
}): Promise<{
  plan: DayPlan;
  timeline: DayTimelineEntry[];
  items: CalendarItemRecord[];
  displayMode: DayDisplayMode;
  lifeContext?: import("../types/lifeContext").LifeContext;
} | null> {
  const planningContext = await loadPlanningContextForDate({ userId, date });

  if (!planningContext) {
    return null;
  }

  const displayMode = resolveDayDisplayMode(date);

  const [items, tasks, externalEvents, taskActivityEvents] = await Promise.all([
    loadCalendarItemsForDate({
      userId,
      householdId: planningContext.householdId,
      date,
    }),
    getTasksForPlanning(userId),
    loadExternalEventsForDate({
      userId,
      householdId: planningContext.householdId,
      date,
    }).catch(() => []),
    loadTaskActivityEventsForDate({
      userId,
      householdId: planningContext.householdId,
      date,
    }).catch(() => []),
  ]);

  const mergedItems = mergeExternalEventsForDay({
    date,
    persistedItems: items,
    externalEvents,
  });

  if (displayMode === "historical") {
    const historical = buildHistoricalDayView({
      date,
      persistedItems: mergedItems,
    });

    return {
      plan: historical.plan,
      timeline: historical.timeline,
      items: mergedItems,
      displayMode,
    };
  }

  const { plan, timeline, lifeContext } = buildDisplayDayView({
    date,
    context: planningContext,
    tasks,
    persistedItems: mergedItems,
    sportProposalOverrides,
    taskActivityEvents,
  });

  return { plan, timeline, items: mergedItems, displayMode, lifeContext };
}

export async function generateAndSaveDayPlan({
  userId,
  date,
}: {
  userId: string;
  date: string;
}): Promise<{
  result: PlanningResult;
  savedItems: CalendarItemRecord[];
  plan: DayPlan;
  ignoredCalendarItems: IgnoredCalendarItem[];
}> {
  let planningContext;

  try {
    planningContext = await loadPlanningContextForDate({ userId, date });
  } catch (error) {
    throw new PlanningGenerationError({
      code: "LOAD_CONTEXT_FAILED",
      userMessage:
        error instanceof Error
          ? error.message
          : "Impossible de charger le contexte du foyer.",
      technicalDetails: String(error),
      step: "load",
    });
  }

  if (!planningContext) {
    throw new PlanningGenerationError({
      code: "NO_HOUSEHOLD",
      userMessage: "Aucun foyer trouvé pour générer le planning.",
      technicalDetails: "loadPlanningContextForDate returned null.",
      step: "load",
    });
  }

  await deleteAutoProposalsForDate({
    householdId: planningContext.householdId,
    userId,
    date,
  });

  let tasks;
  let existingItems;

  try {
    [tasks, existingItems] = await Promise.all([
      getTasksForPlanning(userId),
      loadCalendarItemsForDate({
        userId,
        householdId: planningContext.householdId,
        date,
      }),
    ]);
  } catch (error) {
    if (error instanceof PlanningGenerationError) {
      throw error;
    }

    throw new PlanningGenerationError({
      code: "LOAD_DATA_FAILED",
      userMessage:
        error instanceof Error
          ? error.message
          : "Impossible de charger les données du jour.",
      technicalDetails: String(error),
      step: "load",
    });
  }

  const lockedItems = existingItems.filter((item) => item.locked);

  planningContext = enrichPlanningContextWithLife(
    planningContext,
    lockedItems,
  );

  let result: PlanningResult;

  try {
    result = generateDayPlan({
      date,
      context: planningContext,
      tasks,
      existingItems: lockedItems,
    });
  } catch (error) {
    throw new PlanningGenerationError({
      code: "GENERATE_FAILED",
      userMessage:
        error instanceof Error
          ? error.message
          : "Le moteur de planning a échoué.",
      technicalDetails: String(error),
      step: "generate",
    });
  }

  if (result.plan.totalFreeMinutes <= 0) {
    throw PlanningGenerationError.noAvailableSlots();
  }

  if (import.meta.env.DEV) {
    console.info("[planning] generate", {
      date,
      lockedItems: lockedItems.map((item) => ({
        id: item.id,
        title: item.title,
        starts_at: item.starts_at,
        ends_at: item.ends_at,
        source: item.source,
      })),
      ignoredCalendarItems: result.plan.ignoredCalendarItems,
      blocksToPersist: getPersistableEngineBlocks(result.plan).length,
    });
  }

  try {
    await saveDayPlan({
      userId,
      householdId: planningContext.householdId,
      plan: result.plan,
    });
  } catch (error) {
    if (error instanceof PlanningGenerationError) {
      throw error;
    }

    throw PlanningGenerationError.fromSupabase({
      table: "calendar_items",
      operation: "INSERT",
      error,
      step: "save",
    });
  }

  const savedItems = await loadCalendarItemsForDate({
    userId,
    householdId: planningContext.householdId,
    date,
  });

  const plan = mergePersistedPlan({
    date,
    items: savedItems,
    result,
    context: planningContext,
    tasks,
  });

  return {
    result,
    savedItems,
    plan,
    ignoredCalendarItems: result.plan.ignoredCalendarItems ?? [],
  };
}

export function calendarItemsToDayPlan({
  date,
  items,
}: {
  date: string;
  items: CalendarItemRecord[];
}): DayPlan {
  const blocks = items.map(calendarItemToPlannedBlock);
  const constraints = blocks
    .filter((block) => block.blockType === "constraint")
    .map((block) => ({
      id: block.id,
      type: "manual" as const,
      title: block.title,
      startsAt: block.startsAt,
      endsAt: block.endsAt,
      locked: block.locked,
      source: block.source,
    }));
  const margins = blocks.filter((block) => block.blockType === "margin");

  return {
    date,
    constraints,
    blocks,
    margins,
    unplannableTasks: [],
    freeMinutesRemaining: 0,
    totalFreeMinutes: 0,
    fillPercentage: 0,
    incompleteData: [],
    contextAdaptations: [],
    contextWarnings: [],
    ignoredCalendarItems: [],
  };
}

export async function loadDayPlanSummary({
  userId,
  date,
}: {
  userId: string;
  date: string;
}): Promise<{
  items: CalendarItemRecord[];
  nextActivity: CalendarItemRecord | null;
  nextFreeSlot: ReturnType<typeof computeNextFreeSlot>;
  plannedTaskCount: number;
  freeMinutesRemaining: number;
  fillPercentage: number;
  importantTasksRemaining: number;
}> {
  const memoryContext = await loadHouseholdMemoryContext(userId);

  if (!memoryContext.householdId) {
    return {
      items: [],
      nextActivity: null,
      nextFreeSlot: null,
      plannedTaskCount: 0,
      freeMinutesRemaining: 0,
      fillPercentage: 0,
      importantTasksRemaining: 0,
    };
  }

  const [itemsResult, tasksResult] = await Promise.allSettled([
    loadCalendarItemsForDate({
      userId,
      householdId: memoryContext.householdId,
      date,
    }),
    getImportantRemainingTasks(userId),
  ]);

  const items =
    itemsResult.status === "fulfilled" ? itemsResult.value : [];
  const importantTasks =
    tasksResult.status === "fulfilled" ? tasksResult.value : [];

  const now = Date.now();
  const upcoming = items
    .filter((item) => new Date(item.ends_at).getTime() > now)
    .sort(
      (a, b) =>
        new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
    );

  const plannedTaskCount = items.filter((item) => item.item_type === "task").length;
  const marginItem = items.find((item) => isMarginCalendarItem(item));
  const freeMinutesRemaining = marginItem
    ? Math.round(
        (new Date(marginItem.ends_at).getTime() -
          new Date(marginItem.starts_at).getTime()) /
          60_000,
      )
    : 0;

  const planningContext = await loadPlanningContextForDate({ userId, date });
  let nextFreeSlot = computeNextFreeSlot(items);

  if (!nextFreeSlot && planningContext && items.length === 0) {
    const wake = getWakeTime(planningContext);
    const bed = getBedTime(planningContext);
    nextFreeSlot = {
      startsAt: new Date(`${date}T${wake}:00`).toISOString(),
      endsAt: new Date(`${date}T${bed}:00`).toISOString(),
      durationMinutes: Math.round(
        (new Date(`${date}T${bed}:00`).getTime() -
          Math.max(
            new Date(`${date}T${wake}:00`).getTime(),
            Date.now(),
          )) /
          60_000,
      ),
    };
  }

  return {
    items,
    nextActivity: upcoming[0] ?? null,
    nextFreeSlot,
    plannedTaskCount,
    freeMinutesRemaining,
    fillPercentage: computeFillPercentage(items),
    importantTasksRemaining: importantTasks.length,
  };
}

// Re-export for tests
export { buildHouseholdMemoryContext } from "../ai/memoryEngine";

// Keep formatSupabaseError available for other services
export { formatSupabaseError };
