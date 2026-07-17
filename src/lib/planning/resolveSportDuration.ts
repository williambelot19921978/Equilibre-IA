import type { WorkoutSessionType } from "../../types/workoutSession";

export const GENERAL_SPORT_DURATIONS = [10, 15, 20, 25, 30, 35, 40] as const;
export const RUN_SPORT_DURATIONS = [20, 30, 40, 50, 60] as const;

export function isRunSportType(type?: WorkoutSessionType | string | null): boolean {
  return type === "run";
}

function snapToAllowed(
  minutes: number,
  allowed: readonly number[],
  maxMinutes?: number,
): number {
  const cap = maxMinutes !== undefined ? Math.min(minutes, maxMinutes) : minutes;
  const eligible = allowed.filter((value) => value <= cap);
  if (eligible.length === 0) return allowed[0]!;

  return eligible.reduce((best, current) =>
    Math.abs(current - cap) < Math.abs(best - cap) ? current : best,
  );
}

export function snapSportDuration(
  minutes: number,
  type?: WorkoutSessionType | string | null,
  options?: { maxMinutes?: number },
): number {
  const allowed = isRunSportType(type) ? RUN_SPORT_DURATIONS : GENERAL_SPORT_DURATIONS;
  return snapToAllowed(minutes, allowed, options?.maxMinutes);
}

export function resolveRecommendedSportDuration({
  slotMinutes,
  energy = "medium",
  type,
  preferredMinutes = 25,
}: {
  slotMinutes: number;
  energy?: string;
  type?: WorkoutSessionType | string | null;
  preferredMinutes?: number;
}): number {
  const tired = energy === "low";
  const isRun = isRunSportType(type);

  if (isRun) {
    if (tired || slotMinutes < 30) return snapSportDuration(20, type, { maxMinutes: slotMinutes });
    if (slotMinutes >= 55 && !tired) {
      return snapSportDuration(Math.max(preferredMinutes, 40), type, { maxMinutes: slotMinutes });
    }
    return snapSportDuration(Math.max(30, preferredMinutes), type, { maxMinutes: slotMinutes });
  }

  if (slotMinutes <= 15 || tired) {
    return snapSportDuration(Math.min(15, slotMinutes), type, { maxMinutes: slotMinutes });
  }
  if (slotMinutes <= 25) {
    return snapSportDuration(20, type, { maxMinutes: slotMinutes });
  }
  if (slotMinutes >= 35 && !tired) {
    return snapSportDuration(Math.max(preferredMinutes, 30), type, { maxMinutes: slotMinutes });
  }
  return snapSportDuration(Math.max(25, preferredMinutes), type, { maxMinutes: slotMinutes });
}

export function sportDurationOptionsForType(
  type?: WorkoutSessionType | string | null,
  maxMinutes?: number,
): number[] {
  const allowed = isRunSportType(type) ? [...RUN_SPORT_DURATIONS] : [...GENERAL_SPORT_DURATIONS];
  if (maxMinutes === undefined) return allowed;
  return allowed.filter((value) => value <= maxMinutes);
}
