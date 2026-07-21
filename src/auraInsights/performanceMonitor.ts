/**
 * EPIC 8B — Performance marks (anonymous).
 */

import { trackInsightEvent } from "./eventStore";

const marks = new Map<string, number>();

export function startPerfMark(label: string): void {
  marks.set(label, performance.now());
}

export function endPerfMark(
  userId: string | null | undefined,
  label: "app_open" | "navigation" | "onboarding",
): void {
  const start = marks.get(label);
  if (start === undefined || !userId) return;
  marks.delete(label);
  trackInsightEvent(userId, "perf_mark", {
    mark: label,
    durationMs: Math.round(performance.now() - start),
  });
}

export function measureNavigation(
  userId: string | null | undefined,
  callback: () => void,
): void {
  startPerfMark("navigation");
  callback();
  endPerfMark(userId, "navigation");
}
