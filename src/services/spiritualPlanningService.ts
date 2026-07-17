import { buildValidatedCalendarInsert } from "../lib/calendar/validateCalendarInsert";
import { MANUAL_CONSTRAINT_SOURCE } from "../config/calendarSources";
import { computeNextFreeSlot } from "../lib/planning/daySummary";
import { resolveSpiritualSchedule } from "../lib/spiritual/scheduling";
import { supabase } from "../lib/supabase/client";
import { PlanningGenerationError } from "../types/planningGenerationError";
import type { SpiritualActivityType, SpiritualScheduleOption } from "../types/spiritual";
import { loadPlanningContextForDate } from "./memoryContextService";
import {
  deleteAutoProposalsForDate,
  generateAndSaveDayPlan,
  loadCalendarItemsForDate,
} from "./planningService";

export { resolveSpiritualSchedule } from "../lib/spiritual/scheduling";

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

export async function resolveNextFreeSchedule({
  userId,
  householdId,
  date,
  durationMinutes,
  now = new Date(),
}: {
  userId: string;
  householdId: string;
  date: string;
  durationMinutes: number;
  now?: Date;
}): Promise<{ startsAt: string; endsAt: string }> {
  const items = await loadCalendarItemsForDate({ userId, householdId, date });
  const slot = computeNextFreeSlot(items, now);

  if (!slot || slot.durationMinutes < Math.min(durationMinutes, 5)) {
    const fallback = new Date(now);
    fallback.setMinutes(fallback.getMinutes() + (5 - (fallback.getMinutes() % 5)), 0, 0);
    return {
      startsAt: fallback.toISOString(),
      endsAt: new Date(
        fallback.getTime() + durationMinutes * 60_000,
      ).toISOString(),
    };
  }

  const startsAt = slot.startsAt;
  const endsAt = new Date(
    new Date(startsAt).getTime() + durationMinutes * 60_000,
  ).toISOString();

  return { startsAt, endsAt };
}

export async function addSpiritualActivityToPlanning({
  userId,
  date,
  title,
  durationMinutes,
  schedule,
  customStartTime,
  preferredMoment,
  spiritualActivityType,
  contentId,
  generatedContent,
  sourceReason,
}: {
  userId: string;
  date: string;
  title: string;
  durationMinutes: number;
  schedule: SpiritualScheduleOption;
  customStartTime?: string;
  preferredMoment?: string;
  spiritualActivityType: SpiritualActivityType;
  contentId?: string;
  generatedContent?: Record<string, unknown>;
  sourceReason?: string;
}): Promise<{ explanation: string }> {
  const planningContext = await loadPlanningContextForDate({ userId, date });

  if (!planningContext) {
    throw new PlanningGenerationError({
      code: "NO_HOUSEHOLD",
      userMessage: "Aucun foyer trouvé.",
      technicalDetails: "loadPlanningContextForDate returned null.",
      step: "load",
    });
  }

  let timestamps: { startsAt: string; endsAt: string };

  if (schedule === "next_free") {
    timestamps = await resolveNextFreeSchedule({
      userId,
      householdId: planningContext.householdId,
      date,
      durationMinutes,
    });
  } else {
    timestamps = resolveSpiritualSchedule({
      date,
      schedule,
      durationMinutes,
      customStartTime,
      preferredMoment,
    });
  }

  const payload = buildValidatedCalendarInsert({
    household_id: planningContext.householdId,
    user_id: userId,
    task_id: null,
    title,
    item_type: "event",
    starts_at: timestamps.startsAt,
    ends_at: timestamps.endsAt,
    locked: true,
    source: MANUAL_CONSTRAINT_SOURCE,
    details: {
      suggestionType: "spiritual",
      activityType: "spiritual",
      spiritualActivityType,
      contentId,
      generatedContent,
      duration: durationMinutes,
      sourceReason,
      visualType: "rest",
      status: "accepted",
      modifiedByUser: true,
      origin: "spiritual_space",
      explanation: "Moment spirituel ajouté depuis l'espace personnel.",
    },
    updated_at: new Date().toISOString(),
  });

  const { error } = await supabase
    .from("calendar_items")
    .insert(payload)
    .select(CALENDAR_SELECT)
    .single();

  if (error) {
    throw PlanningGenerationError.fromSupabase({
      table: "calendar_items",
      operation: "INSERT",
      error,
      step: "save",
    });
  }

  await deleteAutoProposalsForDate({
    householdId: planningContext.householdId,
    userId,
    date,
  });

  try {
    await generateAndSaveDayPlan({ userId, date });
  } catch (generateError) {
    if (
      !(
        generateError instanceof PlanningGenerationError &&
        generateError.code === "NO_AVAILABLE_SLOTS"
      )
    ) {
      throw generateError;
    }
  }

  return {
    explanation: `${title} ajouté à ta journée. Le planning se réorganise autour de ce moment.`,
  };
}
