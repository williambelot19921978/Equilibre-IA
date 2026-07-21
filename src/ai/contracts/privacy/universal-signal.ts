/**
 * Universal Learning signals — NO memberId, NO householdId, NO PII fields.
 */

import type { Confidence, ContractVersion } from '../common/primitives.ts';
import type { SignalProvenance, CohortThreshold } from '../common/consent.ts';

/** Discriminant — distinct from PersonalSignal */
export type UniversalMemoryTier = { readonly __memoryTier: 'universal' };

export type UniversalSignalBase = UniversalMemoryTier & {
  readonly patternKey: string;
  readonly confidence: Confidence;
  readonly cohortThreshold: CohortThreshold;
  readonly provenance: Omit<SignalProvenance, 'memberId' | 'householdId'>;
  readonly generalizedAt: string;
};

export type UniversalHint = UniversalSignalBase & {
  readonly kind: 'language_hint';
  readonly normalizedPhrase: string;
  readonly conceptKey: string;
};

export type UniversalStrategy = UniversalSignalBase & {
  readonly kind: 'planning_strategy';
  readonly strategyKey: string;
};

export type UniversalIntentPattern = UniversalSignalBase & {
  readonly kind: 'intent_pattern';
  readonly intentKey: string;
};

export type AnonymizedCandidate = UniversalSignalBase & {
  readonly kind: 'candidate';
  readonly candidateVersion: ContractVersion;
  readonly route: 'universal_candidate';
};

/** After AnonymizationGate — only this may enter UniversalLearningEngine */
export type GatePassedUniversalSignal = UniversalSignalBase & {
  readonly __gatePassed: true;
  readonly gateAuditId: string;
  readonly passedAt: string;
};

export type UniversalSignal =
  | UniversalHint
  | UniversalStrategy
  | UniversalIntentPattern
  | GatePassedUniversalSignal;

export function isGatePassedUniversalSignal(
  value: UniversalSignal | AnonymizedCandidate,
): value is GatePassedUniversalSignal {
  return '__gatePassed' in value && value.__gatePassed === true;
}

/** Personal signals are structurally rejected */
export type UniversalLearningInput = GatePassedUniversalSignal;
