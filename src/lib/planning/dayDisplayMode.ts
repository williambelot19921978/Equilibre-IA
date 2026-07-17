import {
  getCurrentDeviceDate,
  isFutureDate,
  isPastDate,
  isToday,
} from "../time/deviceClock";

export type DayDisplayMode = "live" | "historical" | "future";

export function resolveDayDisplayMode(date: string): DayDisplayMode {
  if (isToday(date)) {
    return "live";
  }

  if (isPastDate(date)) {
    return "historical";
  }

  if (isFutureDate(date)) {
    return "future";
  }

  return "live";
}

export function getDayDisplayModeLabel(mode: DayDisplayMode): string | null {
  if (mode === "historical") {
    return "Journée passée — archive enregistrée";
  }

  if (mode === "future") {
    return "Journée à venir — prévisualisation";
  }

  return null;
}

export function canRegeneratePlan(mode: DayDisplayMode): boolean {
  return mode === "live" || mode === "future";
}

export function getTodayDateString(): string {
  return getCurrentDeviceDate();
}
