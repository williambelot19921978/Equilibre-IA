export type { IAnonymizationGate, AnonymizationGateConfig, GateAuditRecord, GateInput, GateOutput, GateRejectionReason, GateResult, PiiDetectionResult } from './anonymization-gate.ts';
export { ANONYMIZATION_GATE_CONTRACT_VERSION } from './anonymization-gate.ts';
export type {
  BehaviorSignal,
  GoalFeedbackSignal,
  LanguageConfirmationSignal,
  PersonalSignal,
  PersonalSignalBase,
  PersonalSignalProducer,
  RejectPersonalForUniversal,
} from './personal-signal.ts';
export { isPersonalSignal } from './personal-signal.ts';
export type {
  AnonymizedCandidate,
  GatePassedUniversalSignal,
  UniversalHint,
  UniversalIntentPattern,
  UniversalLearningInput,
  UniversalSignal,
  UniversalSignalBase,
  UniversalStrategy,
} from './universal-signal.ts';
export { isGatePassedUniversalSignal } from './universal-signal.ts';

/** Dual Memory boundary marker for documentation and tests */
export type DualMemoryBoundary = {
  readonly personal: 'Personal Memory — RLS household';
  readonly universal: 'Universal Learning — gate required';
  readonly forbidden: 'direct personal → universal';
};

export const DUAL_MEMORY_BOUNDARY: DualMemoryBoundary = {
  personal: 'Personal Memory — RLS household',
  universal: 'Universal Learning — gate required',
  forbidden: 'direct personal → universal',
};
