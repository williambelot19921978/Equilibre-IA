/**
 * EPIC 8B — JS error / offline / sync failure capture.
 */

import { trackInsightEvent } from "./eventStore";

let initialized = false;

export function initErrorMonitor(getUserId: () => string | null | undefined): void {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  window.addEventListener("error", () => {
    trackInsightEvent(getUserId(), "js_error", { count: 1 });
  });

  window.addEventListener("unhandledrejection", () => {
    trackInsightEvent(getUserId(), "js_error", { count: 1 });
  });

  window.addEventListener("offline", () => {
    trackInsightEvent(getUserId(), "offline_detected", { count: 1 });
  });
}

export function trackSyncFailure(userId: string | null | undefined): void {
  trackInsightEvent(userId, "sync_failed", { count: 1 });
}

export function trackTimeout(userId: string | null | undefined): void {
  trackInsightEvent(userId, "timeout", { count: 1 });
}
