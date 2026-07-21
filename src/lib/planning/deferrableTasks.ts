import { isHardConstraint } from "./blockActionHelpers";
import type { DayTimelineEntry } from "./displayedDayTimeline";
import type { CalendarItemRecord, TaskRecord } from "../../types";

/** Priorité >= 4 : importante / urgente — conservée sur la journée. */
export const URGENT_PRIORITY_THRESHOLD = 4;

export type DeferrableTaskCandidate = {
  calendarItemId: string;
  taskId: string | null;
  title: string;
  entryId: string;
  priority: number;
};

export function identifyDeferrableTimelineEntries({
  timeline,
  items,
  tasksById,
  nowIso = new Date().toISOString(),
}: {
  timeline: DayTimelineEntry[];
  items: CalendarItemRecord[];
  tasksById: Map<string, TaskRecord>;
  nowIso?: string;
}): DeferrableTaskCandidate[] {
  const itemByCalendarId = new Map(
    items
      .filter((item) => item.id)
      .map((item) => [item.id, item] as const),
  );

  const candidates: DeferrableTaskCandidate[] = [];

  for (const entry of timeline) {
    if (entry.completed) continue;
    if (entry.blockKind === "appointment" || entry.visualType === "appointment") continue;
    if (isHardConstraint(entry)) continue;
    if (entry.blockKind !== "task" && entry.visualType !== "task" && entry.visualType !== "sport") {
      continue;
    }
    if (entry.endsAt <= nowIso) continue;

    const calendarItemId = entry.calendarItemId;
    if (!calendarItemId) continue;

    const item = itemByCalendarId.get(calendarItemId);
    if (item?.locked && item.item_type === "event") continue;

    const taskId = item?.task_id ?? null;
    const task = taskId ? tasksById.get(taskId) : null;

    if (task && task.priority >= URGENT_PRIORITY_THRESHOLD) continue;
    if (task && (task.status === "done" || task.status === "cancelled")) continue;

    candidates.push({
      calendarItemId,
      taskId,
      title: entry.title,
      entryId: entry.id,
      priority: task?.priority ?? 2,
    });
  }

  return candidates.sort((a, b) => a.priority - b.priority);
}
