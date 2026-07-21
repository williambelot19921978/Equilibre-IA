/**
 * Central registry of user-scoped localStorage prefixes — cleared on sign-out.
 */

export const USER_SCOPED_STORAGE_PREFIXES = [
  "offline-mutation-queue-",
  "sync-status-",
  "notification-prefs-",
  "notification-inbox-",
  "onboarding-progress-",
  "daily-checkin-pref-",
  "equilibre-demo-mode",
  "equilibre-assistant-conversation:",
  "action-engine-pending:",
  "action-engine-audit:",
  "epic2-goals:",
  "daily-brief-presented:",
  "daily-state-",
  "aura-feedback-",
  "aura-insights-events-",
  "life-knowledge-",
  "adaptive-timeline-",
  "adaptive-preferences-",
  "equilibre-sidebar-collapsed:",
  "spiritual_history_",
  "habit_correction_",
  "living_insight_meta_",
  "aura-launch-checklist-",
  "aura-changelog-seen",
  "aura-beta-badge-hidden",
  "aura-privacy-prefs-",
] as const;

export function collectUserScopedStorageKeys(userId?: string): string[] {
  if (typeof localStorage === "undefined") return [];

  const keysToRemove: string[] = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key) continue;

    const matchesPrefix = USER_SCOPED_STORAGE_PREFIXES.some((prefix) =>
      key.startsWith(prefix),
    );
    const matchesUser = userId ? key.includes(userId) : true;

    if (matchesPrefix && matchesUser) {
      keysToRemove.push(key);
    }
  }

  return keysToRemove;
}

export function clearUserScopedStorage(userId?: string): void {
  if (typeof localStorage === "undefined") return;
  for (const key of collectUserScopedStorageKeys(userId)) {
    localStorage.removeItem(key);
  }
}
