import type { ConstraintType } from "../../types/planning";
import type { CalendarItemRecord } from "../../types/database";
import {
  isManualCalendarItemType,
  isMarginCalendarItem,
  mapCalendarItemTypeToPlannedBlockType,
} from "../../config/calendarItemTypes";
import {
  mapActivityTypeToVisualType,
  type ActivityType,
} from "../../config/activityTypes";
import { isManualCalendarSource } from "../../config/calendarSources";
import { rangesOverlap } from "../time/daySchedule";
import { computeEveningAvailableSlot, computeFreeSlotEntries } from "./freeSlotEntries";
import { mergeAdjacentFreeTimeBlocks } from "./mergeAdjacentFreeTimeBlocks";
import { isCancelledCalendarItem } from "./isCancelledCalendarItem";
import { formatFreeSlotTitle } from "./splitFreeSlots";
import { attachSportProposalsToTimeline } from "./sportProposalAttachment";
import {
  buildEveningOpportunityInput,
  resolveEveningOpportunity,
} from "../../ai/eveningOpportunityEngine";
import type { EveningPlanningMode } from "../../types/eveningPlanning";
import { DEFAULT_EVENING_PLANNING_MODE } from "../../types/eveningPlanning";
import { classifyCalendarItemActivity } from "./classifyCalendarItemActivity";
import { resolveBedWindDownEnd } from "../time/bedTime";
import type { PlanningContext } from "../../ai/memoryEngine";
import type { LifeContext } from "../../types/lifeContext";
import type { WorkoutSession } from "../../types/workoutSession";
import type { SportPreferences } from "../../types/sportPreferences";
import type { CompletionTiming } from "./evaluateCompletionTiming";
import type { CelebrationLevel } from "../../types/achievementFeedback";

export type TimelineSlotSuggestion = {
  id: string;
  category: string;
  title: string;
  description: string;
  durationMinutes: number;
  reason: string;
};

export type DayTimelineVisualType =
  | "wake"
  | "sleep"
  | "children_routine"
  | "work"
  | "commute"
  | "appointment"
  | "task"
  | "sport"
  | "rest"
  | "rest_day"
  | "vacation"
  | "travel"
  | "buffer"
  | "free";

export type DayTimelineBlockKind =
  | "structural"
  | "appointment"
  | "task"
  | "buffer"
  | "override"
  | "free_slot";

export type HabitSource =
  | "work_schedule"
  | "child_routine"
  | "morning_routine"
  | "evening_routine"
  | null;

export type DayTimelineEntry = {
  id: string;
  visualType: DayTimelineVisualType;
  title: string;
  startsAt: string;
  endsAt: string;
  locked: boolean;
  status?: string;
  explanation?: string;
  origin: "computed" | "persisted";
  blockKind: DayTimelineBlockKind;
  constraintType?: ConstraintType;
  calendarItemId?: string;
  habitSource?: HabitSource;
  completed?: boolean;
  completionStatusLabel?: string;
  completionTiming?: CompletionTiming;
  actualCompletedAt?: string;
  completionDeltaMinutes?: number;
  achievementMessage?: string;
  celebrationLevel?: CelebrationLevel;
  freedMinutes?: number;
  comment?: string;
  isEngineMargin?: boolean;
  activityType?: ActivityType;
  freeSlotKind?: "day" | "evening_available";
  eveningPlanned?: boolean;
  /** Séance persistée (calendar_items.details.workoutSession) */
  workoutSession?: WorkoutSession;
  /** Proposition sur créneau libre uniquement */
  proposedWorkoutSession?: WorkoutSession;
  /** Proposition principale facultative (non persistée) */
  primarySuggestion?: TimelineSlotSuggestion;
  sportClassification?: import("./classifyCalendarItemActivity").ClassifiedCalendarItemActivity;
};

export const DAY_TIMELINE_TYPE_LABELS: Record<DayTimelineVisualType, string> = {
  wake: "Réveil",
  sleep: "Sommeil",
  children_routine: "Routine enfants",
  work: "Travail",
  commute: "Trajet",
  appointment: "Rendez-vous",
  task: "Tâche",
  sport: "Sport",
  rest: "Repos",
  rest_day: "Repos",
  vacation: "Vacances",
  travel: "Déplacement",
  buffer: "Marge",
  free: "Temps libre",
};

export const MEAL_TIMELINE_LABELS = {
  breakfast: "Petit déjeuner",
  dinner: "Dîner",
};

