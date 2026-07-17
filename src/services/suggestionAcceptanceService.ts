import { supabase } from "../lib/supabase/client";
import { buildValidatedCalendarInsert } from "../lib/calendar/validateCalendarInsert";
import { MANUAL_CONSTRAINT_SOURCE } from "../config/calendarSources";
import type { DayTimelineEntry } from "../lib/planning/displayedDayTimeline";
import { formatTimeRangeLabel } from "../lib/planning/freeSlotEntries";
import { validateStudyRevisionDuration } from "../lib/planning/resolveStudyRevisionDuration";
import type { FreeTimeSuggestion } from "../types/freeTimeSuggestion";
import type { CalendarItemRecord } from "../types/database";
import {
  deleteAutoProposalsForDate,
  generateAndSaveDayPlan,
  loadDisplayedDayPlan,
} from "./planningService";
import { loadPlanningContextForDate } from "./memoryContextService";
import { addLeisureActivityToPlanning } from "./leisurePlanningService";
import { PlanningGenerationError } from "../types/planningGenerationError";

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

function resolveSlotMinutes(entry: DayTimelineEntry): number {
  return Math.round(
    (new Date(entry.endsAt).getTime() - new Date(entry.startsAt).getTime()) /
      60_000,
  );
}

function resolveStudyTitle(suggestion: FreeTimeSuggestion): string {
  if (suggestion.studyProgress?.taskTitle && !suggestion.studyProgress.isFreeRevision) {
    return suggestion.studyProgress.taskTitle;
  }
  return "Révision";
}

async function acceptStudyRevisionSuggestion({
  userId,
  date,
  entry,
  suggestion,
  content,
  planningContext,
}: {
  userId: string;
  date: string;
  entry: DayTimelineEntry;
  suggestion: FreeTimeSuggestion;
  content?: Record<string, unknown>;
  planningContext: NonNullable<Awaited<ReturnType<typeof loadPlanningContextForDate>>>;
}): Promise<{
  explanation: string;
  timeline: DayTimelineEntry[];
  insertedItem: CalendarItemRecord;
}> {
  const slotMinutes = resolveSlotMinutes(entry);
  const chosenDuration =
    typeof content?.chosenDurationMinutes === "number"
      ? content.chosenDurationMinutes
      : suggestion.recommendedDuration || 30;

  const validation = validateStudyRevisionDuration(chosenDuration, slotMinutes);
  if (!validation.valid) {
    throw new PlanningGenerationError({
      code: "GENERATE_FAILED",
      userMessage: validation.message ?? "Durée de révision invalide.",
      technicalDetails: `invalid study duration ${chosenDuration}`,
      step: "generate",
    });
  }

  const taskId =
    typeof content?.taskId === "string"
      ? content.taskId
      : typeof suggestion.optionalContent?.taskId === "string"
        ? suggestion.optionalContent.taskId
        : null;

  const startsAt = entry.startsAt;
  const endsAt = new Date(
    new Date(startsAt).getTime() + chosenDuration * 60_000,
  ).toISOString();

  const weeklyGoalMinutes = suggestion.studyProgress?.weeklyGoalMinutes ?? 0;

  const payload = buildValidatedCalendarInsert({
    household_id: planningContext.householdId,
    user_id: userId,
    task_id: taskId,
    title: resolveStudyTitle(suggestion),
    item_type: "task",
    starts_at: startsAt,
    ends_at: endsAt,
    locked: true,
    source: MANUAL_CONSTRAINT_SOURCE,
    details: {
      suggestionType: "study",
      businessType: "study",
      activityType: "revision",
      plannedDurationMinutes: chosenDuration,
      weeklyGoalMinutes,
      studyTaskId: taskId,
      userAccepted: true,
      generatedContent: content ?? suggestion.optionalContent,
      sourceReason: suggestion.reason,
      originalFreeSlot: {
        startsAt: entry.startsAt,
        endsAt: entry.endsAt,
      },
      visualType: "task",
      status: "accepted",
      modifiedByUser: true,
      explanation: suggestion.description,
    },
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
      error: error ?? { message: "No row returned" },
      step: "save",
    });
  }

  await deleteAutoProposalsForDate({
    householdId: planningContext.householdId,
    userId,
    date,
  });

  const displayed = await loadDisplayedDayPlan({ userId, date });
  const timeLabel = formatTimeRangeLabel(startsAt, endsAt);

  return {
    explanation: `Révision ajoutée de ${timeLabel}.`,
    timeline: displayed?.timeline ?? [],
    insertedItem: data as CalendarItemRecord,
  };
}

