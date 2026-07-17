import { buildValidatedCalendarInsert } from "../lib/calendar/validateCalendarInsert";
import { MANUAL_CONSTRAINT_SOURCE } from "../config/calendarSources";
import { supabase } from "../lib/supabase/client";
import { PlanningGenerationError } from "../types/planningGenerationError";
import type { WorkoutSession } from "../types/workoutSession";
import type { DayTimelineEntry } from "../lib/planning/displayedDayTimeline";
import { recordTaskActivityEvent } from "./taskActivityEventService";
import {
  deleteAutoProposalsForDate,
  generateAndSaveDayPlan,
  loadDisplayedDayPlan,
} from "./planningService";
import { loadPlanningContextForDate } from "./memoryContextService";
import { getCurrentHouseholdId } from "./householdService";

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

export async function acceptSportProposal({
  userId,
  date,
  entry,
  session,
}: {
  userId: string;
  date: string;
  entry: DayTimelineEntry;
  session: WorkoutSession;
}): Promise<{ explanation: string; timeline: DayTimelineEntry[] }> {
  const planningContext = await loadPlanningContextForDate({ userId, date });

  if (!planningContext) {
    throw new PlanningGenerationError({
      code: "NO_HOUSEHOLD",
      userMessage: "Aucun foyer trouvé.",
      technicalDetails: "loadPlanningContextForDate returned null.",
      step: "load",
    });
  }

  const householdId = await getCurrentHouseholdId(userId);
  const durationMs = session.durationMinutes * 60_000;
  const startsAt = entry.startsAt;
  const endsAt = new Date(new Date(startsAt).getTime() + durationMs).toISOString();

  const payload = buildValidatedCalendarInsert({
    household_id: householdId,
    user_id: userId,
    task_id: null,
    title: session.title,
    item_type: "task",
    starts_at: startsAt,
    ends_at: endsAt,
    locked: true,
    source: MANUAL_CONSTRAINT_SOURCE,
    details: {
      visualType: "sport",
      activityType: "sport",
      category: "sport",
      status: "accepted",
      modifiedByUser: true,
      explanation: session.generatedReason,
      workoutSession: session,
      sportProposalAccepted: true,
      sourceReason: session.generatedReason,
    },
    updated_at: new Date().toISOString(),
  });

  const { data, error } = await supabase
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

  await recordTaskActivityEvent({
    userId,
    eventType: "planned",
    calendarItemId: data.id,
    metadata: {
      sportSessionId: session.id,
      sessionType: session.type,
      level: session.level,
      accepted: true,
    },
  });

  await deleteAutoProposalsForDate({ householdId, userId, date });

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

  const displayed = await loadDisplayedDayPlan({ userId, date });

  return {
    explanation: `${session.title} ajoutée à ton planning.`,
    timeline: displayed?.timeline ?? [],
  };
}

export async function completeSportSession({
  userId,
  entry,
  session,
}: {
  userId: string;
  entry: DayTimelineEntry;
  session: WorkoutSession;
}): Promise<void> {
  if (!entry.calendarItemId) return;

  const { data: existing } = await supabase
    .from("calendar_items")
    .select("details")
    .eq("id", entry.calendarItemId)
    .maybeSingle();

  await supabase
    .from("calendar_items")
    .update({
      details: {
        ...(existing?.details ?? {}),
        workoutSession: session,
        status: "completed",
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", entry.calendarItemId);

  await recordTaskActivityEvent({
    userId,
    eventType: "completed",
    calendarItemId: entry.calendarItemId,
    metadata: {
      sportSessionId: session.id,
      sessionType: session.type,
    },
  });
}
