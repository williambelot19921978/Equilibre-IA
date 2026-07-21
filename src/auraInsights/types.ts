/**
 * EPIC 8B — Aura Insights event types (anonymous metrics only).
 * Never store personal content in meta fields.
 */

export type AuraInsightEventType =
  | "account_created"
  | "onboarding_completed"
  | "checkin_enabled"
  | "checkin_disabled"
  | "checkin_skipped"
  | "app_opened"
  | "coach_opened"
  | "advice_shown"
  | "advice_accepted"
  | "advice_ignored"
  | "advice_deferred"
  | "checkin_completed"
  | "goal_created"
  | "goal_completed"
  | "data_exported"
  | "data_deleted"
  | "notification_sent"
  | "notification_opened"
  | "notification_dismissed"
  | "notifications_disabled"
  | "session_started"
  | "session_ended"
  | "js_error"
  | "timeout"
  | "offline_detected"
  | "sync_failed"
  | "perf_mark";

export type CoachDomain = "sport" | "family" | "wellbeing" | "study" | "goals" | "general";

export type CheckinModeMetric = "quick" | "standard" | "complete";

/** Allowed meta value types — no strings that could hold PII */
export type AuraInsightMetaValue = number | boolean | CoachDomain | CheckinModeMetric | string;

export type AuraInsightEvent = {
  readonly id: string;
  readonly type: AuraInsightEventType;
  readonly anonymousId: string;
  readonly at: string;
  readonly meta: Readonly<Record<string, AuraInsightMetaValue>>;
};

export type AuraFunnelStep =
  | "account_created"
  | "onboarding_completed"
  | "first_checkin"
  | "first_goal"
  | "first_advice_accepted"
  | "active_user";

export type FunnelSnapshot = {
  readonly steps: Readonly<Record<AuraFunnelStep, number>>;
  readonly conversionRates: Readonly<Partial<Record<AuraFunnelStep, number>>>;
};

export type HealthDashboardSnapshot = {
  readonly generatedAt: string;
  readonly activeUsers: number;
  readonly dailyCheckins: number;
  readonly adviceAccepted: number;
  readonly adviceIgnored: number;
  readonly adviceAcceptRate: number;
  readonly avgOnboardingMs: number | null;
  readonly avgSessionMs: number | null;
  readonly topFeatures: readonly { feature: string; count: number }[];
  readonly funnel: FunnelSnapshot;
  readonly coachByDomain: Readonly<Record<CoachDomain, { shown: number; accepted: number; ignored: number; deferred: number }>>;
  readonly notifications: {
    sent: number;
    opened: number;
    dismissed: number;
    disabled: number;
  };
  readonly dailyState: {
    completed: number;
    skipped: number;
    avgDurationMs: number | null;
    byMode: Readonly<Record<CheckinModeMetric, number>>;
  };
  readonly errors: {
    js: number;
    timeout: number;
    offline: number;
    syncFailed: number;
  };
  readonly performance: {
    avgAppOpenMs: number | null;
    avgNavigationMs: number | null;
    avgOnboardingMs: number | null;
  };
  readonly totalEvents: number;
};

export const FUNNEL_STEP_ORDER: readonly AuraFunnelStep[] = [
  "account_created",
  "onboarding_completed",
  "first_checkin",
  "first_goal",
  "first_advice_accepted",
  "active_user",
];

export const ALLOWED_META_KEYS = new Set([
  "domain",
  "mode",
  "scope",
  "format",
  "feature",
  "durationMs",
  "mark",
  "channel",
  "count",
]);
