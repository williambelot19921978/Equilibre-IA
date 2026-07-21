/** EPIC 4C — Secure Action Engine contract. */

import type { ConversationIntent } from "../../conversationFoundation/types/intents";
import type { CalendarScope } from "../planning/planningCalendarContract";
import type { PlanningCalendarTarget } from "../planning/planningCalendarContract";

export type SecureActionType =
  | "createTask"
  | "modifyTask"
  | "moveTask"
  | "deleteTask"
  | "updateGoal"
  | "reorganizeDay"
  | "rescheduleEvent"
  | "createReminder"
  | "notifyHousehold";

export type SecureActionStatus =
  | "proposed"
  | "pending_confirmation"
  | "confirmed"
  | "executing"
  | "executed"
  | "cancelled"
  | "failed"
  | "expired";

export type RiskLevel = "low" | "medium" | "high";

export type ActionOrigin = "assistant" | "user_request";

export type ActionPreview = {
  readonly title: string;
  readonly before: readonly string[];
  readonly after: readonly string[];
  readonly impact: string;
  readonly affectedItems: readonly string[];
  readonly confidence: number;
  readonly risk: RiskLevel;
  readonly why: readonly string[];
};

export type ValidationIssue = {
  readonly code: string;
  readonly message: string;
  readonly field?: string;
};

export type ValidationResult = {
  readonly valid: boolean;
  readonly issues: readonly ValidationIssue[];
};

export type ActionExplainability = {
  readonly summary: string;
  readonly whyAction: readonly string[];
  readonly whyTarget: readonly string[];
  readonly whyTiming: readonly string[];
};

export type SecureAction = {
  readonly id: string;
  readonly type: SecureActionType;
  readonly description: string;
  readonly summary: string;
  readonly target: string;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly riskLevel: RiskLevel;
  readonly requiresConfirmation: true;
  readonly estimatedImpact: string;
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly status: SecureActionStatus;
  readonly sourceIntent: ConversationIntent | "manual";
  readonly origin: ActionOrigin;
  readonly preview: ActionPreview;
  readonly validation: ValidationResult;
  readonly explainability: ActionExplainability;
  readonly calendarScope?: CalendarScope;
  readonly planningTarget?: PlanningCalendarTarget;
  readonly executionAvailable: boolean;
};

export type SecureActionDraft = Omit<
  SecureAction,
  "id" | "createdAt" | "expiresAt" | "status" | "validation" | "executionAvailable"
> & {
  readonly validation?: ValidationResult;
  readonly executionAvailable?: boolean;
};

export type ActionExecutionReport = {
  readonly actionId: string;
  readonly success: boolean;
  readonly message: string;
  readonly startedAt: string;
  readonly finishedAt: string;
  readonly durationMs: number;
  readonly error?: string;
  readonly resultPayload?: Readonly<Record<string, unknown>>;
};

export const DEFAULT_ACTION_TTL_MS = 15 * 60 * 1000;

export function createActionId(): string {
  return `action-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function finalizeSecureAction(
  draft: SecureActionDraft,
  validation: ValidationResult,
): SecureAction {
  const now = Date.now();
  return {
    ...draft,
    executionAvailable: draft.executionAvailable ?? true,
    id: createActionId(),
    validation,
    status: validation.valid ? "pending_confirmation" : "failed",
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + DEFAULT_ACTION_TTL_MS).toISOString(),
    requiresConfirmation: true,
  };
}

export function isActionExpired(action: SecureAction, now = Date.now()): boolean {
  return new Date(action.expiresAt).getTime() <= now;
}