export async function acceptFreeTimeSuggestion({
  userId,
  date,
  entry,
  suggestion,
  content,
}: {
  userId: string;
  date: string;
  entry: DayTimelineEntry;
  suggestion: FreeTimeSuggestion;
  content?: Record<string, unknown>;
}): Promise<{
  explanation: string;
  timeline: DayTimelineEntry[];
}> {
  if (suggestion.action === "keep_free") {
    return {
      explanation: "Ce temps libre est conservé sans activité ajoutée.",
      timeline: [],
    };
  }

  if (suggestion.action === "add_leisure") {
    const activityId =
      typeof suggestion.optionalContent?.leisureActivityId === "string"
        ? suggestion.optionalContent.leisureActivityId
        : typeof content?.leisureActivityId === "string"
          ? content.leisureActivityId
          : null;

    if (!activityId) {
      throw new PlanningGenerationError({
        code: "GENERATE_FAILED",
        userMessage: "Activité loisir introuvable.",
        technicalDetails: "Missing leisureActivityId",
        step: "load",
      });
    }

    const result = await addLeisureActivityToPlanning({
      userId,
      date,
      activityId,
    });
    const displayed = await loadDisplayedDayPlan({ userId, date });
    return {
      explanation: result.explanation,
      timeline: displayed?.timeline ?? [],
    };
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

  if (suggestion.type === "study") {
    try {
      return await acceptStudyRevisionSuggestion({
        userId,
        date,
        entry,
        suggestion,
        content,
        planningContext,
      });
    } catch (error) {
      if (error instanceof PlanningGenerationError) {
        throw new PlanningGenerationError({
          ...error,
          userMessage: `Je n'ai pas pu ajouter la révision : ${error.userMessage}`,
        });
      }
      throw error;
    }
  }

  const duration = suggestion.recommendedDuration || 30;
  const startsAt = entry.startsAt;
  const endsAt = new Date(
    new Date(startsAt).getTime() + duration * 60_000,
  ).toISOString();

  const itemType = suggestion.type === "sport" ? "task" : "event";

  const payload = buildValidatedCalendarInsert({
    household_id: planningContext.householdId,
    user_id: userId,
    task_id:
      typeof content?.taskId === "string"
        ? content.taskId
        : typeof suggestion.optionalContent?.taskId === "string"
          ? suggestion.optionalContent.taskId
          : null,
    title: suggestion.title,
    item_type: itemType,
    starts_at: startsAt,
    ends_at: endsAt,
    locked: true,
    source: MANUAL_CONSTRAINT_SOURCE,
    details: {
      suggestionType: suggestion.type,
      businessType: undefined,
      activityType:
        suggestion.type === "sport"
          ? "sport"
          : suggestion.type,
      plannedDurationMinutes: duration,
      userAccepted: true,
      generatedContent: content ?? suggestion.optionalContent,
      workoutSession:
        content?.workoutSession && typeof content.workoutSession === "object"
          ? content.workoutSession
          : undefined,
      sourceReason: suggestion.reason,
      originalFreeSlot: {
        startsAt: entry.startsAt,
        endsAt: entry.endsAt,
      },
      visualType:
        suggestion.type === "sport"
          ? "sport"
          : suggestion.type === "spiritual"
            ? "rest"
            : "appointment",
      status: "accepted",
      modifiedByUser: true,
      explanation: suggestion.description,
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

  const displayed = await loadDisplayedDayPlan({ userId, date });

  return {
    explanation: `${suggestion.title} ajouté à ta journée. ${suggestion.reason}`,
    timeline: displayed?.timeline ?? [],
  };
}
