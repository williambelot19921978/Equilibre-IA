export type CompletionTiming = "early" | "on_time" | "late" | "unscheduled";

const DEFAULT_TOLERANCE_MINUTES = 5;

export function evaluateCompletionTiming({
  scheduledStartsAt: _scheduledStartsAt,
  scheduledEndsAt,
  actualCompletedAt,
  toleranceMinutes = DEFAULT_TOLERANCE_MINUTES,
}: {
  scheduledStartsAt?: string | null;
  scheduledEndsAt?: string | null;
  actualCompletedAt: string;
  toleranceMinutes?: number;
}): { timing: CompletionTiming; deltaMinutes: number } {
  if (!scheduledEndsAt) {
    return { timing: "unscheduled", deltaMinutes: 0 };
  }

  const scheduledEndMs = new Date(scheduledEndsAt).getTime();
  const actualMs = new Date(actualCompletedAt).getTime();
  const deltaMinutes = Math.round((actualMs - scheduledEndMs) / 60_000);

  if (deltaMinutes < -toleranceMinutes) {
    return { timing: "early", deltaMinutes };
  }

  if (deltaMinutes > toleranceMinutes) {
    return { timing: "late", deltaMinutes };
  }

  return { timing: "on_time", deltaMinutes };
}

export function computeFreedMinutes({
  scheduledEndsAt,
  actualCompletedAt,
}: {
  scheduledEndsAt: string;
  actualCompletedAt: string;
}): number {
  const delta = Math.round(
    (new Date(scheduledEndsAt).getTime() - new Date(actualCompletedAt).getTime()) /
      60_000,
  );
  return Math.max(0, delta);
}
