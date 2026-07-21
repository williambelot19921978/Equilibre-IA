/**
 * EPIC 8B — Aggregates, funnel, health dashboard (read-only).
 */

import { listInsightEvents } from "./eventStore";
import type {
  AuraFunnelStep,
  AuraInsightEvent,
  CoachDomain,
  FunnelSnapshot,
  HealthDashboardSnapshot,
} from "./types";
import { FUNNEL_STEP_ORDER } from "./types";

const ACTIVE_WINDOW_DAYS = 7;
const MS_DAY = 86_400_000;

function withinDays(at: string, days: number): boolean {
  return Date.now() - new Date(at).getTime() <= days * MS_DAY;
}

function uniqueAnonymousIds(events: AuraInsightEvent[]): Set<string> {
  return new Set(events.map((event) => event.anonymousId));
}

function countByType(events: AuraInsightEvent[], type: AuraInsightEvent["type"]): number {
  return events.filter((event) => event.type === type).length;
}

function avgMetaDuration(events: AuraInsightEvent[], type: AuraInsightEvent["type"]): number | null {
  const durations = events
    .filter((event) => event.type === type && typeof event.meta.durationMs === "number")
    .map((event) => event.meta.durationMs as number);
  if (durations.length === 0) return null;
  return Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length);
}

function avgPerfMark(events: AuraInsightEvent[], mark: string): number | null {
  const durations = events
    .filter(
      (event) =>
        event.type === "perf_mark" &&
        event.meta.mark === mark &&
        typeof event.meta.durationMs === "number",
    )
    .map((event) => event.meta.durationMs as number);
  if (durations.length === 0) return null;
  return Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length);
}

function buildFunnel(events: AuraInsightEvent[]): FunnelSnapshot {
  const byUser = new Map<string, Set<string>>();
  for (const event of events) {
    const set = byUser.get(event.anonymousId) ?? new Set<string>();
    set.add(event.type);
    byUser.set(event.anonymousId, set);
  }

  const steps: Record<AuraFunnelStep, number> = {
    account_created: 0,
    onboarding_completed: 0,
    first_checkin: 0,
    first_goal: 0,
    first_advice_accepted: 0,
    active_user: 0,
  };

  for (const [anonymousId, types] of byUser.entries()) {
    if (types.has("account_created")) steps.account_created += 1;
    if (types.has("onboarding_completed")) steps.onboarding_completed += 1;
    if (types.has("checkin_completed")) steps.first_checkin += 1;
    if (types.has("goal_created")) steps.first_goal += 1;
    if (types.has("advice_accepted")) steps.first_advice_accepted += 1;
    const openCount = events.filter(
      (event) =>
        event.anonymousId === anonymousId &&
        event.type === "app_opened" &&
        withinDays(event.at, ACTIVE_WINDOW_DAYS),
    ).length;
    if (openCount >= 2) steps.active_user += 1;
  }

  const conversionRates: Partial<Record<AuraFunnelStep, number>> = {};
  for (let index = 1; index < FUNNEL_STEP_ORDER.length; index += 1) {
    const prev = FUNNEL_STEP_ORDER[index - 1]!;
    const curr = FUNNEL_STEP_ORDER[index]!;
    const prevCount = steps[prev];
    conversionRates[curr] = prevCount > 0 ? Math.round((steps[curr] / prevCount) * 100) : 0;
  }

  return { steps, conversionRates };
}

function buildCoachByDomain(events: AuraInsightEvent[]): HealthDashboardSnapshot["coachByDomain"] {
  const result: Record<CoachDomain, { shown: number; accepted: number; ignored: number; deferred: number }> = {
    sport: { shown: 0, accepted: 0, ignored: 0, deferred: 0 },
    family: { shown: 0, accepted: 0, ignored: 0, deferred: 0 },
    wellbeing: { shown: 0, accepted: 0, ignored: 0, deferred: 0 },
    study: { shown: 0, accepted: 0, ignored: 0, deferred: 0 },
    goals: { shown: 0, accepted: 0, ignored: 0, deferred: 0 },
    general: { shown: 0, accepted: 0, ignored: 0, deferred: 0 },
  };

  for (const event of events) {
    const domain = (event.meta.domain as CoachDomain | undefined) ?? "general";
    const bucket = result[domain] ?? result.general;
    if (event.type === "advice_shown") bucket.shown += 1;
    if (event.type === "advice_accepted") bucket.accepted += 1;
    if (event.type === "advice_ignored") bucket.ignored += 1;
    if (event.type === "advice_deferred") bucket.deferred += 1;
  }

  return result;
}

function buildTopFeatures(events: AuraInsightEvent[]): { feature: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const event of events) {
    if (event.type !== "app_opened" && event.type !== "coach_opened") continue;
    const feature = String(event.meta.feature ?? event.type);
    counts.set(feature, (counts.get(feature) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([feature, count]) => ({ feature, count }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 8);
}

export function buildHealthDashboard(): HealthDashboardSnapshot {
  const events = listInsightEvents();
  const recent = events.filter((event) => withinDays(event.at, ACTIVE_WINDOW_DAYS));
  const activeUsers = uniqueAnonymousIds(recent.filter((event) => event.type === "app_opened")).size;

  const adviceAccepted = countByType(events, "advice_accepted");
  const adviceIgnored = countByType(events, "advice_ignored");
  const adviceTotal = adviceAccepted + adviceIgnored + countByType(events, "advice_deferred");

  const checkinCompleted = events.filter((event) => event.type === "checkin_completed");
  const checkinSkipped = countByType(events, "checkin_skipped");

  const byMode = { quick: 0, standard: 0, complete: 0 };
  for (const event of checkinCompleted) {
    const mode = event.meta.mode as keyof typeof byMode | undefined;
    if (mode && mode in byMode) byMode[mode] += 1;
  }

  return {
    generatedAt: new Date().toISOString(),
    activeUsers,
    dailyCheckins: checkinCompleted.filter((event) => withinDays(event.at, 1)).length,
    adviceAccepted,
    adviceIgnored,
    adviceAcceptRate: adviceTotal > 0 ? Math.round((adviceAccepted / adviceTotal) * 100) : 0,
    avgOnboardingMs: avgMetaDuration(events, "onboarding_completed"),
    avgSessionMs: avgMetaDuration(events, "session_ended"),
    topFeatures: buildTopFeatures(events),
    funnel: buildFunnel(events),
    coachByDomain: buildCoachByDomain(events),
    notifications: {
      sent: countByType(events, "notification_sent"),
      opened: countByType(events, "notification_opened"),
      dismissed: countByType(events, "notification_dismissed"),
      disabled: countByType(events, "notifications_disabled"),
    },
    dailyState: {
      completed: checkinCompleted.length,
      skipped: checkinSkipped,
      avgDurationMs: avgMetaDuration(checkinCompleted, "checkin_completed"),
      byMode,
    },
    errors: {
      js: countByType(events, "js_error"),
      timeout: countByType(events, "timeout"),
      offline: countByType(events, "offline_detected"),
      syncFailed: countByType(events, "sync_failed"),
    },
    performance: {
      avgAppOpenMs: avgPerfMark(events, "app_open"),
      avgNavigationMs: avgPerfMark(events, "navigation"),
      avgOnboardingMs: avgPerfMark(events, "onboarding"),
    },
    totalEvents: events.length,
  };
}
