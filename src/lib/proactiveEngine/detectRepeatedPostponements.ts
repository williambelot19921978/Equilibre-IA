import { POSTPONEMENT_THRESHOLDS } from "./constants";
import type {
  DayAnalysisInput,
  PostponementDetectionResult,
  PostponementInsight,
  PostponementSeverity,
} from "./types";

function resolvePostponementSeverity(count: number): PostponementSeverity | null {
  if (count < POSTPONEMENT_THRESHOLDS.infoMin) return null;
  if (count >= POSTPONEMENT_THRESHOLDS.criticalMin) return "critical";
  if (count >= POSTPONEMENT_THRESHOLDS.warningMin) return "warning";
  return "info";
}

function buildPostponementMessage(title: string, count: number): string {
  if (count >= POSTPONEMENT_THRESHOLDS.criticalMin) {
    return `« ${title} » a déjà été déplacée plusieurs fois (${count} reports). Un créneau différent ou une durée plus courte pourrait être plus réaliste.`;
  }
  if (count >= POSTPONEMENT_THRESHOLDS.warningMin) {
    return `« ${title} » a été reportée ${count} fois. Un créneau plus court ou plus tôt dans la journée serait peut-être plus adapté.`;
  }
  return `« ${title} » a déjà été déplacée plusieurs fois.`;
}

export function detectRepeatedPostponements(
  input: DayAnalysisInput,
): PostponementDetectionResult {
  const items: PostponementInsight[] = [];

  for (const scheduled of input.scheduledItems) {
    const count = scheduled.postponementCount ?? 0;
    const severity = resolvePostponementSeverity(count);
    if (!severity) continue;

    items.push({
      taskId: scheduled.id,
      title: scheduled.title,
      count,
      severity,
      message: buildPostponementMessage(scheduled.title, count),
    });
  }

  items.sort((a, b) => b.count - a.count);

  return {
    items,
    maxCount: items.length > 0 ? items[0].count : 0,
  };
}
