/**
 * EPIC 7A — User preference for daily check-in (localStorage).
 */

const PREFIX = "daily-checkin-pref-";

export type DailyCheckinPreference = {
  enabled: boolean;
};

function key(userId: string): string {
  return `${PREFIX}${userId}`;
}

export function getDailyCheckinPreference(userId: string): DailyCheckinPreference {
  if (typeof localStorage === "undefined") return { enabled: true };
  try {
    const raw = localStorage.getItem(key(userId));
    if (!raw) return { enabled: true };
    return JSON.parse(raw) as DailyCheckinPreference;
  } catch {
    return { enabled: true };
  }
}

export function setDailyCheckinPreference(
  userId: string,
  preference: DailyCheckinPreference,
): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(key(userId), JSON.stringify(preference));
}

export function isDailyCheckinEnabledForUser(userId: string): boolean {
  return getDailyCheckinPreference(userId).enabled;
}
