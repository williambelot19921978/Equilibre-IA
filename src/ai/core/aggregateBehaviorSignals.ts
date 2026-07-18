import type { TaskActivityEventRecord } from "../../types/taskActivity";
import type { BehaviorSignalCounts, LanguageMemoryBehaviorSnapshot } from "./buildLanguageMemoryContext";

const DEFAULT_WINDOW_DAYS = 30;

function emptyCounts(): BehaviorSignalCounts {
  return {
    completed: 0,
    skipped: 0,
    cancelled: 0,
    moved: 0,
    planned: 0,
    total: 0,
  };
}

export function aggregateBehaviorSignals({
  events,
  referenceDate,
  windowDays = DEFAULT_WINDOW_DAYS,
}: {
  events: TaskActivityEventRecord[];
  referenceDate: string;
  windowDays?: number;
}): LanguageMemoryBehaviorSnapshot {
  const counts = emptyCounts();
  const windowStart = new Date(`${referenceDate}T00:00:00.000Z`);
  windowStart.setUTCDate(windowStart.getUTCDate() - windowDays);
  const windowStartMs = windowStart.getTime();

  for (const event of events) {
    const occurredMs = Date.parse(event.occurred_at);
    if (!Number.isFinite(occurredMs) || occurredMs < windowStartMs) continue;

    counts.total += 1;
    switch (event.event_type) {
      case "completed":
        counts.completed += 1;
        break;
      case "skipped":
        counts.skipped += 1;
        break;
      case "cancelled":
        counts.cancelled += 1;
        break;
      case "moved":
        counts.moved += 1;
        break;
      case "planned":
        counts.planned += 1;
        break;
      default:
        break;
    }
  }

  const actionable = counts.completed + counts.skipped + counts.cancelled;
  const skipRatePercent =
    actionable === 0 ? 0 : Math.round((counts.skipped / actionable) * 100);
  const completionRatePercent =
    actionable === 0 ? 0 : Math.round((counts.completed / actionable) * 100);

  return {
    windowDays,
    counts,
    skipRatePercent,
    completionRatePercent,
  };
}
