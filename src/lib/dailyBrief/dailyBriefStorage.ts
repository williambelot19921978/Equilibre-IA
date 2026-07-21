/**
 * EPIC1-A — Daily Brief presentation memory (local only, no server, no learning).
 */

import { getCurrentDeviceDate } from "../time/deviceClock";

const STORAGE_PREFIX = "daily-brief-presented";

export function buildDailyBriefStorageKey(userId: string, date: string): string {
  return `${STORAGE_PREFIX}:${userId}:${date}`;
}

export function isDailyBriefPresentedToday(
  userId: string,
  date: string = getCurrentDeviceDate(),
): boolean {
  if (typeof localStorage === "undefined") return false;
  return (
    localStorage.getItem(buildDailyBriefStorageKey(userId, date)) === "1"
  );
}

export function markDailyBriefPresentedToday(
  userId: string,
  date: string = getCurrentDeviceDate(),
): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(buildDailyBriefStorageKey(userId, date), "1");
}

export function clearDailyBriefPresentationForTests(): void {
  if (typeof localStorage === "undefined") return;

  const keysToRemove: string[] = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key?.startsWith(`${STORAGE_PREFIX}:`)) {
      keysToRemove.push(key);
    }
  }

  for (const key of keysToRemove) {
    localStorage.removeItem(key);
  }
}
