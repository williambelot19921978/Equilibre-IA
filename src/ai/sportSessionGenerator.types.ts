export type SportType =
  | "walk"
  | "run"
  | "mobility"
  | "yoga"
  | "strength"
  | "cardio"
  | "dance"
  | "other";

export type SportIntensity = "gentle" | "moderate" | "dynamic";

export function isLateEveningSlot(hour: number): boolean {
  return hour >= 21;
}

export function isIntenseSportBlocked({
  hour,
  intensity,
  afterWorkEnergy,
}: {
  hour: number;
  intensity: SportIntensity;
  afterWorkEnergy?: string;
}): boolean {
  if (isLateEveningSlot(hour) && intensity === "dynamic") {
    return true;
  }

  if (afterWorkEnergy === "low" && intensity === "dynamic") {
    return true;
  }

  return false;
}
