import type { DayTimelineEntry } from "../lib/planning/displayedDayTimeline";
import { generateProactiveInsights } from "../lib/proactiveEngine/generateProactiveInsights";
import type {
  DayAnalysisInput,
  ProactiveAnalysisResult,
  ScheduledDayItem,
} from "../lib/proactiveEngine/types";
import { minutesBetween } from "../lib/proactiveEngine/timeUtils";
import type { CalendarItemRecord, ProfileFactRecord, TaskRecord } from "../types";
import { supabase } from "../lib/supabase/client";
import { formatSupabaseError } from "../lib/supabase/formatError";
import { getCurrentHouseholdId } from "./householdService";

export type BuildDayAnalysisInputParams = {
  date: string;
  timeline: DayTimelineEntry[];
  items?: CalendarItemRecord[];
  tasksById?: Map<string, Pick<TaskRecord, "id" | "skip_count" | "priority">>;
  profileFacts?: ProfileFactRecord[];
};

const TASKS_TABLE = "tasks";

function mapVisualTypeToCategory(entry: DayTimelineEntry): string {
  switch (entry.visualType) {
    case "sleep":
    case "wake":
      return "structural";
    case "sport":
      return "sport";
    case "work":
      return "work";
    case "commute":
    case "travel":
      return "travel";
    case "children_routine":
      return "children";
    case "rest":
    case "rest_day":
    case "buffer":
    case "free":
      return "free";
    case "task":
      return "task";
    default:
      return entry.activityType ?? entry.visualType;
  }
}

function mapPriority(priority: number | undefined): string | null {
  if (priority == null) return null;
  if (priority >= 3) return "high";
  if (priority >= 2) return "medium";
  return "low";
}

function resolveSleepHours(timeline: DayTimelineEntry[]): number | null {
  const sleepEntry = timeline.find((entry) => entry.visualType === "sleep");
  const wakeEntry = timeline.find((entry) => entry.visualType === "wake");
  if (!sleepEntry || !wakeEntry) return null;

  const sleepStart = Date.parse(sleepEntry.startsAt);
  const wakeStart = Date.parse(wakeEntry.startsAt);
  if (!Number.isFinite(sleepStart) || !Number.isFinite(wakeStart)) return null;

  let durationMs = wakeStart - sleepStart;
  if (durationMs <= 0) {
    durationMs += 24 * 60 * 60 * 1000;
  }

  return Math.round((durationMs / (60 * 60 * 1000)) * 10) / 10;
}

function sumMinutesByCategory(
  timeline: DayTimelineEntry[],
  categories: string[],
): number {
  return timeline.reduce((sum, entry) => {
    const category = mapVisualTypeToCategory(entry);
    if (!categories.includes(category)) return sum;
    return sum + minutesBetween(entry.startsAt, entry.endsAt);
  }, 0);
}

function buildScheduledItems({
  timeline,
  items,
  tasksById,
}: Pick<BuildDayAnalysisInputParams, "timeline" | "items" | "tasksById">): ScheduledDayItem[] {
  const itemByCalendarId = new Map(
    (items ?? []).map((item) => [item.id, item]),
  );

  return timeline
    .filter(
      (entry) =>
        entry.blockKind !== "free_slot" &&
        entry.visualType !== "wake" &&
        entry.visualType !== "free",
    )
    .map((entry) => {
      const calendarItem = entry.calendarItemId
        ? itemByCalendarId.get(entry.calendarItemId)
        : undefined;
      const task =
        calendarItem?.task_id && tasksById
          ? tasksById.get(calendarItem.task_id)
          : undefined;

      return {
        id: entry.calendarItemId ?? entry.id,
        title: entry.title,
        category: mapVisualTypeToCategory(entry),
        startsAt: entry.startsAt,
        endsAt: entry.endsAt,
        status: entry.status ?? calendarItem?.details?.status ?? null,
        priority: task ? mapPriority(task.priority) : null,
        postponementCount: task?.skip_count ?? 0,
      };
    });
}

function extractUserPreferences(
  profileFacts: ProfileFactRecord[] | undefined,
): DayAnalysisInput["userPreferences"] {
  if (!profileFacts?.length) return undefined;

  const sleepFact = profileFacts.find((fact) => fact.fact_key === "sleep_hours");
  const minimumSleep =
    typeof sleepFact?.fact_value?.value === "number"
      ? sleepFact.fact_value.value
      : undefined;

  return {
    minimumSleepHours: minimumSleep,
  };
}

export function buildDayAnalysisInput(
  params: BuildDayAnalysisInputParams,
): DayAnalysisInput {
  const { date, timeline, items, tasksById, profileFacts } = params;

  const scheduledItems = buildScheduledItems({ timeline, items, tasksById });
  const sleepHours = resolveSleepHours(timeline);

  const sportMinutes = sumMinutesByCategory(timeline, ["sport"]);
  const studyMinutes = sumMinutesByCategory(timeline, ["study"]);
  const workMinutes = sumMinutesByCategory(timeline, ["work"]);
  const childcareMinutes = sumMinutesByCategory(timeline, ["children"]);
  const travelMinutes = sumMinutesByCategory(timeline, ["travel", "commute"]);
  const personalTimeMinutes = sumMinutesByCategory(timeline, ["free", "rest", "leisure"]);

  return {
    date,
    scheduledItems,
    sleep: sleepHours != null ? { plannedHours: sleepHours } : undefined,
    personalTimeMinutes,
    sportMinutes,
    studyMinutes,
    workMinutes,
    childcareMinutes,
    travelMinutes,
    userPreferences: extractUserPreferences(profileFacts),
  };
}

export function analyzeDayProactively(input: DayAnalysisInput): ProactiveAnalysisResult {
  return generateProactiveInsights(input);
}

export async function loadTaskSkipCountsByIds(
  userId: string,
  taskIds: string[],
): Promise<Map<string, Pick<TaskRecord, "id" | "skip_count" | "priority">>> {
  const map = new Map<string, Pick<TaskRecord, "id" | "skip_count" | "priority">>();
  if (taskIds.length === 0) return map;

  const householdId = await getCurrentHouseholdId(userId);
  const { data, error } = await supabase
    .from(TASKS_TABLE)
    .select("id, skip_count, priority")
    .eq("household_id", householdId)
    .in("id", taskIds);

  if (error) {
    throw formatSupabaseError({ table: TASKS_TABLE, operation: "SELECT", error });
  }

  for (const task of data ?? []) {
    map.set(task.id, task);
  }

  return map;
}

export function collectTaskIdsFromItems(items: CalendarItemRecord[]): string[] {
  const ids = new Set<string>();
  for (const item of items) {
    if (item.task_id) ids.add(item.task_id);
  }
  return [...ids];
}

export async function loadProactiveAnalysisForDay({
  userId,
  date,
  timeline,
  items = [],
  profileFacts,
}: {
  userId: string;
  date: string;
  timeline: DayTimelineEntry[];
  items?: CalendarItemRecord[];
  profileFacts?: ProfileFactRecord[];
}): Promise<ProactiveAnalysisResult> {
  try {
    const taskIds = collectTaskIdsFromItems(items);
    const tasksById =
      taskIds.length > 0
        ? await loadTaskSkipCountsByIds(userId, taskIds)
        : new Map();

    const input = buildDayAnalysisInput({
      date,
      timeline,
      items,
      tasksById,
      profileFacts,
    });

    return analyzeDayProactively(input);
  } catch {
    return {
      date,
      balanceScore: null,
      overload: null,
      postponements: null,
      insights: [],
      hasSufficientData: false,
    };
  }
}
