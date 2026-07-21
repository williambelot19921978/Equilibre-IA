/**
 * Branded nominal IDs — Sprint A2 contracts.
 * @see architecture/adr/0005-freeze-brain-architecture-20-engines.md
 */

export type UserId = string & { readonly __brand: 'UserId' };
export type MemberId = string & { readonly __brand: 'MemberId' };
export type HouseholdId = string & { readonly __brand: 'HouseholdId' };
export type SessionId = string & { readonly __brand: 'SessionId' };
export type ConversationId = string & { readonly __brand: 'ConversationId' };
export type TurnId = string & { readonly __brand: 'TurnId' };
export type ProposalId = string & { readonly __brand: 'ProposalId' };
export type DecisionId = string & { readonly __brand: 'DecisionId' };
export type OutcomeId = string & { readonly __brand: 'OutcomeId' };
export type TraceId = string & { readonly __brand: 'TraceId' };
export type CorrelationId = string & { readonly __brand: 'CorrelationId' };
export type ExpressionId = string & { readonly __brand: 'ExpressionId' };
export type TaskId = string & { readonly __brand: 'TaskId' };
export type BlockId = string & { readonly __brand: 'BlockId' };
export type EventId = string & { readonly __brand: 'EventId' };

export function asUserId(value: string): UserId {
  return value as UserId;
}

export function asMemberId(value: string): MemberId {
  return value as MemberId;
}

export function asHouseholdId(value: string): HouseholdId {
  return value as HouseholdId;
}

export function asSessionId(value: string): SessionId {
  return value as SessionId;
}

export function asConversationId(value: string): ConversationId {
  return value as ConversationId;
}

export function asTurnId(value: string): TurnId {
  return value as TurnId;
}

export function asProposalId(value: string): ProposalId {
  return value as ProposalId;
}

export function asDecisionId(value: string): DecisionId {
  return value as DecisionId;
}

export function asOutcomeId(value: string): OutcomeId {
  return value as OutcomeId;
}

export function asTraceId(value: string): TraceId {
  return value as TraceId;
}

export function asCorrelationId(value: string): CorrelationId {
  return value as CorrelationId;
}

export function asExpressionId(value: string): ExpressionId {
  return value as ExpressionId;
}

export function asTaskId(value: string): TaskId {
  return value as TaskId;
}

export function asBlockId(value: string): BlockId {
  return value as BlockId;
}

export function asEventId(value: string): EventId {
  return value as EventId;
}
