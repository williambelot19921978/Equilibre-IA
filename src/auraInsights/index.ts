/**
 * EPIC 8B — High-level Aura Insights API.
 */

export { trackInsightEvent, trackAnonymousInsightEvent, listInsightEvents, clearInsightEvents, setInsightsBackendAdapter } from "./eventStore";
export type { InsightsBackendAdapter } from "./eventStore";
export { buildHealthDashboard } from "./aggregatesService";
export { toAnonymousId, sanitizeMeta } from "./anonymize";
export { isAnalyticsAllowedForUser } from "./privacyGate";
export { isAuraAdmin, isAuraInsightsEnabled } from "./adminAccess";
export { startPerfMark, endPerfMark } from "./performanceMonitor";
export { initErrorMonitor, trackSyncFailure, trackTimeout } from "./errorMonitor";
export type {
  AuraInsightEvent,
  AuraInsightEventType,
  HealthDashboardSnapshot,
  CoachDomain,
  FunnelSnapshot,
} from "./types";
export { FUNNEL_STEP_ORDER } from "./types";

import type { CoachDomain } from "./types";
import { trackInsightEvent } from "./eventStore";

export function trackCoachAdviceShown(userId: string, domain: CoachDomain = "general"): void {
  trackInsightEvent(userId, "advice_shown", { domain });
}

export function trackCoachAdviceAccepted(userId: string, domain: CoachDomain = "general"): void {
  trackInsightEvent(userId, "advice_accepted", { domain });
}

export function trackCoachAdviceIgnored(userId: string, domain: CoachDomain = "general"): void {
  trackInsightEvent(userId, "advice_ignored", { domain });
}

export function trackCoachAdviceDeferred(userId: string, domain: CoachDomain = "general"): void {
  trackInsightEvent(userId, "advice_deferred", { domain });
}

export function trackCheckinCompleted(
  userId: string,
  mode: "quick" | "standard" | "complete",
  durationMs?: number,
): void {
  trackInsightEvent(userId, "checkin_completed", { mode, durationMs: durationMs ?? 0 });
}

export function trackAppOpened(userId: string, feature?: string): void {
  trackInsightEvent(userId, "app_opened", { feature: feature ?? "home" });
}
