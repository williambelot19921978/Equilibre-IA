/**
 * EPIC3-A — Simple member workload from timeline + tasks.
 */

import { analyzeDayForBrief } from "../dailyBrief/analyzeDayForBrief";
import type { DayTimelineEntry } from "../planning/displayedDayTimeline";
import type { TaskRecord } from "../../types";
import type { MemberWorkloadSummary } from "../../types/householdOverview";

function countActiveTasks(
  tasks: readonly TaskRecord[],
  memberId: string,
): number {
  return tasks.filter(
    (task) =>
      (task.assigned_to === memberId || task.created_by === memberId) &&
      task.status !== "done" &&
      task.status !== "cancelled",
  ).length;
}

function resolveLoadLabel(
  scheduledMinutes: number,
  freeMinutes: number,
  activeTaskCount: number,
): string {
  if (scheduledMinutes >= 300 || activeTaskCount >= 8) {
    return "Journée chargée";
  }

  if (freeMinutes >= 120 && scheduledMinutes < 120) {
    return "Journée légère";
  }

  if (freeMinutes >= 60) {
    return "Charge modérée";
  }

  return "Peu de marge";
}

export function computeMemberWorkload(input: {
  memberId: string;
  displayName: string;
  timeline: readonly DayTimelineEntry[];
  tasks: readonly TaskRecord[];
  dataAvailable?: boolean;
}): MemberWorkloadSummary {
  const analysis = analyzeDayForBrief([...input.timeline]);
  const activeTaskCount = countActiveTasks(input.tasks, input.memberId);

  return {
    memberId: input.memberId,
    displayName: input.displayName,
    scheduledMinutesToday: analysis.scheduledMinutes,
    freeMinutesRemaining: analysis.freeMinutes,
    activeTaskCount,
    loadLabel: resolveLoadLabel(
      analysis.scheduledMinutes,
      analysis.freeMinutes,
      activeTaskCount,
    ),
    dataAvailable: input.dataAvailable ?? true,
  };
}
