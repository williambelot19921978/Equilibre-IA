import { classifyCalendarItemActivity } from "./classifyCalendarItemActivity";
import type { CalendarItemRecord } from "../../types/database";
import type { TaskActivityEventRecord } from "../../types/taskActivity";
import { overlapsLocalDay } from "../time/dayBounds";
import { resolveWorkoutCompletionForDate } from "./hasCompletedWorkoutForDate";
import {
  ACTIVITY_REPEAT_RULES,
  mapProposalCategoryToRepeatKey,
  type ActivityCategoryKey,
} from "../../config/activityRepeatRules";
import type { LifeProposalCategory } from "../../types/lifeContext";

export type DailyActivityCompletionState = {
  workoutDone: boolean;
  studyDone: boolean;
  spiritualDone: boolean;
  familyTimeDone: boolean;
  coupleTimeDone: boolean;
  restDone: boolean;
  priorityTaskDone: boolean;
};

export type DailyActivityUsage = DailyActivityCompletionState & {
  sportAutomaticCount: number;
  studyCount: number;
  lastStudyAt: string | null;
  readingCount: number;
  calmCount: number;
  lastCalmAt: string | null;
  spiritualCount: number;
  coupleCount: number;
  familyCount: number;
  leisureCount: number;
  restCount: number;
};

function isCompletedItem(item: CalendarItemRecord): boolean {
  const details = item.details ?? {};
  return details.status === "completed" || typeof details.actual_completed_at === "string";
}

function itemMatchesCategory(
  item: CalendarItemRecord,
  categories: string[],
): boolean {
  const details = item.details ?? {};
  const classification = classifyCalendarItemActivity(item);

  if (categories.includes("sport") && classification.isSport) return true;
  if (categories.includes("study")) {
    if (details.businessType === "study") return true;
    if (details.activityType === "revision") return true;
    if (details.suggestionType === "study") return true;
    if (details.activityType === "task" && /révis|étude|study/i.test(item.title)) {
      return true;
    }
  }
  if (categories.includes("reading")) {
    if (details.suggestionType === "reading") return true;
    if (/lecture|reading/i.test(item.title)) return true;
  }
  if (categories.includes("spiritual")) {
    if (details.suggestionType === "spiritual") return true;
    if (classification.activityCategory === "spiritual") return true;
  }
  if (categories.includes("family")) {
    if (details.suggestionType === "family" || details.suggestionType === "family_outing") {
      return true;
    }
  }
  if (categories.includes("couple")) {
    if (details.eveningType === "couple" || /couple|en couple/i.test(item.title)) {
      return true;
    }
  }
  if (categories.includes("rest")) {
    if (classification.activityCategory === "rest") return true;
    if (/repos|calme|détente/i.test(item.title)) return true;
  }
  if (categories.includes("leisure")) {
    if (details.suggestionType === "leisure" || details.leisureActivityId) return true;
  }

  return false;
}

function countCategory(items: CalendarItemRecord[], categories: string[]): number {
  return items.filter((item) => itemMatchesCategory(item, categories)).length;
}

function lastCompletedAt(
  items: CalendarItemRecord[],
  categories: string[],
): string | null {
  const matches = items
    .filter((item) => isCompletedItem(item) && itemMatchesCategory(item, categories))
    .sort(
      (a, b) =>
        new Date(String(b.details?.actual_completed_at ?? b.ends_at)).getTime() -
        new Date(String(a.details?.actual_completed_at ?? a.ends_at)).getTime(),
    );
  const latest = matches[0];
  if (!latest) return null;
  return (
    (typeof latest.details?.actual_completed_at === "string"
      ? latest.details.actual_completed_at
      : latest.ends_at) ?? null
  );
}

