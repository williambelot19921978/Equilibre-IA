/** EPIC 4A/4C — Unified assistant response contract. */

import type { ActionExplainability, ActionPreview, RiskLevel, ValidationIssue } from "../../actionEngine/types/secureAction";
import type { CalendarScope } from "../../actionEngine/planning/planningCalendarContract";
import type { ConversationIntent } from "./intents";
import type { ContextSourceRef } from "./assistantContext";

export type ProposedAssistantActionStatus =
  | "not_implemented"
  | "pending_confirmation"
  | "confirmed"
  | "executed"
  | "cancelled"
  | "failed"
  | "expired";

export type ProposedAssistantAction = {
  readonly type: string;
  readonly label: string;
  readonly description: string;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly executable: boolean;
  readonly status: ProposedAssistantActionStatus;
  readonly actionId?: string;
  readonly preview?: ActionPreview;
  readonly explainability?: ActionExplainability;
  readonly riskLevel?: RiskLevel;
  readonly estimatedImpact?: string;
  readonly validationValid?: boolean;
  readonly validationIssues?: readonly ValidationIssue[];
  readonly executionAvailable?: boolean;
  readonly calendarScope?: CalendarScope;
};

export type AssistantSuggestion = {
  readonly id: string;
  readonly label: string;
  readonly detail?: string;
};

export type AssistantExplanation = {
  readonly summary: string;
  readonly reasoning: string;
  readonly sources: readonly ContextSourceRef[];
  readonly missingData: readonly string[];
  readonly humanModelReasons?: Readonly<{
    readonly energy: readonly string[];
    readonly mentalLoad: readonly string[];
    readonly motivation: readonly string[];
    readonly availability: readonly string[];
  }>;
};

export type AssistantResponse = {
  readonly text: string;
  readonly confidence: number;
  readonly intent: ConversationIntent;
  readonly reasoning: string;
  readonly suggestions: readonly AssistantSuggestion[];
  readonly proposedActions: readonly ProposedAssistantAction[];
  readonly warning?: string;
  readonly explanation: AssistantExplanation;
  readonly readOnly: true;
};
