import {
  HIGH_PRIORITY_THRESHOLD,
  LATE_ACTIVITY_BEFORE_SLEEP_MINUTES,
  LATE_DAY_END_MINUTES,
  MAX_HIGH_PRIORITY_TASKS,
  MIN_BREAK_GAP_MINUTES,
  MIN_BREAK_MINUTES,
  OVERLOAD_PLANNED_MINUTES_CRITICAL,
  OVERLOAD_PLANNED_MINUTES_WARNING,
} from "./constants";
import type { DayAnalysisInput, OverloadDetectionResult, OverloadReason } from "./types";
import {
  formatDurationHours,
  isCountablePlannedItem,
  minutesBetween,
  minutesOfDayUtc,
  rangesOverlap,
} from "./timeUtils";

function isHighPriority(priority?: string | null): boolean {
  if (!priority) return false;
  const normalized = priority.toLowerCase();
  if (normalized === "high" || normalized === "urgent" || normalized === "critical") {
    return true;
  }
  const numeric = Number(priority);
  return Number.isFinite(numeric) && numeric >= HIGH_PRIORITY_THRESHOLD;
}

function countOverlaps(items: DayAnalysisInput["scheduledItems"]): number {
  let count = 0;
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      const a = items[i];
      const b = items[j];
      if (!isCountablePlannedItem(a.category) || !isCountablePlannedItem(b.category)) {
        continue;
      }
      if (rangesOverlap(a.startsAt, a.endsAt, b.startsAt, b.endsAt)) {
        count += 1;
      }
    }
  }
  return count;
}

function hasRealisticBreaks(items: DayAnalysisInput["scheduledItems"]): boolean {
  const planned = items
    .filter((item) => isCountablePlannedItem(item.category))
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));

  for (let i = 0; i < planned.length - 1; i += 1) {
    const gap = minutesBetween(planned[i].endsAt, planned[i + 1].startsAt);
    if (gap >= MIN_BREAK_MINUTES && gap < MIN_BREAK_GAP_MINUTES) {
      return true;
    }
  }
  return planned.length <= 2;
}

export function detectOverload(input: DayAnalysisInput): OverloadDetectionResult {
  const plannedItems = input.scheduledItems.filter((item) =>
    isCountablePlannedItem(item.category),
  );

  const totalPlannedMinutes = plannedItems.reduce(
    (sum, item) => sum + minutesBetween(item.startsAt, item.endsAt),
    0,
  );

  const overlapCount = countOverlaps(input.scheduledItems);
  const highPriorityCount = plannedItems.filter((item) => isHighPriority(item.priority)).length;

  const lastActivityEndMinutes =
    plannedItems.length > 0
      ? Math.max(...plannedItems.map((item) => minutesOfDayUtc(item.endsAt)))
      : null;

  const reasons: OverloadReason[] = [];

  if (totalPlannedMinutes >= OVERLOAD_PLANNED_MINUTES_CRITICAL) {
    reasons.push({
      code: "planned_duration_too_high",
      severity: "critical",
      explanation: `La journée contient ${formatDurationHours(totalPlannedMinutes)} d'activités planifiées.`,
    });
  } else if (totalPlannedMinutes >= OVERLOAD_PLANNED_MINUTES_WARNING) {
    reasons.push({
      code: "planned_duration_elevated",
      severity: "warning",
      explanation: `La journée contient ${formatDurationHours(totalPlannedMinutes)} d'activités planifiées.`,
    });
  }

  if (overlapCount > 0) {
    reasons.push({
      code: "schedule_overlap",
      severity: overlapCount >= 2 ? "critical" : "warning",
      explanation:
        overlapCount === 1
          ? "Deux activités se chevauchent dans le planning."
          : `${overlapCount} chevauchements détectés dans le planning.`,
    });
  }

  if (highPriorityCount > MAX_HIGH_PRIORITY_TASKS) {
    reasons.push({
      code: "too_many_high_priority",
      severity: "warning",
      explanation: `${highPriorityCount} tâches prioritaires sont prévues aujourd'hui.`,
    });
  }

  if (plannedItems.length >= 3 && !hasRealisticBreaks(plannedItems)) {
    reasons.push({
      code: "missing_breaks",
      severity: "warning",
      explanation: "Peu de pauses visibles entre les activités planifiées.",
    });
  }

  if (lastActivityEndMinutes !== null && lastActivityEndMinutes >= LATE_DAY_END_MINUTES) {
    reasons.push({
      code: "late_day_end",
      severity: "warning",
      explanation: "La journée se termine tardivement.",
    });
  }

  const plannedSleepHours = input.sleep?.plannedHours;
  if (
    plannedSleepHours != null &&
    lastActivityEndMinutes !== null &&
    lastActivityEndMinutes >= LATE_ACTIVITY_BEFORE_SLEEP_MINUTES &&
    plannedSleepHours < 8
  ) {
    reasons.push({
      code: "late_activity_incompatible_with_sleep",
      severity: "critical",
      explanation:
        "Une activité tardive risque de réduire ton temps de sommeil prévu.",
    });
  }

  const overloaded = reasons.some(
    (reason) => reason.severity === "critical" || reason.severity === "warning",
  );

  return {
    overloaded,
    reasons,
    totalPlannedMinutes,
    overlapCount,
    highPriorityCount,
    lastActivityEndMinutes,
  };
}
