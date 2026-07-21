/**
 * Personal Memory signals — MUST NOT flow to Universal Learning without gate.
 */

import type { Confidence, EngineId } from '../common/primitives.ts';
import type { MemberId, HouseholdId, ExpressionId } from '../common/ids.ts';
import type { MemoryRoute, SignalProvenance, SensitivityLevel } from '../common/consent.ts';

/** Discriminant — incompatible with UniversalSignal at type level */
export type PersonalMemoryTier = { readonly __memoryTier: 'personal' };

export type PersonalSignalBase = PersonalMemoryTier & {
  readonly memberId: MemberId;
  readonly householdId: HouseholdId;
  readonly sensitivity: SensitivityLevel;
  readonly provenance: SignalProvenance;
  readonly observedAt: string;
};

export type BehaviorSignal = PersonalSignalBase & {
  readonly kind: 'behavior';
  readonly signalType: string;
  readonly confidence: Confidence;
  readonly route: MemoryRoute;
};

export type GoalFeedbackSignal = PersonalSignalBase & {
  readonly kind: 'goal_feedback';
  readonly goalKey: string;
  readonly outcome: 'advanced' | 'stalled' | 'ignored' | 'unknown';
};

export type LanguageConfirmationSignal = PersonalSignalBase & {
  readonly kind: 'language_confirmation';
  readonly expressionId: ExpressionId;
  readonly confirmed: boolean;
};

export type PersonalSignal = BehaviorSignal | GoalFeedbackSignal | LanguageConfirmationSignal;

export function isPersonalSignal(value: { readonly __memoryTier?: unknown }): value is PersonalSignal {
  return value.__memoryTier === 'personal';
}

/** Compile-time guard: PersonalSignal cannot be assigned where Universal input expected */
export type RejectPersonalForUniversal<T> = T extends PersonalMemoryTier ? never : T;

export type PersonalSignalProducer = EngineId | 'action-execution-layer' | 'ui';
