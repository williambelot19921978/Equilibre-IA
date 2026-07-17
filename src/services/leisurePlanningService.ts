import { generateWorkoutSession } from "../ai/sportSessionGenerator";
import { buildValidatedCalendarInsert } from "../lib/calendar/validateCalendarInsert";
import { MANUAL_CONSTRAINT_SOURCE } from "../config/calendarSources";
import { getLeisureActivityById } from "../data/leisureContentLibrary";
import { supabase } from "../lib/supabase/client";
import { PlanningGenerationError } from "../types/planningGenerationError";
import { loadPlanningContextForDate } from "./memoryContextService";
import {
  deleteAutoProposalsForDate,
  generateAndSaveDayPlan,
  loadCalendarItemsForDate,
  loadDisplayedDayPlan,
} from "./planningService";
import { computeNextFreeSlot } from "../lib/planning/daySummary";

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

export async function addLeisureActivityToPlanning({
  userId,
  date,
  activityId,
  customStartTime,
}: {
  userId: string;
  date: string;
  activityId: string;
  customStartTime?: string;
}): Promise<{ explanation: string }> {
  const activity = getLeisureActivityById(activityId);

  if (!activity) {
    throw new PlanningGenerationError({
      code: "GENERATE_FAILED",
      userMessage: "Activité introuvable.",
      technicalDetails: `Unknown leisure activity ${activityId}`,
      step: "load",
    });
  }

  const planningContext = await loadPlanningContextForDate({ userId, date });

  if (!planningContext) {
    throw new PlanningGenerationError({
      code: "NO_HOUSEHOLD",
      userMessage: "Aucun foyer trouvé.",
      technicalDetails: "loadPlanningContextForDate returned null.",
      step: "load",
    });
  }

  const items = await loadCalendarItemsForDate({
    userId,
    householdId: planningContext.householdId,
    date,
  });

  const now = new Date();
  let startsAt: string;
  let endsAt: string;

  if (customStartTime) {
    startsAt = new Date(`${date}T${customStartTime}:00`).toISOString();
    endsAt = new Date(
      new Date(startsAt).getTime() + activity.durationMinutes * 60_000,
    ).toISOString();
  } else {
    const slot = computeNextFreeSlot(items, now);
    if (slot && slot.durationMinutes >= activity.durationMinutes) {
      startsAt = slot.startsAt;
      endsAt = new Date(
        new Date(startsAt).getTime() + activity.durationMinutes * 60_000,
      ).toISOString();
    } else {
      const fallback = new Date(now);
      fallback.setMinutes(fallback.getMinutes() + (5 - (fallback.getMinutes() % 5)), 0, 0);
      startsAt = fallback.toISOString();
      endsAt = new Date(
        fallback.getTime() + activity.durationMinutes * 60_000,
      ).toISOString();
    }
  }

  const hour = new Date(startsAt).getHours();
  const workoutSession =
    activity.category === "sport" && activity.sportType
      ? generateWorkoutSession({
          durationMinutes: activity.durationMinutes,
          sportType: activity.sportType as import("../ai/sportSessionGenerator").SportType,
          intensity: hour >= 20 ? "gentle" : "moderate",
          slotHour: hour,
          afterWorkEnergy: planningContext.profile.afterWorkEnergy,
        })
      : null;

  const payload = buildValidatedCalendarInsert({
    household_id: planningContext.householdId,
    user_id: userId,
    task_id: null,
    title: activity.title,
    item_type: activity.category === "sport" ? "task" : "event",
    starts_at: startsAt,
    ends_at: endsAt,
    locked: true,
    source: MANUAL_CONSTRAINT_SOURCE,
    details: {
      leisureActivityId: activity.id,
      leisureCategory: activity.category,
      visualType: activity.category === "sport" ? "sport" : "rest",
      activityType: activity.category === "sport" ? "sport" : "leisure",
      status: "accepted",
      modifiedByUser: true,
      explanation: activity.description,
      workoutSession: workoutSession ?? undefined,
      sourceReason: `Ajouté depuis l'espace Loisirs.`,
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

  await loadDisplayedDayPlan({ userId, date });

  return {
    explanation: `${activity.title} ajouté à ton planning.`,
  };
}
