export const STUDY_REVISION_DURATION_OPTIONS = [
  10, 15, 20, 25, 30, 35, 40, 45, 60,
] as const;

export type StudyRevisionDurationContext = {
  slotMinutes: number;
  preferredFocusMinutes?: number;
  energy?: string;
  hour?: number;
  weeklyGoalMinutes?: number;
  completedMinutesThisWeek?: number;
  bufferMinutes?: number;
};

export function resolveRecommendedStudyRevisionDuration({
  slotMinutes,
  preferredFocusMinutes = 30,
  energy = "medium",
  hour = 12,
  bufferMinutes = 10,
}: StudyRevisionDurationContext): number {
  const tired = energy === "low";
  const lateEvening = hour >= 21;
  const available = Math.max(5, slotMinutes - bufferMinutes);

  let target = preferredFocusMinutes;

  if (tired) {
    target = Math.min(target, 20);
  } else if (lateEvening) {
    target = Math.min(target, 30);
  } else if (energy === "high") {
    target = Math.max(target, 25);
  }

  if (available >= 60 && !tired && !lateEvening && hour < 20) {
    target = Math.max(target, 45);
  }

  const snapped = STUDY_REVISION_DURATION_OPTIONS.reduce((best, option) => {
    if (option > available) return best;
    return Math.abs(option - target) < Math.abs(best - target) ? option : best;
  }, STUDY_REVISION_DURATION_OPTIONS[0]);

  return Math.min(snapped, available);
}

export function resolveAvailableStudyRevisionDurations(
  slotMinutes: number,
  bufferMinutes = 10,
): number[] {
  const maxDuration = Math.max(5, slotMinutes - bufferMinutes);
  return STUDY_REVISION_DURATION_OPTIONS.filter((minutes) => minutes <= maxDuration);
}

export function validateStudyRevisionDuration(
  minutes: number,
  slotMinutes: number,
  bufferMinutes = 10,
): { valid: boolean; message?: string } {
  const maxDuration = Math.max(5, slotMinutes - bufferMinutes);

  if (!Number.isFinite(minutes) || minutes < 5) {
    return {
      valid: false,
      message: "La durée minimum est de 5 minutes.",
    };
  }

  if (minutes > maxDuration) {
    return {
      valid: false,
      message: `Cette durée dépasse le créneau disponible (${maxDuration} min max).`,
    };
  }

  return { valid: true };
}

export function snapStudyRevisionDuration(
  minutes: number,
  slotMinutes: number,
  bufferMinutes = 10,
): number {
  const maxDuration = Math.max(5, slotMinutes - bufferMinutes);
  const clamped = Math.min(Math.max(5, Math.round(minutes)), maxDuration);
  const available = resolveAvailableStudyRevisionDurations(slotMinutes, bufferMinutes);

  if (available.length === 0) {
    return Math.min(clamped, maxDuration);
  }

  return available.reduce((best, option) =>
    Math.abs(option - clamped) < Math.abs(best - clamped) ? option : best,
  );
}