export function resolveDailyActivityUsage({
  userId,
  date,
  calendarItems,
  taskActivityEvents = [],
}: {
  userId: string;
  date: string;
  calendarItems: CalendarItemRecord[];
  taskActivityEvents?: TaskActivityEventRecord[];
}): DailyActivityUsage {
  const dayItems = calendarItems.filter((item) =>
    overlapsLocalDay({ startsAt: item.starts_at, endsAt: item.ends_at, date }),
  );
  const completedItems = dayItems.filter(isCompletedItem);
  const plannedSportItems = dayItems.filter(
    (item) =>
      classifyCalendarItemActivity(item).isSport &&
      !isCompletedItem(item) &&
      (item.source === "ai" || item.details?.autoProposedSport === true),
  );

  const workout = resolveWorkoutCompletionForDate({
    userId,
    date,
    calendarItems,
    taskActivityEvents,
  });

  const studyCount = countCategory(dayItems, ["study"]);
  const calmCount = countCategory(dayItems, ["rest"]);

  return {
    workoutDone: workout.workoutCompletedToday,
    studyDone: studyCount > 0 && completedItems.some((item) => itemMatchesCategory(item, ["study"])),
    spiritualDone: completedItems.some((item) => itemMatchesCategory(item, ["spiritual"])),
    familyTimeDone: completedItems.some((item) => itemMatchesCategory(item, ["family"])),
    coupleTimeDone: completedItems.some((item) => itemMatchesCategory(item, ["couple"])),
    restDone: completedItems.some((item) => itemMatchesCategory(item, ["rest"])),
    priorityTaskDone: completedItems.some(
      (item) =>
        item.task_id &&
        (item.details?.priority === "high" ||
          (typeof item.details?.priorityLevel === "string" &&
            item.details.priorityLevel === "high")),
    ),
    sportAutomaticCount:
      (workout.workoutCompletedToday ? 1 : 0) + plannedSportItems.length,
    studyCount,
    lastStudyAt: lastCompletedAt(completedItems, ["study"]),
    readingCount: countCategory(dayItems, ["reading"]),
    calmCount,
    lastCalmAt: lastCompletedAt(completedItems, ["rest"]),
    spiritualCount: countCategory(dayItems, ["spiritual"]),
    coupleCount: countCategory(dayItems, ["couple"]),
    familyCount: countCategory(dayItems, ["family"]),
    leisureCount: countCategory(dayItems, ["leisure"]),
    restCount: calmCount,
  };
}

export function resolveDailyActivityCompletionState(
  input: Parameters<typeof resolveDailyActivityUsage>[0],
): DailyActivityCompletionState {
  const usage = resolveDailyActivityUsage(input);
  return {
    workoutDone: usage.workoutDone,
    studyDone: usage.studyDone,
    spiritualDone: usage.spiritualDone,
    familyTimeDone: usage.familyTimeDone,
    coupleTimeDone: usage.coupleTimeDone,
    restDone: usage.restDone,
    priorityTaskDone: usage.priorityTaskDone,
  };
}

function usageCountForCategory(
  category: ActivityCategoryKey,
  usage: DailyActivityUsage,
): number {
  switch (category) {
    case "sport":
      return usage.sportAutomaticCount;
    case "study":
      return usage.studyCount;
    case "reading":
      return usage.readingCount;
    case "calm":
    case "rest":
      return usage.calmCount;
    case "spiritual":
      return usage.spiritualCount;
    case "couple":
      return usage.coupleCount;
    case "family":
    case "outing":
      return usage.familyCount;
    case "leisure":
      return usage.leisureCount;
    default:
      return 0;
  }
}

function lastActivityAt(
  category: ActivityCategoryKey,
  usage: DailyActivityUsage,
): string | null {
  if (category === "study") return usage.lastStudyAt;
  if (category === "calm" || category === "rest") return usage.lastCalmAt;
  return null;
}

export function canProposeCategoryAutomatically({
  category,
  usage,
  slotStartsAt,
}: {
  category: LifeProposalCategory;
  usage: DailyActivityUsage;
  slotStartsAt?: string;
}): boolean {
  const key = mapProposalCategoryToRepeatKey(category);
  const rule = ACTIVITY_REPEAT_RULES[key];

  if (key === "keep_free") return true;

  if (key === "sport") {
    if (usage.workoutDone) return false;
    if (rule.automaticDailyLimit !== null && usage.sportAutomaticCount >= rule.automaticDailyLimit) {
      return false;
    }
    return true;
  }

  if (rule.automaticDailyLimit !== null) {
    if (usageCountForCategory(key, usage) >= rule.automaticDailyLimit) {
      return false;
    }
  }

  if (rule.minGapMinutes && slotStartsAt) {
    const previousAt = lastActivityAt(key, usage);
    if (previousAt) {
      const gapMinutes =
        (new Date(slotStartsAt).getTime() - new Date(previousAt).getTime()) / 60_000;
      if (gapMinutes >= 0 && gapMinutes < rule.minGapMinutes) {
        return false;
      }
    }
  }

  return true;
}

/** @deprecated Prefer canProposeCategoryAutomatically with usage counts */
export function isProposalCategorySatisfied(
  category: string,
  state: DailyActivityCompletionState,
): boolean {
  switch (category) {
    case "sport":
      return state.workoutDone;
    default:
      return false;
  }
}
