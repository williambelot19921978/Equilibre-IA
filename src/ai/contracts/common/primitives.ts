/**
 * Shared primitives for engine contracts — Sprint A2.
 */

import type { CorrelationId } from './ids.ts';

/** ISO-8601 timestamp string */
export type IsoTimestamp = string & { readonly __brand: 'IsoTimestamp' };

export function asIsoTimestamp(value: string): IsoTimestamp {
  return value as IsoTimestamp;
}

/** Semantic version of a contract (semver) */
export type ContractVersion = string & { readonly __brand: 'ContractVersion' };

export const CONTRACT_VERSION_V1 = '1.0.0' as ContractVersion;

/** Confidence score 0..1 — Loi 5 */
export type Confidence = number & { readonly __brand: 'Confidence' };

export function asConfidence(value: number): Confidence {
  if (value < 0 || value > 1) {
    throw new RangeError('Confidence must be between 0 and 1');
  }
  return value as Confidence;
}

/** Autonomy level 1 (manual) .. 4 (autonomous) — Loi 6 */
export type AutonomyLevel = 1 | 2 | 3 | 4;

export type EngineId =
  | 'conversation-engine'
  | 'intent-engine'
  | 'personal-language-memory-engine'
  | 'human-model-engine'
  | 'household-engine'
  | 'planning-context-engine'
  | 'constraint-engine'
  | 'availability-engine'
  | 'goal-engine'
  | 'life-event-engine'
  | 'reasoning-engine'
  | 'decision-engine'
  | 'action-proposal-engine'
  | 'scheduler-engine'
  | 'recommendation-engine'
  | 'knowledge-engine'
  | 'natural-response-engine'
  | 'notification-engine'
  | 'universal-learning-engine'
  | 'outcome-observation-engine';

export type EngineContractMeta = {
  readonly id: EngineId;
  readonly pipelineNumber: number;
  readonly contractVersion: ContractVersion;
  readonly invariants: readonly string[];
};

export type Result<T, E = ContractError> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export type ContractErrorCode =
  | 'INVALID_INPUT'
  | 'INVARIANT_VIOLATION'
  | 'DEPENDENCY_UNAVAILABLE'
  | 'CONFIRMATION_REQUIRED'
  | 'HARD_CONSTRAINT_VIOLATION'
  | 'AMBIGUOUS_INTENT'
  | 'PII_DETECTED'
  | 'GATE_REJECTED'
  | 'CORRELATION_FAILED'
  | 'UNAUTHORIZED_MEMORY_ROUTE'
  | 'NOT_IMPLEMENTED';

export type ContractError = {
  readonly code: ContractErrorCode;
  readonly message: string;
  readonly engineId: EngineId;
  readonly correlationId?: CorrelationId;
};

export function contractError(
  engineId: EngineId,
  code: ContractErrorCode,
  message: string,
  correlationId?: CorrelationId,
): ContractError {
  return { code, message, engineId, correlationId };
}
