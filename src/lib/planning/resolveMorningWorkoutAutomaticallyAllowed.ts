import type { LifeDayType, LifeEnergyPrediction } from "../../types/lifeContext";

export function resolveMorningWorkoutAutomaticallyAllowed({
  workDay,
  vacation,
  restDay,
  dayType,
  energyPrediction,
}: {
  workDay: boolean;
  vacation: boolean;
  restDay: boolean;
  dayType: LifeDayType;
  energyPrediction: LifeEnergyPrediction;
}): boolean {
  if (workDay && !vacation) {
    return false;
  }

  if (vacation) {
    return energyPrediction !== "low";
  }

  if (dayType === "WEEKEND" || restDay) {
    return energyPrediction !== "low";
  }

  return energyPrediction === "high" || energyPrediction === "medium";
}

export function isMorningSlotBeforeWork({
  slotStartsAt,
  workStartTime,
  date,
}: {
  slotStartsAt: string;
  workStartTime: string;
  date: string;
}): boolean {
  const slotMinutes = new Date(slotStartsAt).getHours() * 60 + new Date(slotStartsAt).getMinutes();
  const workParts = workStartTime.split(":");
  const workMinutes =
    Number.parseInt(workParts[0] ?? "9", 10) * 60 +
    Number.parseInt(workParts[1] ?? "0", 10);

  void date;
  return slotMinutes < workMinutes;
}