function sortByStart(entries: DayTimelineEntry[]): DayTimelineEntry[] {
  return [...entries].sort(
    (a, b) =>
      new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );
}

function durationMinutes(startsAt: string, endsAt: string): number {
  return Math.round(
    (new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 60_000,
  );
}

export function mapConstraintTypeToVisualType(
  type: ConstraintType,
): DayTimelineVisualType {
  if (type === "wake") return "wake";
  if (type === "sleep") return "sleep";
  if (type === "morning_routine" || type === "evening_routine") {
    return "children_routine";
  }
  if (type === "personal_prep") return "buffer";
  if (type === "breakfast" || type === "dinner") return "rest";
  if (type === "work") return "work";
  if (type === "rest_day") return "rest_day";
  if (type === "day_banner") return "vacation";
  if (type === "commute_out" || type === "commute_in") return "commute";
  return "appointment";
}

function mapPersistedItemToVisualType(
  item: CalendarItemRecord,
): DayTimelineVisualType {
  const classification = classifyCalendarItemActivity(item);
  if (classification.visualType in DAY_TIMELINE_TYPE_LABELS) {
    return classification.visualType;
  }

  const details = item.details ?? {};

  if (
    typeof details.visualType === "string" &&
    details.visualType in DAY_TIMELINE_TYPE_LABELS
  ) {
    return details.visualType as DayTimelineVisualType;
  }

  if (typeof details.activityType === "string") {
    return mapActivityTypeToVisualType(details.activityType as ActivityType);
  }

  const blockType = mapCalendarItemTypeToPlannedBlockType(
    item.item_type,
    details,
  );

  if (blockType === "margin") return "free";
  if (blockType === "buffer") return "buffer";
  if (blockType === "task") {
    if (item.task_id && details.category === "sport") return "sport";
    return "task";
  }

  if (isManualCalendarItemType(item.item_type) || isManualCalendarSource(item.source)) {
    return "appointment";
  }

  return "appointment";
}

function inferHabitSource(type: ConstraintType): HabitSource {
  if (type === "work" || type === "commute_out" || type === "commute_in") {
    return "work_schedule";
  }

  if (type === "morning_routine" || type === "evening_routine") {
    return type === "morning_routine" ? "morning_routine" : "evening_routine";
  }

  return null;
}

function constraintToTimelineEntry(constraint: {
  id: string;
  type: ConstraintType;
  title: string;
  startsAt: string;
  endsAt: string;
  locked: boolean;
  incompleteReason?: string;
}): DayTimelineEntry {
  return {
    id: constraint.id,
    visualType: mapConstraintTypeToVisualType(constraint.type),
    title: constraint.title,
    startsAt: constraint.startsAt,
    endsAt: constraint.endsAt,
    locked: constraint.locked,
    explanation: constraint.incompleteReason,
    origin: "computed",
    blockKind: "structural",
    constraintType: constraint.type,
    habitSource: inferHabitSource(constraint.type),
  };
}

export function persistedItemToTimelineEntry(
  item: CalendarItemRecord,
): DayTimelineEntry {
  const details = item.details ?? {};
  const classification = classifyCalendarItemActivity(item);
  const blockType = mapCalendarItemTypeToPlannedBlockType(
    item.item_type,
    details,
  );
  const visualType = mapPersistedItemToVisualType(item);
  const isStudyRevision =
    details.businessType === "study" ||
    details.activityType === "revision" ||
    details.suggestionType === "study";

  let blockKind: DayTimelineBlockKind = "appointment";
  if (blockType === "task") blockKind = classification.isSport ? "task" : "task";
  if (blockType === "buffer") blockKind = "buffer";
  if (blockType === "margin") blockKind = "free_slot";
  if (details.modifiedByUser) blockKind = "override";
  if (classification.isSport) blockKind = "task";

  const isEngineMargin = isMarginCalendarItem(item) && item.source !== "user";
  const workoutSession =
    details.workoutSession && typeof details.workoutSession === "object"
      ? (details.workoutSession as WorkoutSession)
      : undefined;

  return {
    id: item.id,
    visualType: isStudyRevision ? "task" : visualType,
    title: isStudyRevision ? "Révision" : item.title,
    startsAt: item.starts_at,
    endsAt: item.ends_at,
    locked: item.locked,
    status:
      typeof details.status === "string" ? details.status : undefined,
    explanation:
      item.source === "calendar_sync"
        ? "Événement importé depuis Google Calendar"
        : typeof details.explanation === "string"
          ? details.explanation
          : undefined,
    origin: "persisted",
    blockKind,
    calendarItemId: item.id,
    completed: details.status === "completed",
    completionStatusLabel:
      typeof details.completion_status_label === "string"
        ? details.completion_status_label
        : undefined,
    completionTiming:
      typeof details.completion_timing === "string"
        ? (details.completion_timing as DayTimelineEntry["completionTiming"])
        : undefined,
    actualCompletedAt:
      typeof details.actual_completed_at === "string"
        ? details.actual_completed_at
        : undefined,
    completionDeltaMinutes:
      typeof details.completion_delta_minutes === "number"
        ? details.completion_delta_minutes
        : undefined,
    achievementMessage:
      typeof details.achievement_message === "string"
        ? details.achievement_message
        : undefined,
    celebrationLevel:
      typeof details.celebration_level === "string"
        ? (details.celebration_level as DayTimelineEntry["celebrationLevel"])
        : undefined,
    freedMinutes:
      typeof details.freed_minutes === "number" ? details.freed_minutes : undefined,
    comment:
      typeof details.comment === "string" ? details.comment : undefined,
    habitSource:
      typeof details.constraintType === "string" &&
      details.constraintType !== "appointment"
        ? inferHabitSource(details.constraintType as ConstraintType)
        : null,
    isEngineMargin,
    activityType:
      classification.isSport
        ? "sport"
        : isStudyRevision
          ? ("revision" as ActivityType)
          : typeof details.activityType === "string"
            ? (details.activityType as ActivityType)
            : undefined,
    proposedWorkoutSession: undefined,
    workoutSession,
    sportClassification: classification,
  };
}

function isDuplicateEntry(
  candidate: DayTimelineEntry,
  existing: DayTimelineEntry,
): boolean {
  if (candidate.id === existing.id) {
    return true;
  }

  if (
    candidate.origin === "persisted" &&
    existing.origin === "computed" &&
    candidate.visualType === "appointment" &&
    existing.visualType === "appointment" &&
    rangesOverlap(
      candidate.startsAt,
      candidate.endsAt,
      existing.startsAt,
      existing.endsAt,
    )
  ) {
    return true;
  }

  if (
    candidate.visualType === existing.visualType &&
    candidate.title === existing.title &&
    candidate.startsAt === existing.startsAt &&
    candidate.endsAt === existing.endsAt
  ) {
    return true;
  }

  return false;
}

export function dedupeTimelineEntries(
  entries: DayTimelineEntry[],
): DayTimelineEntry[] {
  const deduped: DayTimelineEntry[] = [];

  for (const entry of sortByStart(entries)) {
    const duplicateIndex = deduped.findIndex((existing) =>
      isDuplicateEntry(entry, existing),
    );

    if (duplicateIndex === -1) {
      deduped.push(entry);
      continue;
    }

    if (entry.origin === "persisted" && deduped[duplicateIndex].origin === "computed") {
      deduped[duplicateIndex] = entry;
    }
  }

  return deduped;
}

export function buildDisplayedDayTimeline({
  constraints,
  persistedItems,
  adultBedTime,
  date,
  lifeContext,
  planningContext,
  eveningPlanningMode = DEFAULT_EVENING_PLANNING_MODE,
  sportPreferences,
  sportProposalOverrides,
}: {
  constraints: Array<{
    id: string;
    type: ConstraintType;
    title: string;
    startsAt: string;
    endsAt: string;
    locked: boolean;
    incompleteReason?: string;
  }>;
  persistedItems: CalendarItemRecord[];
  adultBedTime?: string | null;
  date?: string;
  lifeContext?: LifeContext;
  planningContext?: PlanningContext;
  eveningPlanningMode?: EveningPlanningMode;
  sportPreferences?: SportPreferences;
  sportProposalOverrides?: Record<string, WorkoutSession>;
}): DayTimelineEntry[] {
  const displayableItems = persistedItems.filter(
    (item) => !isMarginCalendarItem(item) && !isCancelledCalendarItem(item),
  );

  const computedEntries = constraints.map((constraint) => {
    const entry = constraintToTimelineEntry(constraint);

    if (constraint.type === "day_banner") {
      if (constraint.title === "Déplacement") {
        return { ...entry, visualType: "travel" as const };
      }
      return { ...entry, visualType: "vacation" as const };
    }

    return entry;
  });
  const persistedEntries = displayableItems.map(persistedItemToTimelineEntry);
  const occupied = dedupeTimelineEntries([
    ...computedEntries,
    ...persistedEntries,
  ]);

  const wake = occupied.find((entry) => entry.visualType === "wake");
  const sleep = occupied.find((entry) => entry.visualType === "sleep");

  if (!wake || !sleep) {
    return occupied;
  }

  const targetDate = date ?? wake.startsAt.slice(0, 10);
  const eveningSlot =
    adultBedTime && targetDate
      ? computeEveningAvailableSlot({
          occupiedEntries: occupied,
          adultBedTime,
          date: targetDate,
        })
      : null;

  const dayEnd =
    eveningSlot?.endsAt ??
    (adultBedTime && targetDate
      ? resolveBedWindDownEnd({
          date: targetDate,
          bedTime: adultBedTime,
        })
      : sleep.startsAt);

  const freeSlots = computeFreeSlotEntries({
    occupiedEntries: occupied,
    dayStart: wake.startsAt,
    dayEnd,
    eveningSlot,
  });

  let eveningEnrichment: Partial<DayTimelineEntry> | null = null;

  if (eveningSlot && lifeContext && planningContext) {
    const opportunity = resolveEveningOpportunity(
      buildEveningOpportunityInput({
        eveningStart: eveningSlot.startsAt,
        eveningEnd: eveningSlot.endsAt,
        context: planningContext,
        lifeContext,
        eveningPlanningMode,
      }),
    );

    const primaryBlock = opportunity.blocks.find(
      (block) =>
        block.suggested &&
        block.type !== "keep_free" &&
        block.type !== "wind_down",
    );

    const eveningMinutes = Math.round(
      (new Date(eveningSlot.endsAt).getTime() -
        new Date(eveningSlot.startsAt).getTime()) /
        60_000,
    );

    eveningEnrichment = {
      title: formatFreeSlotTitle(eveningSlot.startsAt, eveningSlot.endsAt),
      explanation: primaryBlock
        ? `Tu as ${Math.floor(eveningMinutes / 60) > 0 ? `${Math.floor(eveningMinutes / 60)} h disponibles` : `${eveningMinutes} min disponibles`} ce soir. ${primaryBlock.reason}`
        : opportunity.summary,
      primarySuggestion: primaryBlock
        ? {
            id: primaryBlock.id,
            category: primaryBlock.type,
            title:
              primaryBlock.type === "couple"
                ? "Moment en couple — soirée disponible"
                : primaryBlock.title,
            description: primaryBlock.reason,
            durationMinutes: primaryBlock.durationMinutes,
            reason: primaryBlock.reason,
          }
        : undefined,
    };
  } else if (eveningSlot) {
    eveningEnrichment = {
      title: formatFreeSlotTitle(eveningSlot.startsAt, eveningSlot.endsAt),
    };
  }

  const enrichedFreeSlots = freeSlots.map((slot) => {
    if (slot.freeSlotKind !== "evening_available" || !eveningEnrichment) {
      return slot;
    }

    const eveningSegments = freeSlots.filter(
      (candidate) => candidate.freeSlotKind === "evening_available",
    );
    const primaryEvening = [...eveningSegments].sort(
      (a, b) =>
        durationMinutes(b.startsAt, b.endsAt) -
        durationMinutes(a.startsAt, a.endsAt),
    )[0];

    if (primaryEvening?.id !== slot.id) {
      return slot;
    }

    return { ...slot, ...eveningEnrichment };
  });

  const mergedEntries = mergeAdjacentFreeTimeBlocks(
    dedupeTimelineEntries([...occupied, ...enrichedFreeSlots]),
  );

  return attachSportProposalsToTimeline({
    entries: mergedEntries,
    planningContext,
    lifeContext,
    preferences: sportPreferences,
    proposalOverrides: sportProposalOverrides,
  });
}

export function getNextTimelineEntry(
  entries: DayTimelineEntry[],
  now: Date = new Date(),
): DayTimelineEntry | null {
  const nowMs = now.getTime();

  return (
    sortByStart(entries).find(
      (entry) => new Date(entry.endsAt).getTime() > nowMs,
    ) ?? null
  );
}

export function hasGeneratedPlanning(entries: DayTimelineEntry[]): boolean {
  return entries.some(
    (entry) =>
      entry.origin === "persisted" &&
      (entry.visualType === "task" ||
        entry.visualType === "buffer" ||
        entry.visualType === "free"),
  );
}
